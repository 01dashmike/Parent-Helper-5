"use server";

import { getSupabaseServer } from "@/lib/supabase.server";
import { sendTransactional } from "@/lib/emails/sendTransactional";

/**
 * Create a reward for a provider based on referral conversion
 */
export async function createReward(
  providerId: number,
  reason: string
): Promise<{ ok: boolean; reward?: Record<string, unknown>; error?: string }> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, error: "Supabase not configured" };
    }

    // Get provider info
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, contact_email")
      .eq("id", providerId)
      .single();

    if (!provider) {
      return { ok: false, error: "Provider not found" };
    }

    // Check how many paid boosts the provider has used
    // For now, we'll check if they have any featured listings
    const { data: featuredListings } = await supabase
      .from("featured_listings")
      .select("id")
      .eq("provider_id", providerId)
      .limit(3);

    const hasLessThan3Boosts = !featuredListings || featuredListings.length < 3;

    // Determine reward type
    let rewardType: "free_boost" | "credit";
    let rewardValue: number;

    if (hasLessThan3Boosts) {
      rewardType = "free_boost";
      rewardValue = 1; // 1 free boost
    } else {
      rewardType = "credit";
      rewardValue = 1500; // £15 in pence
    }

    // Create reward
    const { data: reward, error } = await supabase
      .from("provider_rewards")
      .insert({
        provider_id: providerId,
        reward_type: rewardType,
        reward_value: rewardValue,
        reason,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reward:", error);
      return { ok: false, error: "Failed to create reward" };
    }

    // Send email notification
    if (provider.contact_email) {
      const rewardDescription =
        rewardType === "free_boost"
          ? "1 free boost for your listings"
          : `£${(rewardValue / 100).toFixed(2)} credit`;

      try {
        await sendTransactional({
          to: provider.contact_email,
          subject: "🎉 You earned a reward!",
          html: `
            <h2>Congratulations!</h2>
            <p>You've earned a reward: <strong>${rewardDescription}</strong></p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Your reward will expire in 90 days. Use it to boost your listings or apply it to your account balance.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/dashboard/referrals">View your rewards</a></p>
        `,
        text: `Congratulations! You've earned a reward: ${rewardDescription}. Reason: ${reason}. View your rewards: ${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/dashboard/referrals`,
        type: "provider_reward",
        });
      } catch (error) {
        console.error("[email-error]", {
          template: "provider_reward",
          to: provider.contact_email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { ok: true, reward };
  } catch (error: unknown) {
    console.error("Error in createReward:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

