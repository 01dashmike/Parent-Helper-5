/**
 * Referral Campaign Configuration
 * 
 * Centralized configuration for referral campaigns:
 * - Campaign definitions (id, name, reward rules, targeting)
 * - Default campaign that mirrors current behavior
 * - Easy to extend with new campaigns
 */

import { z } from "zod";

/**
 * Reward rule configuration
 */
export const RewardRuleSchema = z.object({
  // Who gets rewarded
  referrerReward: z.object({
    type: z.enum(["credit", "free_boost", "stripe_coupon", "none"]),
    value: z.number().optional(), // Amount in pence for credit, count for boost, etc.
    trigger: z.enum(["clicked", "registered", "listing_created", "first_booking", "first_payment"]),
  }),
  referredReward: z.object({
    type: z.enum(["credit", "free_boost", "stripe_coupon", "none"]),
    value: z.number().optional(),
    trigger: z.enum(["signup", "first_booking", "first_payment"]),
  }).optional(),
});

export type RewardRule = z.infer<typeof RewardRuleSchema>;

/**
 * Campaign targeting configuration
 */
export const CampaignTargetingSchema = z.object({
  // Who can use this campaign
  userTypes: z.array(z.enum(["member", "provider", "both"])).default(["both"]),
  // Optional date range
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  // Optional geographic targeting
  regions: z.array(z.string()).optional(),
});

export type CampaignTargeting = z.infer<typeof CampaignTargetingSchema>;

/**
 * Referral campaign definition
 */
export const ReferralCampaignSchema = z.object({
  id: z.string(), // Unique campaign identifier (e.g., "default", "double-sided-provider")
  slug: z.string(), // URL-friendly slug
  name: z.string(), // Display name
  description: z.string().optional(),
  active: z.boolean().default(true),
  rewardRules: RewardRuleSchema,
  targeting: CampaignTargetingSchema.optional(),
  metadata: z.record(z.unknown()).optional(), // Additional campaign-specific data
});

export type ReferralCampaign = z.infer<typeof ReferralCampaignSchema>;

/**
 * Default campaign configuration
 * Mirrors current behavior:
 * - Provider referrals: reward on first_booking (free_boost or £15 credit)
 * - Member referrals: reward on first_booking (£5 credit for both)
 */
export const DEFAULT_CAMPAIGN: ReferralCampaign = {
  id: "default",
  slug: "default",
  name: "Default Referral Campaign",
  description: "Standard referral rewards for providers and members",
  active: true,
  rewardRules: {
    referrerReward: {
      type: "free_boost", // Falls back to credit if provider has 3+ boosts
      value: 1, // 1 free boost
      trigger: "first_booking",
    },
    referredReward: {
      type: "credit",
      value: 500, // £5 in pence
      trigger: "first_booking",
    },
  },
  targeting: {
    userTypes: ["both"],
  },
  metadata: {
    legacy: true, // Mark as legacy to preserve existing behavior
  },
};

/**
 * Example: Double-sided provider campaign
 * Both referrer and referred provider get rewards
 */
export const DOUBLE_SIDED_PROVIDER_CAMPAIGN: ReferralCampaign = {
  id: "double-sided-provider",
  slug: "double-sided-provider",
  name: "Double-Sided Provider Campaign",
  description: "Both referrer and referred provider get rewards",
  active: false, // Disabled by default
  rewardRules: {
    referrerReward: {
      type: "credit",
      value: 2000, // £20
      trigger: "first_booking",
    },
    referredReward: {
      type: "credit",
      value: 2000, // £20
      trigger: "first_booking",
    },
  },
  targeting: {
    userTypes: ["provider"],
  },
};

/**
 * Campaign registry
 * All available campaigns (active and inactive)
 */
export const REFERRAL_CAMPAIGNS: Record<string, ReferralCampaign> = {
  default: DEFAULT_CAMPAIGN,
  "double-sided-provider": DOUBLE_SIDED_PROVIDER_CAMPAIGN,
};

/**
 * Get campaign by ID
 * Returns default campaign if not found
 */
export function getCampaign(campaignId?: string | null): ReferralCampaign {
  if (!campaignId) {
    return DEFAULT_CAMPAIGN;
  }
  return REFERRAL_CAMPAIGNS[campaignId] || DEFAULT_CAMPAIGN;
}

/**
 * Get active campaigns
 */
export function getActiveCampaigns(): ReferralCampaign[] {
  return Object.values(REFERRAL_CAMPAIGNS).filter(c => c.active);
}

/**
 * Check if campaign is valid for user type
 */
export function isCampaignValidForUserType(
  campaign: ReferralCampaign,
  userType: "member" | "provider"
): boolean {
  const targeting = campaign.targeting;
  if (!targeting) {
    return true; // No targeting = valid for all
  }

  const userTypes = targeting.userTypes || ["both"];
  return (
    userTypes.includes("both") ||
    userTypes.includes(userType)
  );
}

/**
 * Check if campaign is currently active (within date range)
 */
export function isCampaignActive(campaign: ReferralCampaign): boolean {
  if (!campaign.active) {
    return false;
  }

  const targeting = campaign.targeting;
  if (!targeting) {
    return true;
  }

  const now = new Date();

  if (targeting.validFrom) {
    const validFrom = new Date(targeting.validFrom);
    if (now < validFrom) {
      return false;
    }
  }

  if (targeting.validUntil) {
    const validUntil = new Date(targeting.validUntil);
    if (now > validUntil) {
      return false;
    }
  }

  return true;
}







