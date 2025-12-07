/**
 * Stripe Products Configuration
 * 
 * Defines all Stripe products and prices for monetization
 */

export type ProductType = "featured_listing" | "verified_badge" | "premium_analytics" | "franchise_boost";

export type BillingPeriod = "monthly" | "quarterly" | "annually";

export const STRIPE_PRODUCTS = {
  featured_listing: {
    name: "Featured Listing",
    description: "Top placement in search results with highlighted badge",
    prices: {
      monthly: {
        amount: 4900, // £49/month
        currency: "gbp",
      },
      quarterly: {
        amount: 13230, // £132.30/quarter (10% discount)
        currency: "gbp",
      },
      annually: {
        amount: 47040, // £470.40/year (20% discount)
        currency: "gbp",
      },
    },
  },
  verified_badge: {
    name: "Verified Provider Badge",
    description: "Trust signal with ranking boost and highlighted checkmark",
    prices: {
      monthly: {
        amount: 1990, // £19.90/month
        currency: "gbp",
      },
      quarterly: {
        amount: 5373, // £53.73/quarter (10% discount)
        currency: "gbp",
      },
      annually: {
        amount: 19104, // £191.04/year (20% discount)
        currency: "gbp",
      },
    },
  },
  premium_analytics: {
    name: "Premium Analytics",
    description: "Full insights including ranking visibility, competitor comparison, and conversion trends",
    prices: {
      monthly: {
        amount: 2990, // £29.90/month
        currency: "gbp",
      },
      quarterly: {
        amount: 8073, // £80.73/quarter (10% discount)
        currency: "gbp",
      },
      annually: {
        amount: 28704, // £287.04/year (20% discount)
        currency: "gbp",
      },
    },
  },
  franchise_boost: {
    name: "Franchise Bulk Boost",
    description: "Bulk featured listing for multiple franchise locations",
    prices: {
      monthly: {
        amount: 49000, // £490/month for 10 locations
        currency: "gbp",
        quantity: 10,
      },
      quarterly: {
        amount: 132300, // £1,323/quarter (10% discount)
        currency: "gbp",
        quantity: 10,
      },
      annually: {
        amount: 470400, // £4,704/year (20% discount)
        currency: "gbp",
        quantity: 10,
      },
    },
  },
} as const;

/**
 * Get Stripe price ID from environment or return placeholder
 * In production, these should be set in Stripe and stored in env vars
 */
export function getStripePriceId(productType: ProductType, billingPeriod: BillingPeriod): string {
  const envKey = `STRIPE_PRICE_${productType.toUpperCase()}_${billingPeriod.toUpperCase()}`;
  return process.env[envKey] || `price_${productType}_${billingPeriod}`;
}

/**
 * Get product configuration
 */
export function getProductConfig(productType: ProductType) {
  return STRIPE_PRODUCTS[productType];
}

/**
 * Calculate prorated amount for upgrade/downgrade
 */
export function calculateProratedAmount(
  currentAmount: number,
  newAmount: number,
  daysRemaining: number,
  totalDays: number
): number {
  const credit = Math.round((currentAmount * daysRemaining) / totalDays);
  const charge = newAmount - credit;
  return Math.max(0, charge);
}





