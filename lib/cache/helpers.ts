/**
 * Unified Caching Helpers
 * 
 * Centralized caching layer for server-side data fetching
 * Uses Next.js unstable_cache for consistency
 */

import { unstable_cache } from "next/cache";

/**
 * Create a deterministic cache key from namespace and parts
 */
export function makeCacheKey(namespace: string, ...parts: (string | number | boolean | null | undefined)[]): string {
  const sanitized = parts
    .filter((p) => p !== null && p !== undefined)
    .map((p) => String(p).replace(/[^a-zA-Z0-9_-]/g, "_"));
  return `${namespace}:${sanitized.join(":")}`;
}

/**
 * Cached route wrapper
 * 
 * @param key - Cache key (use makeCacheKey for consistency)
 * @param ttl - Time to live in seconds
 * @param tags - Optional cache tags for invalidation
 * @param fn - Async function to cache
 */
export function cachedRoute<T>(params: {
  key: string;
  ttl: number;
  tags?: string[];
  fn: () => Promise<T>;
}): Promise<T> {
  const { key, ttl, tags = [], fn } = params;
  
  const cached = unstable_cache(fn, [key], {
    revalidate: ttl,
    tags: [...tags, key],
  });
  
  return cached();
}

/**
 * Get or set cache with automatic key generation
 * 
 * @param namespace - Cache namespace (e.g. "rewards", "wallet")
 * @param parts - Cache key parts
 * @param ttl - Time to live in seconds
 * @param fetchFn - Function to call on cache miss
 */
export async function getOrSetCache<T>(
  namespace: string,
  parts: (string | number | boolean | null | undefined)[],
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = makeCacheKey(namespace, ...parts);
  
  return cachedRoute({
    key,
    ttl,
    tags: [namespace],
    fn: fetchFn,
  });
}

/**
 * Common TTL values for consistency
 */
export const CacheTTL = {
  /** Very short cache for high-churn data */
  SHORT: 30,
  /** Medium cache for dashboards */
  MEDIUM: 60,
  /** Longer cache for stable data */
  LONG: 300,
  /** Extended cache for mostly-static content */
  EXTENDED: 3600,
  /** Static content that rarely changes */
  STATIC: 86400,
} as const;




