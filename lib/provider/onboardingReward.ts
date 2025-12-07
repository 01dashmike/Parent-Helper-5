"use server";

import { getSupabaseServer } from "@/lib/supabase.server";
import { sendTransactional } from "@/lib/emails/sendTransactional";

/**
 * Award provider onboarding reward when they publish their first class
 * Only awarded once per provider, when:
 * 1. Provider creates their first class (is_published = true)
 * 2. Onboarding step 2 is marked complete
 */
export async function awardOnboardingReward(
  providerId: number,
  classId: number
): Promise<{ ok: boolean; reward?: Record<string, unknown>; error?: string }> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, error: "Supabase not configured" };
    }

    // Check if provider already has an onboarding reward
    const { data: existingReward } = await supabase
      .from("provider_rewards")
      .select("id")
      .eq("provider_id", providerId)
      .eq("reward_type", "provider_onboarding")
      .maybeSingle();

    if (existingReward) {
      // Already awarded, skip
      return { ok: true, reward: existingReward };
    }

    // Check onboarding status - step 2 must be complete
    const { data: onboarding } = await supabase
      .from("provider_onboarding")
      .select("completed_steps")
      .eq("provider_id", providerId)
      .single();

    if (!onboarding) {
      return { ok: false, error: "Onboarding record not found" };
    }

    const completedSteps = (onboarding.completed_steps || []) as string[];
    if (!completedSteps.includes("step2")) {
      // Step 2 not complete yet, don't award
      return { ok: false, error: "Onboarding step 2 not complete" };
    }

    // Check if this is the provider's first published class
    // We check if there's exactly 1 published class (the one just created)
    const { count } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("is_published", true);

    if (count === null || count !== 1) {
      // Not the first published class, or error counting
      // If count > 1, there were already published classes before this one
      return { ok: false, error: "Not the first published class" };
    }

    // Get provider info for email
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, contact_email")
      .eq("id", providerId)
      .single();

    if (!provider) {
      return { ok: false, error: "Provider not found" };
    }

    // Award value (configurable via env, default 200 cents = £2)
    const rewardValueCents = parseInt(
      process.env.PROVIDER_ONBOARDING_REWARD_CENTS || "200",
      10
    );

    // Create reward
    const { data: reward, error: rewardError } = await supabase
      .from("provider_rewards")
      .insert({
        provider_id: providerId,
        reward_type: "provider_onboarding",
        reward_value: rewardValueCents,
        reason: "Published first class during onboarding",
        metadata: {
          source: "provider_onboarding",
          class_id: classId,
        },
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single();

    if (rewardError) {
      console.error("Error creating onboarding reward:", rewardError);
      return { ok: false, error: "Failed to create reward" };
    }

    // Send welcome reward email
    if (provider.contact_email) {
      const rewardAmount = (rewardValueCents / 100).toFixed(2);
      try {
        await sendTransactional({
          to: provider.contact_email,
          subject: "🎉 Welcome Reward - You've earned £" + rewardAmount + "!",
          html: `
            <h2>Congratulations!</h2>
            <p>You've earned a <strong>£${rewardAmount} onboarding reward</strong> for publishing your first class!</p>
            <p>This reward has been added to your account and can be used towards:</p>
            <ul>
              <li>Featured listings</li>
              <li>Class boosts</li>
              <li>Other premium features</li>
            </ul>
            <p>Your reward will expire in 90 days, so make sure to use it soon!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider">View your dashboard</a></p>
          `,
          text: `Congratulations! You've earned a £${rewardAmount} onboarding reward for publishing your first class! This reward has been added to your account. View your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider`,
          type: "provider_reward",
        });
      } catch (error) {
        console.error("[email-error]", {
          template: "provider_onboarding_reward",
          to: provider.contact_email,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't fail the reward creation if email fails
      }
    }

    return { ok: true, reward };
  } catch (error: unknown) {
    console.error("Error in awardOnboardingReward:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

