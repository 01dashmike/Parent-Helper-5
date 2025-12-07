/**
 * Server-side memoization cache for normalized search data
 * Caches expensive operations like string normalization and data transformations
 */

type NormalizedCacheEntry<T> = {
  data: T;
  timestamp: number;
};

class NormalizedCache {
  private stringCache: Map<string, string> = new Map();
  private maxStringCacheSize = 10000;
  private stringCacheHits = 0;
  private stringCacheMisses = 0;

  /**
   * Normalize and cache string operations
   */
  normalizeString(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return "";
    }

    // Check cache first
    const cached = this.stringCache.get(value);
    if (cached !== undefined) {
      this.stringCacheHits++;
      return cached;
    }

    // Normalize
    const normalized = value.trim().toLowerCase();
    
    // Cache if not too large
    if (this.stringCache.size < this.maxStringCacheSize) {
      this.stringCache.set(value, normalized);
    } else {
      // Evict oldest entries (simple FIFO)
      const firstKey = this.stringCache.keys().next().value;
      if (firstKey) {
        this.stringCache.delete(firstKey);
      }
      this.stringCache.set(value, normalized);
    }

    this.stringCacheMisses++;
    return normalized;
  }

  /**
   * Batch normalize strings (more efficient for arrays)
   */
  normalizeStrings(values: (string | null | undefined)[]): string[] {
    return values.map((v) => this.normalizeString(v));
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.stringCache.clear();
    this.stringCacheHits = 0;
    this.stringCacheMisses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stringCacheHits + this.stringCacheMisses;
    const hitRate = total > 0 ? (this.stringCacheHits / total) * 100 : 0;
    return {
      stringCacheSize: this.stringCache.size,
      stringCacheHits: this.stringCacheHits,
      stringCacheMisses: this.stringCacheMisses,
      hitRate: `${hitRate.toFixed(1)}%`,
    };
  }
}

// Singleton instance
const normalizedCache = new NormalizedCache();

export { normalizedCache };

