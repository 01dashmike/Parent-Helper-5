/**
 * Referral Reward Application
 * 
 * Idempotent reward application with campaign awareness
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { createReward } from "./createReward";
import { getCampaign, type ReferralCampaign } from "./campaigns";
import { addCredits } from "@/lib/wallet/core";

/**
 * Apply a referral reward once (idempotent)
 * 
 * @param params - Reward application parameters
 * @returns Success status and reward details
 */
export async function applyReferralRewardOnce(params: {
  referralId: string | number;
  campaignId?: string | null;
  userId?: string | null;
  providerId?: number | null;
  event: "first_booking" | "first_payment" | "signup" | "listing_created";
  referralType: "member" | "provider";
}): Promise<{
  ok: boolean;
  rewardApplied: boolean;
  reward?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, rewardApplied: false, error: "Supabase not configured" };
    }

    const { referralId, campaignId, userId, providerId, event, referralType } = params;
    const campaign = getCampaign(campaignId);

    // Check if reward already applied (idempotency check)
    const idempotencyKey = `referral_${referralId}_${campaign.id}_${event}_${referralType}`;

    // For provider referrals, check provider_referrals table
    if (referralType === "provider" && providerId) {
      const { data: referral } = await supabase
        .from("provider_referrals")
        .select("id, reward_issued, status, metadata")
        .eq("id", referralId)
        .maybeSingle();

      if (!referral) {
        return { ok: false, rewardApplied: false, error: "Referral not found" };
      }

      // Check if reward already issued
      if (referral.reward_issued) {
        return { ok: true, rewardApplied: false }; // Already rewarded
      }

      // Check if event matches campaign trigger
      const rewardRule = campaign.rewardRules.referrerReward;
      if (rewardRule.trigger !== event) {
        return { ok: true, rewardApplied: false }; // Event doesn't trigger reward
      }

      // Apply reward based on campaign rules
      if (rewardRule.type === "none") {
        return { ok: true, rewardApplied: false };
      }

      // Apply reward
      const rewardResult = await createReward(
        providerId,
        `Referral reward: ${event} (Campaign: ${campaign.name})`
      );

      if (!rewardResult.ok) {
        return { ok: false, rewardApplied: false, error: rewardResult.error };
      }

      // Mark reward as issued
      await supabase
        .from("provider_referrals")
        .update({
          reward_issued: true,
          metadata: {
            ...((referral.metadata as Record<string, unknown>) || {}),
            rewardAppliedAt: new Date().toISOString(),
            rewardEvent: event,
            campaignId: campaign.id,
          },
        })
        .eq("id", referralId);

      return { ok: true, rewardApplied: true, reward: rewardResult.reward };
    }

    // For member referrals, check member_referrals table
    if (referralType === "member" && userId) {
      const { data: referral } = await supabase
        .from("member_referrals")
        .select("id, reward_triggered, status, referrer_user_id, metadata")
        .eq("id", referralId)
        .maybeSingle();

      if (!referral) {
        return { ok: false, rewardApplied: false, error: "Referral not found" };
      }

      // Check if reward already triggered
      if (referral.reward_triggered) {
        return { ok: true, rewardApplied: false }; // Already rewarded
      }

      // Check if event matches campaign trigger
      const rewardRule = campaign.rewardRules.referrerReward;
      if (rewardRule.trigger !== event) {
        return { ok: true, rewardApplied: false }; // Event doesn't trigger reward
      }

      // Apply reward to referrer
      if (rewardRule.type === "credit" && rewardRule.value && referral.referrer_user_id) {
        const creditResult = await addCredits(
          referral.referrer_user_id,
          rewardRule.value,
          {
            type: "bonus",
            description: `Referral reward: ${event} (Campaign: ${campaign.name})`,
            referralId: referral.id.toString(),
            campaignId: campaign.id,
            event,
          }
        );

        if (!creditResult.success) {
          return { ok: false, rewardApplied: false, error: creditResult.error };
        }
      }

      // Apply reward to referred user (if campaign has referredReward)
      if (campaign.rewardRules.referredReward && userId) {
        const referredReward = campaign.rewardRules.referredReward;
        if (referredReward.trigger === event && referredReward.type === "credit" && referredReward.value) {
          const creditResult = await addCredits(
            userId,
            referredReward.value,
            {
              type: "bonus",
              description: `Referral reward: ${event} (Campaign: ${campaign.name})`,
              referralId: referral.id.toString(),
              campaignId: campaign.id,
              event,
            }
          );

          if (!creditResult.success) {
            console.error("[applyReferralRewardOnce] Error applying referred user reward:", creditResult.error);
            // Don't fail the whole operation if referred reward fails
          }
        }
      }

      // Mark reward as triggered
      await supabase
        .from("member_referrals")
        .update({
          reward_triggered: true,
          status: "converted",
          converted_at: new Date().toISOString(),
          metadata: {
            ...((referral.metadata as Record<string, unknown>) || {}),
            rewardAppliedAt: new Date().toISOString(),
            rewardEvent: event,
            campaignId: campaign.id,
          },
        })
        .eq("id", referralId);

      return { ok: true, rewardApplied: true };
    }

    return { ok: false, rewardApplied: false, error: "Invalid referral type or missing user/provider ID" };
  } catch (error: unknown) {
    console.error("[applyReferralRewardOnce] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, rewardApplied: false, error: errorMessage };
  }
}

