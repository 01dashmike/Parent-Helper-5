/**
 * Rate limiting utilities using Upstash Redis
 * 
 * Provides different rate limit tiers for various API endpoints:
 * - Public APIs (analytics, search): Higher limits for general usage
 * - Expensive APIs (OpenAI calls): Lower limits to prevent cost abuse
 * - Admin APIs: Lower limits with brute force protection
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Check if Redis is configured
const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Only create Redis client if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Rate limiter for public APIs (search, analytics POST)
 * Allows 60 requests per 60 seconds (1 per second average)
 */
export const publicApiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: true,
      prefix: "ratelimit:public",
    })
  : null;

/**
 * Rate limiter for expensive APIs (OpenAI blog generation)
 * Allows 10 requests per 60 seconds
 */
export const expensiveApiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "ratelimit:expensive",
    })
  : null;

/**
 * Rate limiter for admin login (brute force protection)
 * Allows 5 attempts per 5 minutes
 */
export const adminLoginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "300 s"),
      analytics: true,
      prefix: "ratelimit:admin-login",
    })
  : null;

/**
 * Get client identifier from request
 * Uses IP address or forwarded header
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
  return ip;
}

/**
 * Apply rate limiting to a request
 * Returns error response if rate limited, null if allowed
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null,
  identifier?: string
): Promise<NextResponse | null> {
  // If rate limiting is not configured, allow the request
  if (!limiter) {
    return null;
  }

  const id = identifier || getClientIdentifier(request);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(id);

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Please try again later",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error("[RateLimit] Error:", error);
    return null;
  }
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return isRedisConfigured;
}
