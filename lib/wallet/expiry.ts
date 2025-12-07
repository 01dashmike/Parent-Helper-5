/**
 * Credit Expiry Management
 * 
 * Functions for handling credit expiry with configurable rules.
 * Default behavior: no expiry (preserves existing functionality).
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { WalletConfig, ExpiryRule } from "./config";
import { getWalletConfig } from "./config";
import type { LedgerEntry } from "./core";
import { getParentWallet } from "./core";

/**
 * Calculate expiry date for a credit transaction
 * 
 * @param entry Ledger entry (credit transaction)
 * @param config Wallet configuration (uses default if not provided)
 * @param now Current date (defaults to now)
 * @returns Expiry date or null if credits don't expire
 */
export function computeExpiryForTransaction(
  entry: LedgerEntry,
  config?: WalletConfig,
  now: Date = new Date()
): Date | null {
  const walletConfig = config || getWalletConfig();
  const expiryRule = walletConfig.expiry;

  // If expiry is disabled, return null
  if (!expiryRule.enabled) {
    return null;
  }

  // Check if this transaction type is exempt from expiry
  if (expiryRule.exemptTypes?.includes(entry.type)) {
    return null;
  }

  // Determine expiry days based on transaction type
  let expiryDays: number | undefined;

  if (entry.type === "purchase" && expiryRule.daysAfterPurchase) {
    expiryDays = expiryRule.daysAfterPurchase;
  } else if (
    (entry.type === "bonus" || entry.type === "refund") &&
    expiryRule.daysAfterGrant
  ) {
    expiryDays = expiryRule.daysAfterGrant;
  }

  // If no expiry rule applies, return null
  if (!expiryDays) {
    return null;
  }

  // Calculate expiry date
  const expiryDate = new Date(entry.createdAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return expiryDate;
}

/**
 * Get active balance considering expiry
 * 
 * This function filters out expired credits from the balance calculation.
 * It reads expiry metadata from ledger entries.
 * 
 * @param entries Ledger entries for the wallet
 * @param config Wallet configuration (uses default if not provided)
 * @param now Current date (defaults to now)
 * @returns Active balance (excluding expired credits)
 */
export function getActiveBalanceConsideringExpiry(
  entries: LedgerEntry[],
  config?: WalletConfig,
  now: Date = new Date()
): number {
  const walletConfig = config || getWalletConfig();

  // If expiry is disabled, return sum of all entries (current behavior)
  if (!walletConfig.expiry.enabled) {
    return entries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  // Calculate balance, excluding expired credits
  let balance = 0;

  for (const entry of entries) {
    // Only process credit entries (positive amounts)
    if (entry.amount <= 0) {
      balance += entry.amount; // Debits always apply
      continue;
    }

    // Get expiry date from metadata or calculate it
    const expiryDate =
      (entry.metadata?.expiryDate as string | undefined)
        ? new Date(entry.metadata.expiryDate as string)
        : computeExpiryForTransaction(entry, walletConfig, entry.createdAt);

    // If expired, skip this credit
    if (expiryDate && expiryDate < now) {
      continue;
    }

    // Credit is still active, add to balance
    balance += entry.amount;
  }

  return balance;
}

/**
 * Expire credits (to be run by cron job)
 * 
 * Scans all wallets and expires credits according to config rules.
 * Creates expiry ledger entries for expired credits.
 */
export async function expireCredits(config?: WalletConfig): Promise<{
  success: boolean;
  expiredCount: number;
  error?: string;
}> {
  const walletConfig = config || getWalletConfig();

  // If expiry is disabled, do nothing (preserve current behavior)
  if (!walletConfig.expiry.enabled) {
    return { success: true, expiredCount: 0 };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, expiredCount: 0, error: "Database not configured" };
  }

  const now = new Date();
  let expiredCount = 0;

  try {
    // Get all wallets
    const { data: wallets, error: walletsError } = await supabase
      .from("parent_wallets")
      .select("user_id");

    if (walletsError || !wallets) {
      return {
        success: false,
        expiredCount: 0,
        error: walletsError?.message || "Failed to fetch wallets",
      };
    }

    // Process each wallet
    for (const wallet of wallets) {
      // Get ledger entries for this wallet
      const { data: entries, error: entriesError } = await supabase
        .from("wallet_ledger")
        .select("*")
        .eq("user_id", wallet.user_id)
        .order("created_at", { ascending: true });

      if (entriesError || !entries) {
        console.error(
          `[expireCredits] Error fetching ledger for user ${wallet.user_id}:`,
          entriesError
        );
        continue;
      }

      // Find expired credits
      for (const entry of entries) {
        // Only process credit entries (positive amounts)
        if (entry.amount <= 0) {
          continue;
        }

        // Skip if already marked as expired
        if (entry.type === "expiry") {
          continue;
        }

        // Check if this type is exempt
        if (walletConfig.expiry.exemptTypes?.includes(entry.type)) {
          continue;
        }

        // Get expiry date
        const expiryDate =
          (entry.metadata as Record<string, unknown>)?.expiryDate
            ? new Date((entry.metadata as Record<string, unknown>).expiryDate as string)
            : computeExpiryForTransaction(
                {
                  id: entry.id,
                  userId: entry.user_id,
                  type: entry.type as LedgerEntry["type"],
                  amount: entry.amount,
                  metadata: (entry.metadata as Record<string, unknown>) || {},
                  createdAt: new Date(entry.created_at),
                },
                walletConfig,
                new Date(entry.created_at)
              );

        // If expired, create expiry entry
        if (expiryDate && expiryDate < now) {
          // Check if expiry entry already exists for this credit
          const { data: existingExpiry } = await supabase
            .from("wallet_ledger")
            .select("id")
            .eq("user_id", wallet.user_id)
            .eq("type", "expiry")
            .eq("metadata->>sourceEntryId", entry.id.toString())
            .maybeSingle();

          if (!existingExpiry) {
            // Create expiry entry
            await supabase.from("wallet_ledger").insert({
              user_id: wallet.user_id,
              type: "expiry",
              amount: -entry.amount, // Negative to deduct from balance
              metadata: {
                sourceEntryId: entry.id,
                expiredAt: now.toISOString(),
                originalAmount: entry.amount,
                originalType: entry.type,
              },
            });

            expiredCount++;
          }
        }
      }
    }

    return { success: true, expiredCount };
  } catch (error) {
    console.error("[expireCredits] Error:", error);
    return {
      success: false,
      expiredCount,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get credits that will expire soon (for notifications)
 * 
 * @param userId User ID
 * @param daysAhead Number of days ahead to check (default: 30)
 * @param config Wallet configuration (uses default if not provided)
 */
export async function getCreditsExpiringSoon(
  userId: string,
  daysAhead: number = 30,
  config?: WalletConfig
): Promise<number> {
  const walletConfig = config || getWalletConfig();

  // If expiry is disabled, return 0
  if (!walletConfig.expiry.enabled) {
    return 0;
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return 0;
  }

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  try {
    // Get ledger entries for this user
    const { data: entries, error } = await supabase
      .from("wallet_ledger")
      .select("*")
      .eq("user_id", userId)
      .gt("amount", 0) // Only credit entries
      .neq("type", "expiry") // Exclude already expired entries
      .order("created_at", { ascending: true });

    if (error || !entries) {
      return 0;
    }

    let expiringAmount = 0;

    for (const entry of entries) {
      // Check if exempt
      if (walletConfig.expiry.exemptTypes?.includes(entry.type)) {
        continue;
      }

      // Get expiry date
      const expiryDate =
        (entry.metadata as Record<string, unknown>)?.expiryDate
          ? new Date((entry.metadata as Record<string, unknown>).expiryDate as string)
          : computeExpiryForTransaction(
              {
                id: entry.id,
                userId: entry.user_id,
                type: entry.type as LedgerEntry["type"],
                amount: entry.amount,
                metadata: (entry.metadata as Record<string, unknown>) || {},
                createdAt: new Date(entry.created_at),
              },
              walletConfig,
              new Date(entry.created_at)
            );

      // If expires within the window, add to total
      if (expiryDate && expiryDate >= now && expiryDate <= futureDate) {
        expiringAmount += entry.amount;
      }
    }

    return expiringAmount;
  } catch (error) {
    console.error("[getCreditsExpiringSoon] Error:", error);
    return 0;
  }
}


