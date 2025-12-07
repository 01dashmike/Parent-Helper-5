"use server";

/**
 * API route caching utilities
 * Provides consistent caching headers and Next.js cache configuration
 */

import { NextResponse } from "next/server";
import { CACHE_CONFIG } from "./cache-config";

/**
 * Add cache headers to API response
 */
export function addCacheHeaders(
  response: NextResponse,
  ttl: number,
  options?: {
    staleWhileRevalidate?: number;
    private?: boolean;
  }
): NextResponse {
  const staleWhileRevalidate = options?.staleWhileRevalidate ?? ttl;
  const cacheControl = options?.private
    ? `private, max-age=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`
    : `public, s-maxage=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`;

  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("X-Cache-TTL", ttl.toString());
  
  return response;
}

/**
 * Get cache TTL for API route type
 */
export function getApiCacheTTL(type: keyof typeof CACHE_CONFIG.api): number {
  return CACHE_CONFIG.api[type];
}

/**
 * Create cached API response
 */
export function createCachedResponse<T>(
  data: T,
  type: keyof typeof CACHE_CONFIG.api,
  options?: {
    staleWhileRevalidate?: number;
    private?: boolean;
  }
): NextResponse {
  const ttl = getApiCacheTTL(type);
  const response = NextResponse.json(data);
  return addCacheHeaders(response, ttl, options);
}

