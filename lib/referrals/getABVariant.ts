/**
 * Get A/B test variant for a provider based on provider_id % 2
 * Variant A: even provider_ids
 * Variant B: odd provider_ids
 */
export function getABVariant(providerId: number): "A" | "B" {
  return providerId % 2 === 0 ? "A" : "B";
}

/**
 * Get referral CTA text based on variant
 */
export function getReferralCTAText(variant: "A" | "B"): string {
  return variant === "A"
    ? "Invite another provider → earn free boosts."
    : "Grow your presence → help parents discover more classes.";
}

