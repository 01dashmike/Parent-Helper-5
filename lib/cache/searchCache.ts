/**
 * In-memory cache for search API results
 * Uses simple Map with TTL for edge runtime compatibility
 */

type CacheEntry = {
  data: any;
  timestamp: number;
  staleAt: number;
};

// Cache TTL: 10 seconds for in-memory search cache
// Short TTL ensures fresh results while reducing database load
const CACHE_TTL_MS = 10 * 1000; // 10 seconds
const MAX_CACHE_SIZE = 1000; // Prevent memory issues

class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate cache key from search parameters
   * Includes: coordinates, radius, filters (query, town, age), keyword
   */
  generateKey(params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    query?: string;
    town?: string;
    age?: string;
    childId?: string;
  }): string | null {
    // Do NOT cache personalized results (with childId)
    if (params.childId) {
      return null;
    }

    // Build cache key from all relevant parameters
    const parts: string[] = [];

    // Coordinates (rounded to 4 decimal places for cache efficiency)
    if (params.latitude !== undefined && params.longitude !== undefined) {
      parts.push(`lat:${params.latitude.toFixed(4)}`);
      parts.push(`lng:${params.longitude.toFixed(4)}`);
    }

    // Radius
    if (params.radius !== undefined) {
      parts.push(`radius:${params.radius}`);
    }

    // Filters
    if (params.query) {
      parts.push(`q:${params.query.toLowerCase().trim()}`);
    }
    if (params.town) {
      parts.push(`town:${params.town.toLowerCase().trim()}`);
    }
    if (params.age) {
      parts.push(`age:${params.age.toLowerCase().trim()}`);
    }

    // If no parameters, return null (don't cache empty searches)
    if (parts.length === 0) {
      return null;
    }

    return parts.join("|");
  }

  /**
   * Get cached result if available
   * Returns { data, hit: true } on fresh cache hit
   * Returns { data, hit: false } on stale cache hit (for stale-while-revalidate)
   * Returns { hit: false } on cache miss
   */
  get(key: string | null): { data: any; hit: boolean } | { hit: false } {
    if (!key) {
      return { hit: false };
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return { hit: false };
    }

    const now = Date.now();
    const isFresh = now <= entry.timestamp + CACHE_TTL_MS;

    // Return cached data (fresh or stale for stale-while-revalidate)
    return { data: entry.data, hit: isFresh };
  }

  /**
   * Store result in cache
   */
  set(key: string | null, data: any): void {
    if (!key) {
      return;
    }

    // Prevent cache from growing too large
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (simple FIFO eviction)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      staleAt: now + CACHE_TTL_MS,
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
    };
  }
}

// Singleton instance for edge runtime
// In edge runtime, this will be shared across requests in the same instance
const searchCache = new SearchCache();

export { searchCache };
export type { CacheEntry };

