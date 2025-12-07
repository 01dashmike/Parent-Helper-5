/**
 * Rate limiting utility with Upstash Redis or in-memory fallback
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback store
class MemoryStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.resetAt) {
      this.store.delete(key);
      return null;
    }
    return entry.count;
  }

  async set(key: string, count: number, resetAt: number): Promise<void> {
    this.store.set(key, { count, resetAt });
  }

  async increment(key: string, resetAt: number): Promise<number> {
    const entry = this.store.get(key);
    if (entry && Date.now() <= entry.resetAt) {
      entry.count++;
      return entry.count;
    }
    this.store.set(key, { count: 1, resetAt });
    return 1;
  }
}

// Initialize rate limiter
let ratelimit: Ratelimit | null = null;
let memoryStore: MemoryStore | null = null;

function getRateLimiter(): Ratelimit | MemoryStore {
  // Try Upstash Redis first
  if (process.env["UPSTASH_REDIS_REST_URL"] && process.env["UPSTASH_REDIS_REST_TOKEN"]) {
    try {
      if (!ratelimit) {
        const redis = new Redis({
          url: process.env["UPSTASH_REDIS_REST_URL"],
          token: process.env["UPSTASH_REDIS_REST_TOKEN"],
        });

        ratelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, "10 s"), // Default: 10 requests per 10 seconds
          analytics: true,
        });
      }
      return ratelimit;
    } catch (error) {
      console.warn("[rate-limit] Failed to initialize Upstash Redis, falling back to in-memory:", error);
    }
  }

  // Fallback to in-memory store
  if (!memoryStore) {
    memoryStore = new MemoryStore();
  }
  return memoryStore;
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  login: { limit: 5, window: "1 m" }, // 5 attempts per minute
  otp: { limit: 3, window: "5 m" }, // 3 OTP sends per 5 minutes
  provider: { limit: 20, window: "1 m" }, // 20 provider actions per minute
  ai: { limit: 10, window: "1 m" }, // 10 AI requests per minute
  booking: { limit: 5, window: "1 m" }, // 5 bookings per minute
  default: { limit: 100, window: "1 m" }, // 100 requests per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Check rate limit for a given identifier and endpoint type
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "default"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const config = RATE_LIMIT_CONFIG[type];
  const limiter = getRateLimiter();

  if (limiter instanceof Ratelimit) {
    // Upstash Redis
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } else {
    // In-memory fallback
    const key = `${type}:${identifier}`;
    const windowMs = parseWindow(config.window);
    const resetAt = Date.now() + windowMs;
    const count = await limiter.increment(key, resetAt);
    const limit = config.limit;

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: resetAt,
    };
  }
}

/**
 * Parse window string (e.g., "1 m" -> 60000ms)
 */
function parseWindow(window: string): number {
  const [amount, unit] = window.split(" ");
  const num = parseInt(amount, 10);
  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return num * (unitMap[unit] || 1000);
}

/**
 * Get rate limit identifier from request (IP address or user ID)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if available (more accurate)
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

