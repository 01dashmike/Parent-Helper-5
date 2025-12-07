/**
 * Wallet Tier Helpers
 * 
 * Functions for calculating wallet tiers based on balance and history.
 * These are read-only calculations that don't modify wallet state.
 */

import type { WalletConfig, WalletTier } from "./config";
import type { LedgerEntry } from "./core";
import { getWalletConfig } from "./config";

/**
 * Result of tier calculation
 */
export type WalletTierResult = {
  currentTier: WalletTier | null;
  nextTier: WalletTier | null;
  progressToNext: number; // 0-100 percentage
  currentBalance: number;
  totalSpent: number; // Sum of all "spend" transactions
};

/**
 * Calculate wallet tier based on current balance and history
 * 
 * @param balance Current wallet balance
 * @param ledgerHistory Ledger entries for calculating total spent
 * @param config Optional wallet config (uses default if not provided)
 * @returns Tier calculation result
 */
export function getWalletTier(
  balance: number,
  ledgerHistory: LedgerEntry[] = [],
  config?: WalletConfig
): WalletTierResult {
  const walletConfig = config || getWalletConfig();

  // If tiers are disabled, return null
  if (!walletConfig.tiers.enabled || walletConfig.tiers.definitions.length === 0) {
    return {
      currentTier: null,
      nextTier: null,
      progressToNext: 0,
      currentBalance: balance,
      totalSpent: 0,
    };
  }

  // Calculate total spent from history
  const totalSpent = ledgerHistory
    .filter((entry) => entry.type === "spend" && entry.amount < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  // Sort tiers by criteria (balance or total spent)
  const sortedTiers = [...walletConfig.tiers.definitions].sort((a, b) => {
    const aValue = a.minBalance ?? a.minTotalSpent ?? 0;
    const bValue = b.minBalance ?? b.minTotalSpent ?? 0;
    return aValue - bValue;
  });

  // Find current tier
  let currentTier: WalletTier | null = null;
  let nextTier: WalletTier | null = null;

  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    const tier = sortedTiers[i];
    const tierValue = tier.minBalance ?? tier.minTotalSpent ?? 0;
    const userValue = tier.minBalance !== undefined ? balance : totalSpent;

    if (userValue >= tierValue) {
      currentTier = tier;
      // Next tier is the one after this (if exists)
      if (i < sortedTiers.length - 1) {
        nextTier = sortedTiers[i + 1];
      }
      break;
    }
  }

  // If no tier found, user is below the lowest tier
  if (!currentTier && sortedTiers.length > 0) {
    currentTier = null;
    nextTier = sortedTiers[0];
  }

  // Calculate progress to next tier (0-100%)
  let progressToNext = 0;
  if (currentTier && nextTier) {
    const currentValue = currentTier.minBalance ?? currentTier.minTotalSpent ?? 0;
    const nextValue = nextTier.minBalance ?? nextTier.minTotalSpent ?? 0;
    const userValue = currentTier.minBalance !== undefined ? balance : totalSpent;

    const range = nextValue - currentValue;
    const progress = userValue - currentValue;

    if (range > 0) {
      progressToNext = Math.min(100, Math.max(0, (progress / range) * 100));
    }
  } else if (!currentTier && nextTier) {
    // User is below lowest tier, calculate progress to first tier
    const nextValue = nextTier.minBalance ?? nextTier.minTotalSpent ?? 0;
    const userValue = nextTier.minBalance !== undefined ? balance : totalSpent;

    if (nextValue > 0) {
      progressToNext = Math.min(100, Math.max(0, (userValue / nextValue) * 100));
    }
  }

  return {
    currentTier,
    nextTier,
    progressToNext: Math.round(progressToNext * 100) / 100, // Round to 2 decimal places
    currentBalance: balance,
    totalSpent,
  };
}

/**
 * Get next tier progress information
 * 
 * Convenience function that returns just the progress details
 */
export function getNextTierProgress(
  balance: number,
  ledgerHistory: LedgerEntry[] = [],
  config?: WalletConfig
): {
  nextTier: WalletTier | null;
  progress: number;
  remaining: number; // Amount needed to reach next tier
} {
  const tierResult = getWalletTier(balance, ledgerHistory, config);

  if (!tierResult.nextTier) {
    return {
      nextTier: null,
      progress: 0,
      remaining: 0,
    };
  }

  const nextValue = tierResult.nextTier.minBalance ?? tierResult.nextTier.minTotalSpent ?? 0;
  const currentValue = tierResult.currentTier
    ? (tierResult.currentTier.minBalance ?? tierResult.currentTier.minTotalSpent ?? 0)
    : 0;
  const userValue = tierResult.currentTier?.minBalance !== undefined
    ? tierResult.currentBalance
    : tierResult.totalSpent;

  const remaining = Math.max(0, nextValue - userValue);

  return {
    nextTier: tierResult.nextTier,
    progress: tierResult.progressToNext,
    remaining,
  };
}




