/**
 * Lightweight rate limiting wrapper for API routes
 * Uses existing rate-limit utility with simplified API
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMIT_CONFIG, type RateLimitType } from "./rate-limit";

/**
 * Rate limit wrapper for API route handlers
 * @param handler - API route handler function
 * @param type - Rate limit type (default: "default")
 * @param getUserId - Optional function to extract user ID from request
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T = unknown>(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse<T>>,
  type: RateLimitType = "default",
  getUserId?: (req: NextRequest) => string | undefined
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse<T>> => {
    const userId = getUserId ? getUserId(req) : undefined;
    const identifier = getRateLimitIdentifier(req, userId);
    
    const result = await checkRateLimit(identifier, type);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again after ${new Date(result.reset).toISOString()}`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        } as T,
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
            "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req, ...args);
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.reset.toString());
    
    return response;
  };
}

/**
 * Get rate limit config for a specific type
 */
export function getRateLimitConfig(type: RateLimitType) {
  return RATE_LIMIT_CONFIG[type];
}

