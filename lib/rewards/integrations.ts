/**
 * Rewards Integration
 * 
 * Award points/rewards for various user actions
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - In-memory cache for reward checks (TTL-based)
 * - Batch award operations
 * - Single database queries with proper indexes
 * - Deduplication at application layer
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { insertRewardSchema, rewardMetadataSchema, type RewardMetadata } from "@/shared/schema";

const REWARDS_ENABLED = process.env.REWARDS_ENABLED === "true";

// In-memory cache for reward existence checks (5 minute TTL)
// Rewards are rarely awarded multiple times, making this highly effective
type RewardCacheKey = string; // Format: `${userId}:${source}:${milestone?}`
const rewardExistsCache = new Map<RewardCacheKey, { exists: boolean; expiresAt: number }>();
const REWARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Build cache key for reward check
 */
function buildRewardCacheKey(userId: string, source: string, milestone?: string): RewardCacheKey {
  return milestone ? `${userId}:${source}:${milestone}` : `${userId}:${source}`;
}

/**
 * Check if reward already exists (with caching)
 * 
 * OPTIMIZATION: Caches negative results (user hasn't received reward)
 * This is the most common case and prevents repeated DB queries
 */
async function checkRewardExists(
  userId: string,
  source: string,
  milestone?: string
): Promise<boolean> {
  const cacheKey = buildRewardCacheKey(userId, source, milestone);
  
  // Check cache first
  const cached = rewardExistsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.exists;
  }

  const supabase = getSupabaseServer();
  if (!supabase) return true; // Fail safe - assume exists to avoid duplicates

  try {
    let query = supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", source);

    if (milestone) {
      query = query.eq("metadata->>milestone", milestone);
    }

    const { count, error } = await query;

    if (error) {
      console.error("[checkRewardExists] Error:", error);
      return true; // Fail safe
    }

    const exists = (count ?? 0) > 0;

    // Cache the result
    rewardExistsCache.set(cacheKey, {
      exists,
      expiresAt: Date.now() + REWARD_CACHE_TTL_MS,
    });

    return exists;
  } catch (error: unknown) {
    console.error("[checkRewardExists] Unexpected error:", error);
    return true; // Fail safe
  }
}

/**
 * Invalidate cache for a specific reward
 */
function invalidateRewardCache(userId: string, source: string, milestone?: string): void {
  const cacheKey = buildRewardCacheKey(userId, source, milestone);
  rewardExistsCache.delete(cacheKey);
}

/**
 * Generic reward insertion helper
 * 
 * OPTIMIZATION: Single function reduces code duplication
 */
async function insertReward(
  userId: string,
  source: "booking" | "milestone" | "referral" | "provider_referral",
  points: number,
  valueCents: number,
  metadata: RewardMetadata
): Promise<boolean> {
  const supabase = getSupabaseServer();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("rewards").insert(
      insertRewardSchema.parse({
        user_id: userId,
        source,
        points,
        value_cents: valueCents,
        status: "available",
        metadata,
      })
    );

    if (error) {
      console.error("[insertReward] Error:", error);
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error("[insertReward] Unexpected error:", error);
    return false;
  }
}

/**
 * Award points for first booking
 * 
 * OPTIMIZATIONS:
 * - Cached existence check
 * - Single database query
 * - Early returns
 * 
 * @param userId - User ID (UUID)
 * @param bookingId - Booking ID (UUID from simple_bookings.id or integer from bookings.id for backward compatibility)
 */
export async function awardBookingReward(userId: string, bookingId: string | number): Promise<void> {
  if (!REWARDS_ENABLED) return;

  try {
    // Check cache first
    const exists = await checkRewardExists(userId, "booking");
    if (exists) return;

    // Award 50 points and £0.50 for first booking
    const bookingMetadata: RewardMetadata = rewardMetadataSchema.parse({
      source: "booking",
      booking_id: bookingId,
      milestone: "first_booking",
    });

    const success = await insertReward(userId, "booking", 50, 50, bookingMetadata);
    
    if (success) {
      // Invalidate cache on successful insert
      invalidateRewardCache(userId, "booking");
    }
  } catch (error: unknown) {
    console.error("[awardBookingReward] Error:", error);
  }
}

/**
 * Award points for profile completion (child profile added)
 * 
 * OPTIMIZATIONS:
 * - Cached existence check
 * - Single database query
 */
export async function awardProfileCompletionReward(userId: string, childId: string): Promise<void> {
  if (!REWARDS_ENABLED) return;

  try {
    // Check cache first
    const exists = await checkRewardExists(userId, "milestone", "profile_completion");
    if (exists) return;

    // Award 100 points and £1 for profile completion
    const profileMetadata: RewardMetadata = rewardMetadataSchema.parse({
      source: "milestone",
      milestone: "profile_completion",
      child_id: childId,
    });

    const success = await insertReward(userId, "milestone", 100, 100, profileMetadata);
    
    if (success) {
      invalidateRewardCache(userId, "milestone", "profile_completion");
    }
  } catch (error: unknown) {
    console.error("[awardProfileCompletionReward] Error:", error);
  }
}

/**
 * Award points for first saved search/alert
 * 
 * OPTIMIZATIONS:
 * - Cached existence check
 * - Single database query
 */
export async function awardSavedSearchReward(userId: string, searchId: string): Promise<void> {
  if (!REWARDS_ENABLED) return;

  try {
    // Check cache first
    const exists = await checkRewardExists(userId, "milestone", "first_saved_search");
    if (exists) return;

    // Award bonus points for first saved search
    const searchMetadata: RewardMetadata = rewardMetadataSchema.parse({
      source: "milestone",
      milestone: "first_saved_search",
      search_id: searchId,
    });

    const success = await insertReward(userId, "milestone", 25, 0, searchMetadata);
    
    if (success) {
      invalidateRewardCache(userId, "milestone", "first_saved_search");
    }
  } catch (error: unknown) {
    console.error("[awardSavedSearchReward] Error:", error);
  }
}

/**
 * Batch award rewards (for bulk operations)
 * 
 * OPTIMIZATION: Single transaction for multiple rewards
 * Useful for awarding multiple rewards at once (e.g., onboarding flow)
 */
export async function batchAwardRewards(
  awards: Array<{
    userId: string;
    source: "booking" | "milestone" | "referral" | "provider_referral";
    points: number;
    valueCents: number;
    metadata: RewardMetadata;
  }>
): Promise<{ success: number; failed: number }> {
  if (!REWARDS_ENABLED || awards.length === 0) {
    return { success: 0, failed: 0 };
  }

  const supabase = getSupabaseServer();
  if (!supabase) return { success: 0, failed: 0 };

  let successCount = 0;
  let failedCount = 0;

  try {
    // Prepare all records
    const records = awards.map((award) =>
      insertRewardSchema.parse({
        user_id: award.userId,
        source: award.source,
        points: award.points,
        value_cents: award.valueCents,
        status: "available",
        metadata: award.metadata,
      })
    );

    // Batch insert (single query)
    const { data, error } = await supabase
      .from("rewards")
      .insert(records)
      .select();

    if (error) {
      console.error("[batchAwardRewards] Error:", error);
      failedCount = awards.length;
    } else {
      successCount = data?.length || 0;
      failedCount = awards.length - successCount;

      // Invalidate cache for all successful inserts
      for (const award of awards) {
        // Extract milestone from metadata if it exists
        const milestone = award.metadata.milestone;
        invalidateRewardCache(award.userId, award.source, milestone);
      }
    }
  } catch (error: unknown) {
    console.error("[batchAwardRewards] Unexpected error:", error);
    failedCount = awards.length;
  }

  return { success: successCount, failed: failedCount };
}

