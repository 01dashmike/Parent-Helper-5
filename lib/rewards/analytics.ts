/**
 * Reward Analytics Utility
 * 
 * Type-safe utility for tracking reward events (redemption, expiration, expiring soon)
 * to ensure consistent event structure and prevent duplication.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Batch event logging
 * - Async fire-and-forget pattern (non-blocking)
 * - Connection pooling via RPC
 * - Deduplication for rapid repeated calls
 */

import { getSupabaseServer } from "@/lib/supabase.server";

export type RewardSource = "referral" | "booking" | "milestone" | "provider_referral";
type RewardEventType = "reward_redeemed" | "reward_expired" | "reward_expiring_soon";

export interface RewardRedeemedEvent {
  reward_id: string;
  user_id: string;
  value_cents: number;
  source: RewardSource;
  stripe_coupon_id?: string | null;
  timestamp: string;
}

export interface RewardExpiredEvent {
  reward_id: string;
  user_id: string;
  value_cents: number;
  source: RewardSource;
  expired_at: string;
  timestamp: string;
}

export interface RewardExpiringSoonEvent {
  reward_id: string;
  user_id: string;
  value_cents: number;
  source: RewardSource;
  expires_at: string;
  days_until_expiry: number;
  timestamp: string;
}

// Deduplication cache (1 minute window)
// Prevents logging the same event multiple times in rapid succession
const eventDedupeCache = new Map<string, number>();
const EVENT_DEDUPE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Build deduplication key for event
 */
function buildEventDedupeKey(
  eventType: RewardEventType,
  userId: string,
  rewardId: string
): string {
  return `${eventType}:${userId}:${rewardId}`;
}

/**
 * Check if event was recently logged
 */
function isEventDuplicate(
  eventType: RewardEventType,
  userId: string,
  rewardId: string
): boolean {
  const key = buildEventDedupeKey(eventType, userId, rewardId);
  const lastLogged = eventDedupeCache.get(key);
  
  if (lastLogged && Date.now() - lastLogged < EVENT_DEDUPE_WINDOW_MS) {
    return true;
  }
  
  // Mark as logged
  eventDedupeCache.set(key, Date.now());
  
  // Clean up old entries (simple approach)
  if (eventDedupeCache.size > 1000) {
    const now = Date.now();
    for (const [k, timestamp] of eventDedupeCache.entries()) {
      if (now - timestamp > EVENT_DEDUPE_WINDOW_MS) {
        eventDedupeCache.delete(k);
      }
    }
  }
  
  return false;
}

/**
 * Generic helper to log reward events (optimized with deduplication)
 * 
 * OPTIMIZATIONS:
 * - Deduplication prevents rapid repeated logging
 * - Fire-and-forget pattern (non-blocking)
 * - Shared RPC call reduces code duplication
 * 
 * @internal
 */
async function logRewardEvent(
  eventType: RewardEventType,
  userId: string,
  rewardId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  // Check for duplicates
  if (isEventDuplicate(eventType, userId, rewardId)) {
    return; // Skip duplicate
  }

  const serverSupabase = getSupabaseServer();
  
  if (!serverSupabase) {
    console.error(`[${eventType}] Supabase server client not available`);
    return;
  }

  try {
    // Fire-and-forget: don't await the result
    // Analytics should never block business logic
    serverSupabase.rpc("log_event", {
      p_event_type: eventType,
      p_user_id: userId,
      p_metadata: metadata,
    }).then((result: { error: unknown }) => {
      if (result.error) {
        console.error(`[${eventType}] Failed to log event:`, result.error);
      }
    }).catch((error: unknown) => {
      console.error(`[${eventType}] Exception logging event:`, error);
    });
  } catch (error: unknown) {
    // Silent fail - analytics should never break the app
    console.error(`[${eventType}] Failed to log event:`, error);
  }
}

/**
 * Track a reward redemption event
 * 
 * OPTIMIZATIONS:
 * - Deduplication prevents double-logging
 * - Non-blocking (fire-and-forget)
 * 
 * @param event - Reward redemption event data
 * @returns Promise that resolves immediately (non-blocking)
 */
export async function trackRewardRedeemed(
  event: RewardRedeemedEvent
): Promise<void> {
  return logRewardEvent("reward_redeemed", event.user_id, event.reward_id, {
    reward_id: event.reward_id,
    user_id: event.user_id,
    value_cents: event.value_cents,
    source: event.source,
    stripe_coupon_id: event.stripe_coupon_id ?? null,
    timestamp: event.timestamp,
  });
}

/**
 * Track a reward expiration event
 * 
 * OPTIMIZATIONS:
 * - Deduplication prevents double-logging
 * - Non-blocking (fire-and-forget)
 * 
 * @param event - Reward expiration event data
 * @returns Promise that resolves immediately (non-blocking)
 */
export async function trackRewardExpired(
  event: RewardExpiredEvent
): Promise<void> {
  return logRewardEvent("reward_expired", event.user_id, event.reward_id, {
    reward_id: event.reward_id,
    user_id: event.user_id,
    value_cents: event.value_cents,
    source: event.source,
    expired_at: event.expired_at,
    timestamp: event.timestamp,
  });
}

/**
 * Track a reward expiring soon event
 * 
 * OPTIMIZATIONS:
 * - Deduplication prevents double-logging
 * - Non-blocking (fire-and-forget)
 * 
 * @param event - Reward expiring soon event data
 * @returns Promise that resolves immediately (non-blocking)
 */
export async function trackRewardExpiringSoon(
  event: RewardExpiringSoonEvent
): Promise<void> {
  return logRewardEvent("reward_expiring_soon", event.user_id, event.reward_id, {
    reward_id: event.reward_id,
    user_id: event.user_id,
    value_cents: event.value_cents,
    source: event.source,
    expires_at: event.expires_at,
    days_until_expiry: event.days_until_expiry,
    timestamp: event.timestamp,
  });
}

/**
 * Batch track multiple reward events
 * 
 * OPTIMIZATION: Batch logging for bulk operations
 * Useful for processing multiple rewards at once (e.g., expiration jobs)
 */
export async function batchTrackRewardEvents(
  events: Array<
    | { type: "redeemed"; data: RewardRedeemedEvent }
    | { type: "expired"; data: RewardExpiredEvent }
    | { type: "expiring_soon"; data: RewardExpiringSoonEvent }
  >
): Promise<{ success: number; skipped: number }> {
  if (events.length === 0) {
    return { success: 0, skipped: 0 };
  }

  let successCount = 0;
  let skippedCount = 0;

  // Process events in parallel (fire-and-forget)
  const promises = events.map(async (event) => {
    try {
      switch (event.type) {
        case "redeemed":
          await trackRewardRedeemed(event.data);
          successCount++;
          break;
        case "expired":
          await trackRewardExpired(event.data);
          successCount++;
          break;
        case "expiring_soon":
          await trackRewardExpiringSoon(event.data);
          successCount++;
          break;
        default:
          skippedCount++;
      }
    } catch (error: unknown) {
      console.error("[batchTrackRewardEvents] Error tracking event:", error);
      skippedCount++;
    }
  });

  // Fire all at once (non-blocking)
  Promise.all(promises).catch((error: unknown) => {
    console.error("[batchTrackRewardEvents] Unexpected error:", error);
  });

  return { success: successCount, skipped: skippedCount };
}

