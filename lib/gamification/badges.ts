/**
 * Provider Badge System
 * Handles badge unlocking and tracking
 */

import { createClient } from "@/lib/supabase/server";
import type { InsertProviderBadge } from "@/shared/schema";
import { castDb } from "@/lib/supabase/type-helpers";
import {
  calculateReviewMetrics,
  calculateActivityMetrics,
  getWeekStart,
  type Review,
  type Class,
} from "./core";

export type BadgeType =
  | "onboarding_complete"
  | "seo_optimised"
  | "top_rated"
  | "fast_responder"
  | "consistency_star";

export const BADGE_DEFINITIONS: Record<
  BadgeType,
  { name: string; description: string; icon: string }
> = {
  onboarding_complete: {
    name: "Onboarding Complete",
    description: "Completed all onboarding steps",
    icon: "🎯",
  },
  seo_optimised: {
    name: "SEO Optimised",
    description: "Achieved 80+ SEO score",
    icon: "🔍",
  },
  top_rated: {
    name: "Top Rated",
    description: "Average rating of 4.5+ with 10+ reviews",
    icon: "⭐",
  },
  fast_responder: {
    name: "Fast Responder",
    description: "Average response time under 2 hours",
    icon: "⚡",
  },
  consistency_star: {
    name: "Consistency Star",
    description: "3 weeks of consistent activity",
    icon: "✨",
  },
};

/**
 * Save multiple badges for a provider
 * Unified function to replace multiple scattered insert blocks
 */
export async function saveProviderBadges(
  providerId: number,
  badges: Array<{ type: BadgeType; metadata?: Record<string, unknown> }>
): Promise<{ success: boolean; awarded: BadgeType[]; skipped: BadgeType[] }> {
  const supabase = await createClient();
  const awarded: BadgeType[] = [];
  const skipped: BadgeType[] = [];

  try {
    // Check which badges already exist
    const badgeTypes = badges.map((b) => b.type);
    const { data: existing } = await supabase
      .from("provider_badges")
      .select("badge_type")
      .eq("provider_id", providerId)
      .in("badge_type", badgeTypes);

    const existingTypes = new Set(
      (existing || []).map((e: { badge_type: string }) => e.badge_type as BadgeType)
    );

    // Filter out badges that already exist
    const newBadges = badges.filter((b) => !existingTypes.has(b.type));

    if (newBadges.length === 0) {
      return { success: true, awarded, skipped: badgeTypes };
    }

    // Batch insert new badges
    const { error } = await supabase
      .from("provider_badges")
      .insert(
        newBadges.map((b) =>
          castDb<InsertProviderBadge>({
            provider_id: providerId,
            badge_type: b.type,
            metadata: b.metadata || {},
          })
        )
      );

    if (error) {
      console.error("Error saving badges:", error);
      return { success: false, awarded, skipped: badgeTypes };
    }

    // Track which were awarded vs skipped
    badges.forEach((b) => {
      if (existingTypes.has(b.type)) {
        skipped.push(b.type);
      } else {
        awarded.push(b.type);
      }
    });

    return { success: true, awarded, skipped };
  } catch (error) {
    console.error("Error saving badges:", error);
    return { success: false, awarded, skipped };
  }
}

/**
 * Award a badge to a provider
 * Wrapper for backward compatibility
 */
export async function awardBadge(
  providerId: number,
  badgeType: BadgeType,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; alreadyEarned: boolean }> {
  const result = await saveProviderBadges(providerId, [{ type: badgeType, metadata }]);
  return {
    success: result.success && result.awarded.length > 0,
    alreadyEarned: result.skipped.includes(badgeType),
  };
}

/**
 * Get all badges for a provider
 */
export async function getProviderBadges(providerId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_badges")
    .select("*")
    .eq("provider_id", providerId)
    .order("earned_at", { ascending: false });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return (data || []).map((badge: { badge_type: string; [key: string]: unknown }) => ({
    ...badge,
    ...BADGE_DEFINITIONS[badge.badge_type as BadgeType],
  }));
}

/**
 * Check and award badges based on provider metrics
 * Unified badge assignment function
 */
export async function checkAndAwardBadges(providerId: number): Promise<BadgeType[]> {
  const supabase = await createClient();
  const eligibleBadges: Array<{ type: BadgeType; metadata?: Record<string, unknown> }> = [];

  try {
    // Get provider data
    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (!provider) return [];

    // Get classes for this provider
    const { data: classes } = await supabase
      .from("classes")
      .select("id, rating, review_count, provider_id")
      .eq("provider_id", providerId)
      .eq("is_active", true);

    // Get onboarding status
    const { data: onboarding } = await supabase
      .from("provider_onboarding")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    // Get SEO score
    const { data: seoScore } = await supabase
      .from("provider_seo_scores")
      .select("score")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get booking requests for response rate
    const { data: bookingRequests } = await supabase
      .from("booking_requests")
      .select("created_at, responded_at")
      .eq("provider_id", providerId)
      .not("responded_at", "is", null);

    // Determine eligible badges

    // 1. Onboarding Complete
    if (onboarding?.is_complete) {
      eligibleBadges.push({ type: "onboarding_complete" });
    }

    // 2. SEO Optimised
    if (seoScore && seoScore.score >= 80) {
      eligibleBadges.push({ type: "seo_optimised", metadata: { score: seoScore.score } });
    }

    // 3. Top Rated
    if (classes && classes.length > 0) {
      const reviewMetrics = calculateReviewMetrics(
        classes.map((c: { rating?: string | number | null; review_count?: number | null }) => ({
          rating: c.rating,
          review_count: c.review_count,
        })) as Review[]
      );

      if (reviewMetrics.count >= 10 && reviewMetrics.avgRating >= 4.5) {
        eligibleBadges.push({
          type: "top_rated",
          metadata: { count: reviewMetrics.count, avgRating: reviewMetrics.avgRating },
        });
      }
    }

    // 4. Fast Responder
    if (bookingRequests && bookingRequests.length >= 5) {
      const reviewMetrics = calculateReviewMetrics(
        bookingRequests.map((br: { created_at?: string | null; responded_at?: string | null }) => ({
          created_at: br.created_at,
          responded_at: br.responded_at,
        })) as Review[]
      );

      if (reviewMetrics.avgResponseTime > 0 && reviewMetrics.avgResponseTime <= 2) {
        eligibleBadges.push({
          type: "fast_responder",
          metadata: { avgResponseTime: reviewMetrics.avgResponseTime },
        });
      }
    }

    // 5. Consistency Star - check weekly activity
    const { data: weeklyActivities } = await supabase
      .from("provider_xp_events")
      .select("created_at")
      .eq("provider_id", providerId)
      .eq("event_type", "weekly_activity")
      .order("created_at", { ascending: false })
      .limit(3);

    if (weeklyActivities && weeklyActivities.length >= 3) {
      const activityMetrics = calculateActivityMetrics(
        classes as Class[],
        [],
        [],
        weeklyActivities
      );

      if (activityMetrics.weeklyStreak >= 3) {
        eligibleBadges.push({
          type: "consistency_star",
          metadata: { streak: activityMetrics.weeklyStreak },
        });
      }
    }

    // Batch save all eligible badges
    const result = await saveProviderBadges(providerId, eligibleBadges);
    return result.awarded;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
}

