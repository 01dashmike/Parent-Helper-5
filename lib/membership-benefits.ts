import { createClient } from "@/lib/supabase/server";

export type SubscriptionTier = "FREE" | "PLUS" | "PREMIUM";

export interface MembershipBenefits {
  walletCreditBonusPercent: number; // e.g., 10 for 10%
  hasExclusiveBlogs: boolean;
  hasDiscountedClasses: boolean;
}

/**
 * Get membership benefits for a subscription tier
 */
export function getMembershipBenefits(tier: SubscriptionTier): MembershipBenefits {
  switch (tier) {
    case "PREMIUM":
      return {
        walletCreditBonusPercent: 20,
        hasExclusiveBlogs: true,
        hasDiscountedClasses: true,
      };
    case "PLUS":
      return {
        walletCreditBonusPercent: 10,
        hasExclusiveBlogs: false,
        hasDiscountedClasses: false,
      };
    case "FREE":
    default:
      return {
        walletCreditBonusPercent: 0,
        hasExclusiveBlogs: false,
        hasDiscountedClasses: false,
      };
  }
}

/**
 * Get user's subscription tier
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const supabase = createClient();
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("subscription_tier, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return "FREE";
  }

  return (subscription.subscription_tier as SubscriptionTier) || "FREE";
}

/**
 * Calculate wallet credit bonus for a booking amount
 */
export function calculateWalletCreditBonus(
  amountCents: number,
  tier: SubscriptionTier
): number {
  const benefits = getMembershipBenefits(tier);
  if (benefits.walletCreditBonusPercent === 0) {
    return 0;
  }

  return Math.floor((amountCents * benefits.walletCreditBonusPercent) / 100);
}

