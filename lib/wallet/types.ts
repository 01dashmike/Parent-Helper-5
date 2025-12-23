/**
 * Shared Wallet System Types
 * 
 * Common types used across wallet modules
 */

/**
 * Standard result type for wallet operations
 */
export type WalletActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wallet metadata for ledger entries
 */
export type WalletMetadata = {
  type?: "purchase" | "spend" | "refund" | "bonus" | "expiry" | "admin_adjustment" | "pass_purchase" | "pass_usage";
  description?: string;
  bookingId?: string | number;
  providerId?: string | number;
  classId?: string | number;
  passId?: string | number;
  promoCode?: string;
  reason?: string;
  [key: string]: unknown;
};

/**
 * Database row types (from Supabase)
 */
export type WalletLedgerRow = {
  id: number;
  user_id: string;
  type: string;
  amount: number;
  booking_id: string | null;
  provider_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ParentWalletRow = {
  user_id: string;
  credit_balance: number;
  created_at: string;
  updated_at: string;
};

export type ParentPassRow = {
  id: number;
  user_id: string;
  provider_id: number;
  pass_type: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ProviderCreditSettingsRow = {
  provider_id: number;
  accepts_credits: boolean;
  credit_cost_per_class: number;
  unlimited_pass_price: number | null;
  unlimited_pass_type: string | null;
  class_overrides: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};








