/**
 * Wallet Core Functions
 * 
 * Core wallet operations: get, add credits, spend credits
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { WalletMetadata, WalletLedgerRow, ParentWalletRow } from "./types";
import { computeExpiryForTransaction } from "./expiry";
import { getWalletConfig } from "./config";

export type Wallet = {
  userId: string;
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LedgerEntry = {
  id: number;
  userId: string;
  type: "purchase" | "spend" | "refund" | "bonus" | "expiry" | "admin_adjustment" | "pass_purchase" | "pass_usage";
  amount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

/**
 * Get or create parent wallet
 */
export async function getParentWallet(userId: string): Promise<Wallet | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  // Try to get existing wallet
  const { data: wallet, error } = await supabase
    .from("parent_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // Wallet doesn't exist, create it
    const { data: newWallet, error: createError } = await supabase
      .from("parent_wallets")
      .insert({
        user_id: userId,
        credit_balance: 0,
      })
      .select()
      .single();

    if (createError || !newWallet) {
      console.error("[getParentWallet] Error creating wallet:", createError);
      return null;
    }

    return {
      userId: newWallet.user_id,
      creditBalance: newWallet.credit_balance,
      createdAt: new Date(newWallet.created_at),
      updatedAt: new Date(newWallet.updated_at),
    };
  }

  if (error || !wallet) {
    console.error("[getParentWallet] Error:", error);
    return null;
  }

  return {
    userId: wallet.user_id,
    creditBalance: wallet.credit_balance,
    createdAt: new Date(wallet.created_at),
    updatedAt: new Date(wallet.updated_at),
  };
}

/**
 * Add credits to wallet - OPTIMIZED
 */
export type AddCreditsResult = {
  success: boolean;
  newBalance?: number;
  error?: string;
};

export async function addCredits(
  userId: string,
  amount: number,
  metadata: WalletMetadata
): Promise<AddCreditsResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    // Optimized: Use upsert to ensure wallet exists (single query)
    const { error: upsertError } = await supabase
      .from("parent_wallets")
      .upsert(
        {
          user_id: userId,
          credit_balance: 0, // Default balance for new wallets
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: true,
        }
      );

    if (upsertError) {
      console.error("[addCredits] Upsert error:", upsertError);
      return { success: false, error: upsertError.message };
    }

    // Calculate expiry date if expiry is enabled
    const walletConfig = getWalletConfig();
    const enrichedMetadata = { ...metadata };
    
    if (walletConfig.expiry.enabled) {
      // Create a temporary entry to calculate expiry
      const tempEntry: LedgerEntry = {
        id: 0, // Temporary ID
        userId,
        type: metadata.type || "purchase",
        amount,
        metadata: enrichedMetadata,
        createdAt: new Date(),
      };
      
      const expiryDate = computeExpiryForTransaction(tempEntry, walletConfig);
      if (expiryDate) {
        enrichedMetadata.expiryDate = expiryDate.toISOString();
      }
    }

    // Add ledger entry (positive amount)
    // Database trigger will update wallet balance automatically
    const { error: ledgerError } = await supabase
      .from("wallet_ledger")
      .insert({
        user_id: userId,
        type: metadata.type,
        amount: amount,
        metadata: enrichedMetadata,
      });

    if (ledgerError) {
      console.error("[addCredits] Ledger error:", ledgerError);
      return { success: false, error: ledgerError.message };
    }

    // Optimized: Get updated balance with single query
    const { data: wallet, error: balanceError } = await supabase
      .from("parent_wallets")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError || !wallet) {
      console.error("[addCredits] Balance error:", balanceError);
      return { success: false, error: "Failed to retrieve wallet" };
    }

    return { success: true, newBalance: wallet.credit_balance };
  } catch (error) {
    console.error("[addCredits] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add credits",
    };
  }
}

/**
 * Spend credits from wallet - OPTIMIZED
 */
export type SpendCreditsResult = {
  success: boolean;
  newBalance?: number;
  error?: string;
};

export async function spendCredits(
  userId: string,
  amount: number,
  metadata: WalletMetadata
): Promise<SpendCreditsResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    // Optimized: Check balance with single select query
    const { data: wallet, error: balanceError } = await supabase
      .from("parent_wallets")
      .select("credit_balance")
      .eq("user_id", userId)
      .single();

    if (balanceError || !wallet) {
      return { success: false, error: "Wallet not found" };
    }

    if (wallet.credit_balance < amount) {
      return {
        success: false,
        error: `Insufficient credits. You have ${wallet.credit_balance}, need ${amount}`,
      };
    }

    // Add ledger entry (negative amount)
    // Database trigger will update wallet balance automatically
    const { error: ledgerError } = await supabase.from("wallet_ledger").insert({
      user_id: userId,
      type: "spend",
      amount: -amount, // Negative for spending
      metadata: metadata,
    });

    if (ledgerError) {
      console.error("[spendCredits] Ledger error:", ledgerError);
      return { success: false, error: ledgerError.message };
    }

    // Return new balance (calculated based on current balance - amount)
    const newBalance = wallet.credit_balance - amount;
    return { success: true, newBalance };
  } catch (error) {
    console.error("[spendCredits] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to spend credits",
    };
  }
}

/**
 * Get wallet ledger entries - OPTIMIZED
 * 
 * @param userId - User ID
 * @param limit - Number of entries to return (default: 50, max: 100)
 * @param offset - Offset for pagination
 * @returns Array of ledger entries
 */
export async function getWalletLedger(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LedgerEntry[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  // Enforce maximum limit to prevent performance issues
  const safeLimit = Math.min(limit, 100);

  const { data: entries, error } = await supabase
    .from("wallet_ledger")
    .select("id, user_id, type, amount, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + safeLimit - 1);

  if (error) {
    console.error("[getWalletLedger] Error:", error);
    return [];
  }

  if (!entries || entries.length === 0) {
    return [];
  }

  // Optimized: Use map without intermediate allocation
  return entries.map((e: WalletLedgerRow) => ({
    id: e.id,
    userId: e.user_id,
    type: e.type as LedgerEntry["type"],
    amount: e.amount,
    metadata: (e.metadata as Record<string, unknown>) || {},
    createdAt: new Date(e.created_at),
  }));
}

/**
 * Grant bonus credits (for referrals, promotions, etc.)
 */
export async function grantBonusCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: WalletMetadata
): Promise<AddCreditsResult> {
  return addCredits(userId, amount, {
    type: "bonus",
    description: reason,
    ...metadata,
  });
}

