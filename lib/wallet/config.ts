/**
 * Wallet Configuration
 * 
 * Centralized configuration for wallet system features:
 * - Tiers (Bronze/Silver/Gold)
 * - Expiry rules
 * - Rollover rules
 * 
 * All features are optional and default to "disabled" to preserve existing behavior.
 */

/**
 * Wallet tier definition
 */
export type WalletTier = {
  id: string;
  name: string;
  minBalance?: number; // Minimum balance to achieve this tier
  minTotalSpent?: number; // Alternative: minimum total spent in history
  benefits?: string[]; // Optional list of benefits
};

/**
 * Expiry rule configuration
 */
export type ExpiryRule = {
  enabled: boolean;
  daysAfterPurchase?: number; // Credits expire N days after purchase
  daysAfterGrant?: number; // Credits expire N days after being granted (bonus, etc.)
  exemptTypes?: string[]; // Transaction types that never expire (e.g., ["purchase", "refund"])
};

/**
 * Rollover rule configuration
 */
export type RolloverRule = {
  enabled: boolean;
  maxRolloverAmount?: number; // Maximum credits that can roll over
  rolloverPercentage?: number; // Percentage of unused credits that can roll over (0-100)
  exemptTypes?: string[]; // Transaction types that are excluded from rollover calculations
};

/**
 * Wallet system configuration
 * 
 * Defaults preserve existing behavior (no tiers, no expiry, no rollover)
 */
export type WalletConfig = {
  tiers: {
    enabled: boolean;
    definitions: WalletTier[];
  };
  expiry: ExpiryRule;
  rollover: RolloverRule;
};

/**
 * Default wallet configuration
 * 
 * Matches current behavior: no tiers, no expiry, no rollover limits
 */
export const DEFAULT_WALLET_CONFIG: WalletConfig = {
  tiers: {
    enabled: false,
    definitions: [],
  },
  expiry: {
    enabled: false,
  },
  rollover: {
    enabled: false,
  },
};

/**
 * Example tier configuration (disabled by default)
 * 
 * Uncomment and customize to enable tiers:
 */
export const EXAMPLE_TIER_CONFIG: WalletTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minBalance: 0,
    benefits: ["Standard support"],
  },
  {
    id: "silver",
    name: "Silver",
    minBalance: 50,
    benefits: ["Priority support", "5% bonus on purchases"],
  },
  {
    id: "gold",
    name: "Gold",
    minBalance: 200,
    benefits: ["Premium support", "10% bonus on purchases", "Exclusive offers"],
  },
];

/**
 * Example expiry configuration (disabled by default)
 * 
 * Uncomment and customize to enable expiry:
 */
export const EXAMPLE_EXPIRY_RULE: ExpiryRule = {
  enabled: false,
  daysAfterPurchase: 365, // Credits expire 1 year after purchase
  daysAfterGrant: 180, // Bonus credits expire 6 months after being granted
  exemptTypes: ["refund", "admin_adjustment"], // Refunds and admin adjustments never expire
};

/**
 * Example rollover configuration (disabled by default)
 * 
 * Uncomment and customize to enable rollover:
 */
export const EXAMPLE_ROLLOVER_RULE: RolloverRule = {
  enabled: false,
  maxRolloverAmount: 100, // Maximum 100 credits can roll over
  rolloverPercentage: 50, // 50% of unused credits can roll over
  exemptTypes: ["expiry", "admin_adjustment"], // Expired credits and admin adjustments don't roll over
};

/**
 * Get the current wallet configuration
 * 
 * This function can be extended to read from environment variables,
 * database, or feature flags. For now, returns the default config.
 */
export function getWalletConfig(): WalletConfig {
  // TODO: In future, this could read from:
  // - Environment variables (WALLET_TIERS_ENABLED, etc.)
  // - Database configuration table
  // - Feature flags
  
  return DEFAULT_WALLET_CONFIG;
}




