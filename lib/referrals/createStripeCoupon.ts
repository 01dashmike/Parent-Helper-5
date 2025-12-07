import { stripe } from "@/lib/stripe/client";

/**
 * Create a 10% discount Stripe coupon for provider referral rewards
 * 
 * @param couponId - Unique identifier for the coupon (e.g., referral code or ID)
 * @returns Stripe coupon ID or error
 */
export async function createProviderReferralCoupon(
  couponId: string
): Promise<{ ok: true; couponId: string } | { ok: false; error: string }> {
  try {

    // Create a 10% off coupon
    const coupon = await stripe.coupons.create({
      id: `provider_ref_${couponId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`,
      percent_off: 10,
      duration: "once", // One-time use
      name: "Provider Referral Reward - 10% Off",
      metadata: {
        type: "provider_referral_reward",
        referral_id: couponId,
      },
    });

    return { ok: true, couponId: coupon.id };
  } catch (error: unknown) {
    console.error("Error creating Stripe coupon:", error);
    
    // Handle case where coupon ID already exists
    type StripeError = { code?: string; message?: string };
    const stripeError = error as StripeError;
    if (stripeError?.code === "resource_already_exists") {
      // Try to retrieve existing coupon
      try {
        const existingCouponId = `provider_ref_${couponId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
        const coupon = await stripe.coupons.retrieve(existingCouponId);
        return { ok: true, couponId: coupon.id };
      } catch {
        return { ok: false, error: "Failed to create or retrieve coupon" };
      }
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create Stripe coupon",
    };
  }
}

