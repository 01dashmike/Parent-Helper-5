/**
 * Credit Rollover Helpers
 * 
 * Functions for calculating and applying rollover rules.
 * Default behavior: no rollover limits (preserves existing functionality).
 */

import type { WalletConfig, RolloverRule } from "./config";
import { getWalletConfig } from "./config";
import type { LedgerEntry } from "./core";

/**
 * Calculate rollover amount based on unused credits
 * 
 * @param entries Ledger entries for the wallet
 * @param periodStart Start of the period (e.g., start of year)
 * @param periodEnd End of the period (e.g., end of year)
 * @param config Wallet configuration (uses default if not provided)
 * @returns Amount that can roll over to next period
 */
export function calculateRolloverAmount(
  entries: LedgerEntry[],
  periodStart: Date,
  periodEnd: Date,
  config?: WalletConfig
): number {
  const walletConfig = config || getWalletConfig();

  // If rollover is disabled, return 0 (no rollover)
  if (!walletConfig.rollover.enabled) {
    return 0;
  }

  const rolloverRule = walletConfig.rollover;

  // Filter entries within the period
  const periodEntries = entries.filter((entry) => {
    const entryDate = entry.createdAt;
    return entryDate >= periodStart && entryDate <= periodEnd;
  });

  // Calculate unused credits (credits added but not spent)
  let creditsAdded = 0;
  let creditsSpent = 0;

  for (const entry of periodEntries) {
    // Skip exempt types
    if (rolloverRule.exemptTypes?.includes(entry.type)) {
      continue;
    }

    if (entry.amount > 0) {
      creditsAdded += entry.amount;
    } else {
      creditsSpent += Math.abs(entry.amount);
    }
  }

  const unusedCredits = Math.max(0, creditsAdded - creditsSpent);

  // Apply rollover rules
  let rolloverAmount = unusedCredits;

  // Apply percentage limit if set
  if (rolloverRule.rolloverPercentage !== undefined) {
    rolloverAmount = (unusedCredits * rolloverRule.rolloverPercentage) / 100;
  }

  // Apply maximum amount limit if set
  if (rolloverRule.maxRolloverAmount !== undefined) {
    rolloverAmount = Math.min(rolloverAmount, rolloverRule.maxRolloverAmount);
  }

  return Math.round(rolloverAmount);
}

/**
 * Check if rollover is enabled
 */
export function isRolloverEnabled(config?: WalletConfig): boolean {
  const walletConfig = config || getWalletConfig();
  return walletConfig.rollover.enabled;
}







