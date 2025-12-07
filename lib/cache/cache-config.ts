/**
 * Centralized cache configuration
 * Defines TTLs for different content types
 */

export const CACHE_CONFIG = {
  // Page-level caching (Next.js revalidate)
  pages: {
    homepage: 30, // 30 seconds - user-specific content
    blogIndex: 60, // 60 seconds - blog list changes infrequently
    blogPost: 300, // 5 minutes - blog posts are relatively static
    classDetail: 30, // 30 seconds - class details may change
    searchPage: 30, // 30 seconds - search results change frequently
    providerDashboard: 60, // 60 seconds - provider data updates frequently
    providerAnalytics: 60, // 60 seconds - analytics data
    marketing: 300, // 5 minutes - marketing pages are static
    admin: 300, // 5 minutes - admin pages
  },

  // API route caching
  api: {
    search: 30, // 30 seconds - search results
    recommendations: 60, // 60 seconds - recommendations
    analytics: 0, // No cache - analytics writes
    providerAnalytics: 60, // 60 seconds - provider analytics reads
    blog: 300, // 5 minutes - blog content
    classDetail: 30, // 30 seconds - class details
  },

  // In-memory cache TTLs (milliseconds)
  memory: {
    search: 10 * 1000, // 10 seconds - in-memory search cache
    normalized: Infinity, // No expiry - string normalization cache
    recommendations: 60 * 1000, // 60 seconds - recommendations cache
  },

  // External cache (Redis/Upstash) TTLs (seconds)
  external: {
    search: 30, // 30 seconds - external search cache
    providerAnalytics: 60, // 60 seconds - provider analytics
    blog: 300, // 5 minutes - blog content
  },
} as const;

/**
 * Get cache TTL for a specific content type
 */
export function getCacheTTL(type: keyof typeof CACHE_CONFIG.pages): number {
  return CACHE_CONFIG.pages[type] ?? 60;
}

/**
 * Get API cache TTL
 */
export function getApiCacheTTL(type: keyof typeof CACHE_CONFIG.api): number {
  return CACHE_CONFIG.api[type] ?? 60;
}

