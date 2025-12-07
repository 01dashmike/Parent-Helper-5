/**
 * Wallet Core Functions
 * 
 * Core wallet operations: get, add credits, spend credits
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { WalletMetadata, WalletLedgerRow } from "./types";

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
  bookingId?: string;
  providerId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

/**
 * Get or create parent wallet
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Database not configured");
  }

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
      throw new Error(`Failed to create wallet: ${createError?.message}`);
    }

    return {
      userId: newWallet.user_id,
      creditBalance: newWallet.credit_balance,
      createdAt: new Date(newWallet.created_at),
      updatedAt: new Date(newWallet.updated_at),
    };
  }

  if (error || !wallet) {
    throw new Error(`Failed to get wallet: ${error?.message}`);
  }

  return {
    userId: wallet.user_id,
    creditBalance: wallet.credit_balance,
    createdAt: new Date(wallet.created_at),
    updatedAt: new Date(wallet.updated_at),
  };
}

/**
 * Get current wallet balance
 */
export async function getBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet.creditBalance;
}

/**
 * Add credits to wallet
 * 
 * This function is transactional - it writes to ledger and updates balance atomically
 */
export type AddCreditsResult = {
  balance: number;
};

export async function addCredits(
  userId: string,
  amount: number,
  metadata?: WalletMetadata
): Promise<AddCreditsResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Database not configured");
  }

  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Ensure wallet exists
  await getOrCreateWallet(userId);

  // Use Supabase RPC for transactional operation
  // For now, we'll do it in two steps (ledger insert triggers balance update)
  const { data: ledgerEntry, error: ledgerError } = await supabase
    .from("wallet_ledger")
    .insert({
      user_id: userId,
      type: metadata?.["type"] || "purchase",
      amount: amount,
      booking_id: metadata?.["bookingId"] || null,
      provider_id: metadata?.["providerId"] || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (ledgerError) {
    throw new Error(`Failed to add credits: ${ledgerError.message}`);
  }

  // Get updated balance (trigger should have updated it)
  const wallet = await getOrCreateWallet(userId);
  return { balance: wallet.creditBalance };
}

/**
 * Spend credits from wallet
 * 
 * Throws if insufficient balance
 */
export type SpendCreditsResult = {
  balance: number;
};

export async function spendCredits(
  userId: string,
  amount: number,
  metadata?: WalletMetadata
): Promise<SpendCreditsResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Database not configured");
  }

  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Check balance
  const currentBalance = await getBalance(userId);
  if (currentBalance < amount) {
    throw new Error(`Insufficient credits. You have ${currentBalance}, need ${amount}`);
  }

  // Deduct credits (negative amount in ledger)
  const { error: ledgerError } = await supabase.from("wallet_ledger").insert({
    user_id: userId,
    type: "spend",
    amount: -amount, // Negative for spending
    booking_id: metadata?.["bookingId"] || null,
    provider_id: metadata?.["providerId"] || null,
    metadata: metadata || {},
  });

  if (ledgerError) {
    throw new Error(`Failed to spend credits: ${ledgerError.message}`);
  }

  // Get updated balance (trigger should have updated it)
  const wallet = await getOrCreateWallet(userId);
  return { balance: wallet.creditBalance };
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
    reason,
    ...metadata,
  });
}

/**
 * Get wallet ledger entries
 */
export async function getWalletLedger(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LedgerEntry[]> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return [];
  }

  const { data: entries, error } = await supabase
    .from("wallet_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !entries) {
    console.error("[getWalletLedger] Error:", error);
    return [];
  }

  return entries.map((e: WalletLedgerRow) => ({
    id: e.id,
    userId: e.user_id,
    type: e.type as LedgerEntry["type"],
    amount: e.amount,
    bookingId: e.booking_id || undefined,
    providerId: e.provider_id || undefined,
    metadata: (e.metadata as Record<string, unknown>) || {},
    createdAt: new Date(e.created_at),
  }));
}

