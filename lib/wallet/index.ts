/**
 * Wallet System - Performance Optimized Exports
 * 
 * Centralized exports for the wallet system with:
 * - Core wallet operations
 * - Credit redemptions
 * - Pass management
 * - Provider settings
 * - Caching utilities
 * 
 * @module lib/wallet
 */

// =============================================================================
// Core Wallet Operations
// =============================================================================
export {
  getParentWallet,
  addCredits,
  spendCredits,
  grantBonusCredits,
  getWalletLedger,
  type Wallet,
  type LedgerEntry,
  type AddCreditsResult,
  type SpendCreditsResult,
} from "./core";

// Alternative exports from wallet.ts (if using that version)
export {
  getOrCreateWallet,
  getBalance,
} from "./wallet";

// =============================================================================
// Credit Redemptions
// =============================================================================
export {
  redeemCreditsForBooking,
  redeemPassForBooking,
  refundCreditsForBooking,
} from "./redemption";

export {
  getBookingRedemption,
} from "./redemptions";

// =============================================================================
// Pass Management
// =============================================================================
export {
  createPass,
  getActivePass,
  getUserActivePasses,
  isPassActive,
  canUsePassForClass,
  deactivatePass,
  type ParentPass,
  type ClassMetadata,
  type DeactivatePassResult,
} from "./passes";

// =============================================================================
// Provider Credit Settings
// =============================================================================
export {
  getProviderCreditSettings,
  updateProviderCreditSettings,
  providerAcceptsCredits,
  creditCostForClass,
  type ProviderCreditSettings,
  type ProviderCreditSettingsPayload,
} from "./providerCredits";

// =============================================================================
// Eligibility & Configuration
// =============================================================================
export {
  checkEligibility,
  canUseCreditsForBooking,
  canUsePassForBooking,
  type EligibilityResult,
} from "./eligibility";

export {
  getWalletConfig,
  DEFAULT_WALLET_CONFIG,
  EXAMPLE_TIER_CONFIG,
  EXAMPLE_EXPIRY_RULE,
  EXAMPLE_ROLLOVER_RULE,
  type WalletConfig,
  type WalletTier,
  type ExpiryRule,
  type RolloverRule,
} from "./config";

// =============================================================================
// Tiers, Expiry, Rollover
// =============================================================================
export {
  calculateUserTier,
  type UserTierResult,
} from "./tiers";

export {
  computeExpiryForTransaction,
  processExpiredCredits,
} from "./expiry";

export {
  processMonthlyRollover,
  calculateRolloverAmount,
} from "./rollover";

// =============================================================================
// Types
// =============================================================================
export {
  type WalletMetadata,
  type WalletActionResult,
  type WalletLedgerRow,
  type ParentWalletRow,
  type ParentPassRow,
  type ProviderCreditSettingsRow,
} from "./types";

// =============================================================================
// Caching Utilities (Advanced)
// =============================================================================
export {
  cacheProviderSettings,
  cacheWalletBalance,
  cacheUserPasses,
  getProviderSettingsFromMemCache,
  setProviderSettingsInMemCache,
  clearProviderSettingsMemCache,
  WALLET_CACHE_KEYS,
  WALLET_CACHE_TAGS,
  WALLET_CACHE_TTL,
} from "./cache";




