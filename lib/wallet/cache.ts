/**
 * Wallet Caching Utilities - Performance Optimized
 * 
 * Provides caching for frequently accessed wallet data:
 * - Provider credit settings (changes infrequently)
 * - Wallet balances (short TTL)
 * - Pass eligibility (moderate TTL)
 */

import { unstable_cache } from "next/cache";
import type { ProviderCreditSettings } from "./providerCredits";

/**
 * Cache keys and tags
 */
export const WALLET_CACHE_KEYS = {
  providerSettings: (providerId: string) => `wallet:provider-settings:${providerId}`,
  walletBalance: (userId: string) => `wallet:balance:${userId}`,
  userPasses: (userId: string) => `wallet:passes:${userId}`,
  activePass: (userId: string, providerId: string) => `wallet:active-pass:${userId}:${providerId}`,
} as const;

export const WALLET_CACHE_TAGS = {
  providerSettings: (providerId: string) => `provider-settings:${providerId}`,
  wallet: (userId: string) => `wallet:${userId}`,
  passes: (userId: string) => `passes:${userId}`,
  provider: (providerId: string) => `provider:${providerId}`,
} as const;

/**
 * Cache TTLs (in seconds)
 */
export const WALLET_CACHE_TTL = {
  providerSettings: 3600, // 1 hour - provider settings change infrequently
  walletBalance: 60, // 1 minute - balance changes frequently
  passes: 300, // 5 minutes - passes change moderately
  eligibility: 300, // 5 minutes - eligibility rules change moderately
} as const;

/**
 * Cache wrapper for provider credit settings
 * Provider settings change infrequently, so we can cache aggressively
 */
export async function cacheProviderSettings<T>(
  providerId: string,
  fn: () => Promise<T>
): Promise<T> {
  const cacheKey = WALLET_CACHE_KEYS.providerSettings(providerId);
  const cacheTags = [
    WALLET_CACHE_TAGS.providerSettings(providerId),
    WALLET_CACHE_TAGS.provider(providerId),
  ];

  const cachedFn = unstable_cache(
    fn,
    [cacheKey],
    {
      revalidate: WALLET_CACHE_TTL.providerSettings,
      tags: cacheTags,
    }
  );

  return cachedFn();
}

/**
 * Cache wrapper for wallet balance
 * Balance changes frequently, use short TTL
 */
export async function cacheWalletBalance<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const cacheKey = WALLET_CACHE_KEYS.walletBalance(userId);
  const cacheTags = [WALLET_CACHE_TAGS.wallet(userId)];

  const cachedFn = unstable_cache(
    fn,
    [cacheKey],
    {
      revalidate: WALLET_CACHE_TTL.walletBalance,
      tags: cacheTags,
    }
  );

  return cachedFn();
}

/**
 * Cache wrapper for user passes
 * Passes change moderately, use moderate TTL
 */
export async function cacheUserPasses<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const cacheKey = WALLET_CACHE_KEYS.userPasses(userId);
  const cacheTags = [
    WALLET_CACHE_TAGS.passes(userId),
    WALLET_CACHE_TAGS.wallet(userId),
  ];

  const cachedFn = unstable_cache(
    fn,
    [cacheKey],
    {
      revalidate: WALLET_CACHE_TTL.passes,
      tags: cacheTags,
    }
  );

  return cachedFn();
}

/**
 * In-memory cache for provider settings (process-level)
 * Reduces database calls within same request
 */
const providerSettingsMemCache = new Map<string, {
  data: ProviderCreditSettings | null;
  timestamp: number;
}>();

const MEM_CACHE_TTL = 60000; // 60 seconds

/**
 * Get provider settings with memory cache
 * Checks memory cache first, then falls back to database/Next.js cache
 */
export function getProviderSettingsFromMemCache(
  providerId: string
): ProviderCreditSettings | null | undefined {
  const cached = providerSettingsMemCache.get(providerId);
  if (cached && Date.now() - cached.timestamp < MEM_CACHE_TTL) {
    return cached.data;
  }
  return undefined; // Cache miss
}

/**
 * Set provider settings in memory cache
 */
export function setProviderSettingsInMemCache(
  providerId: string,
  data: ProviderCreditSettings | null
): void {
  providerSettingsMemCache.set(providerId, {
    data,
    timestamp: Date.now(),
  });

  // Clean up old entries (keep cache size manageable)
  if (providerSettingsMemCache.size > 100) {
    const entries = Array.from(providerSettingsMemCache.entries());
    // Sort by timestamp and keep only the newest 50
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    providerSettingsMemCache.clear();
    entries.slice(0, 50).forEach(([key, value]) => {
      providerSettingsMemCache.set(key, value);
    });
  }
}

/**
 * Clear memory cache (for testing or manual cache invalidation)
 */
export function clearProviderSettingsMemCache(): void {
  providerSettingsMemCache.clear();
}







