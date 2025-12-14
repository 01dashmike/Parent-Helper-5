/**
 * Caching utilities for growth score calculations
 * Provides consistent cache key generation and invalidation
 */

import { unstable_cache } from "next/cache";

/**
 * Generate cache tags for provider growth score
 */
export function getGrowthScoreCacheTags(providerId: number): string[] {
  return [
    `provider-growth-score:${providerId}`,
    `provider-dashboard:${providerId}`,
    `provider:${providerId}`,
  ];
}

/**
 * Generate cache key for provider growth score
 */
export function getGrowthScoreCacheKey(providerId: number, weekStart?: string): string {
  const week = weekStart || getCurrentWeekStart();
  return `growth-score:${providerId}:${week}`;
}

/**
 * Get current week start date string (YYYY-MM-DD format)
 * Week starts on Sunday (day 0)
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split("T")[0];
}

/**
 * Cache configuration for growth score queries
 * Default: 5 minutes for fast-changing data
 */
export const GROWTH_SCORE_CACHE_CONFIG = {
  revalidate: 300, // 5 minutes
  tags: [] as string[], // Will be populated per-provider
} as const;

/**
 * Cache wrapper for growth score calculation
 * Provides consistent caching across the application
 * 
 * @example
 * ```typescript
 * const score = await cacheGrowthScore(providerId, async () => {
 *   return await computeProviderGrowthScore(providerId);
 * });
 * ```
 */
export async function cacheGrowthScore<T>(
  providerId: number,
  fn: () => Promise<T>,
  options?: {
    revalidate?: number;
    weekStart?: string;
  }
): Promise<T> {
  const cacheKey = getGrowthScoreCacheKey(providerId, options?.weekStart);
  const cacheTags = getGrowthScoreCacheTags(providerId);

  const cachedFn = unstable_cache(
    fn,
    [cacheKey],
    {
      revalidate: options?.revalidate || GROWTH_SCORE_CACHE_CONFIG.revalidate,
      tags: cacheTags,
    }
  );

  return cachedFn();
}







