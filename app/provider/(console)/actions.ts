"use server";

import { getSupabaseServer } from "@/lib/supabase.server";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../_lib/membership";
import { computeProviderGrowthScore } from "@/lib/gamification/growth-score-pipeline";
import type { SupabaseClient } from "@supabase/supabase-js";

// Wrapper function to match the expected signature
async function calculateProviderGrowthScore(
  supabase: SupabaseClient<any>,
  providerId: number
) {
  const result = await computeProviderGrowthScore(providerId, supabase);
  return {
    growthScore: result.growthScore,
    metrics: result.metrics,
    hasPhotos: result.hasPhotos,
    conversionRate: result.conversionRate,
    recentReviews: result.recentReviews,
    reviewResponseRate: result.reviewResponseRate,
    totalReviews: result.totalReviews,
    reviewsWithResponses: result.reviewsWithResponses,
    views: result.views,
    bookings: result.bookings,
  };
}
import { getThirtyDaysAgo } from "@/lib/provider-analytics/helpers";
import { unstable_cache } from "next/cache";

export type DashboardData = {
  // Overview stats
  overview: {
    totalClasses: number;
    publishedClasses: number;
    totalVenues: number;
    upcomingOccurrences: Array<{
      id: string;
      starts_at: string;
      ends_at: string | null;
      status: string;
      classes: { title: string | null } | null;
      venues: { name: string | null } | null;
    }>;
    isOnboardingComplete: boolean;
    hasOnboardingReward: boolean;
    rewardAmount: string;
  };
  // Growth score data
  growthScore: {
    growthScore: number;
    previousScore?: number;
    tier: "Bronze" | "Silver" | "Gold" | "None";
    multiplier: number;
    metrics: {
      profile_completion: number;
      listing_quality: number;
      booking_activity: number;
      reviews_score: number;
      referral_activity: number;
      hasPhotos?: boolean;
      conversionRate?: number;
      recentReviews?: number;
      reviewResponseRate?: number;
      totalReviews?: number;
      reviewsWithResponses?: number;
      views?: number;
      bookings?: number;
    };
    nextBestAction?: {
      title: string;
      explanation: string;
      estimatedImpact: string;
      suggestedDeadline: string;
      dashboardLink: string;
    };
  } | null;
  // Analytics metrics
  analytics: {
    provider_id: number;
    provider_name: string;
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    revenue_last_7_days: number;
    revenue_last_30_days: number;
    average_rating: number;
    review_count: number;
    total_classes: number;
    active_classes: number;
    bookings_by_day: Array<{ date: string; bookings: number; revenue: number }>;
    revenue_by_week: Array<{ week: string; revenue: number }>;
    views?: number;
    bookings_this_week?: number;
    conversion_rate?: number;
    search_appearances?: number;
    reviews_this_week?: number;
    profile_health_score?: number;
    views_change?: number;
    bookings_change?: number;
    conversion_change?: number;
    search_change?: number;
    reviews_change?: number;
    health_change?: number;
    low_slots_area?: string;
    available_slots?: number;
    total_slots?: number;
  } | null;
  // Visibility boost
  visibilityBoost: {
    boost_type: string;
    multiplier: number;
    expires_at?: string;
  } | null;
};

/**
 * Cached function to fetch dashboard data
 * Cache TTL: 60 seconds (1 minute)
 */
async function fetchDashboardData(providerId: number, _userId: string): Promise<DashboardData> {
    const supabase = getSupabaseServer();
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    const nowIso = new Date().toISOString();

    // Fetch all data in parallel
    const [
      classesCountResult,
      publishedCountResult,
      venuesCountResult,
      upcomingResult,
      onboardingResult,
      onboardingRewardResult,
      growthScoreResult,
      analyticsResult,
      visibilityBoostResult,
    ] = await Promise.all([
      // Overview stats
      supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId),
      supabase
        .from("classes")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("is_active", true),
      supabase
        .from("venues")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId),
      supabase
        .from("class_occurrences")
        .select(
          "id, starts_at, ends_at, status, classes:classes ( title ), venues:venues ( name )"
        )
        .eq("provider_id", providerId)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase
        .from("provider_onboarding")
        .select("is_complete")
        .eq("provider_id", providerId)
        .single(),
      supabase
        .from("provider_rewards")
        .select("id, reward_value, created_at")
        .eq("provider_id", providerId)
        .eq("reward_type", "provider_onboarding")
        .maybeSingle(),
      // Growth score (with error handling)
      calculateProviderGrowthScore(supabase, providerId)
        .then((result) => {
          // Transform to match DashboardData structure
          return {
            growthScore: result.growthScore,
            previousScore: undefined, // Would need to fetch from previous week
            tier: getTierFromScore(result.growthScore),
            multiplier: getMultiplierFromTier(getTierFromScore(result.growthScore)),
            metrics: {
              profile_completion: result.metrics?.profile_completion || 0,
              listing_quality: result.metrics?.listing_quality || 0,
              booking_activity: result.metrics?.booking_activity || 0,
              reviews_score: result.metrics?.reviews_score || 0,
              referral_activity: result.metrics?.referral_activity || 0,
              hasPhotos: result.hasPhotos,
              conversionRate: result.conversionRate,
              recentReviews: result.recentReviews,
              reviewResponseRate: result.reviewResponseRate,
              totalReviews: result.totalReviews,
              reviewsWithResponses: result.reviewsWithResponses,
              views: result.views,
              bookings: result.bookings,
            },
            nextBestAction: undefined, // Would need to fetch from next-action endpoint
          };
        })
        .catch((err) => {
          console.error("[getDashboardData] Growth score error:", err);
          return null;
        }),
      // Analytics (with error handling)
      fetchAnalyticsData(supabase, providerId).catch((err) => {
        console.error("[getDashboardData] Analytics error:", err);
        return null;
      }),
      // Visibility boost (with error handling)
      fetchVisibilityBoost(supabase, providerId).catch((err) => {
        console.error("[getDashboardData] Visibility boost error:", err);
        return null;
      }),
    ]);

    const totalClasses = classesCountResult.count ?? 0;
    const publishedClasses = publishedCountResult.count ?? 0;
    const totalVenues = venuesCountResult.count ?? 0;
    const upcomingOccurrences = (upcomingResult.data ?? []) as DashboardData["overview"]["upcomingOccurrences"];
    const isOnboardingComplete = onboardingResult.data?.is_complete ?? false;
    const hasOnboardingReward = !!onboardingRewardResult.data;
    const rewardAmount = onboardingRewardResult.data?.reward_value
      ? (onboardingRewardResult.data.reward_value / 100).toFixed(2)
      : "2.00";

    return {
      overview: {
        totalClasses,
        publishedClasses,
        totalVenues,
        upcomingOccurrences,
        isOnboardingComplete,
        hasOnboardingReward,
        rewardAmount,
      },
      growthScore: growthScoreResult,
      analytics: analyticsResult,
      visibilityBoost: visibilityBoostResult,
    };
}

/**
 * Fetch analytics data (extracted from metrics route)
 */
async function fetchAnalyticsData(supabase: ReturnType<typeof getSupabaseServer>, providerId: number) {
  // Get provider metrics from view
  const { data: metrics, error: metricsError } = await supabase
    .from("v_provider_metrics")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (metricsError) {
    throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
  }

  // Get bookings by day (last 30 days)
  const thirtyDaysAgo = getThirtyDaysAgo();
  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("provider_id", providerId);

  const classIds = classes?.map((c: { id?: number | null }) => c.id).filter((id: number | null | undefined): id is number => typeof id === "number") || [];

  const { data: bookingsByDayRaw } = await supabase
    .from("simple_bookings")
    .select("created_at, amount_cents, status, email")
    .in("class_id", classIds.length > 0 ? classIds : [-1])
    .eq("status", "confirmed")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const bookingsByDay = bookingsByDayRaw?.filter(
    (booking: { email?: string | null }) => booking.email && !booking.email.toLowerCase().includes("@example.com")
  ) || [];

  const bookingsByDayMap = new Map<string, { count: number; revenue: number }>();
  bookingsByDay.forEach((booking: { created_at?: string | Date | null; amount_cents?: number | null }) => {
    if (!booking.created_at) return;
    const date = new Date(booking.created_at).toISOString().split("T")[0];
    const existing = bookingsByDayMap.get(date) || { count: 0, revenue: 0 };
    const amount = (booking.amount_cents || 0) / 100;
    bookingsByDayMap.set(date, {
      count: existing.count + 1,
      revenue: existing.revenue + amount,
    });
  });

  const bookingsByDayArray = Array.from(bookingsByDayMap.entries()).map(([date, data]) => ({
    date,
    bookings: data.count,
    revenue: data.revenue,
  }));

  // Get revenue by week (last 12 weeks)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  twelveWeeksAgo.setHours(0, 0, 0, 0);

  const { data: bookingsByWeekRaw } = await supabase
    .from("simple_bookings")
    .select("created_at, amount_cents, status, email")
    .in("class_id", classIds.length > 0 ? classIds : [-1])
    .eq("status", "confirmed")
    .gte("created_at", twelveWeeksAgo.toISOString());

  const bookingsByWeek = bookingsByWeekRaw?.filter(
    (booking: { email?: string | null }) => booking.email && !booking.email.toLowerCase().includes("@example.com")
  ) || [];

  const revenueByWeekMap = new Map<string, number>();
  bookingsByWeek.forEach((booking: { created_at?: string | Date | null; amount_cents?: number | null }) => {
    if (!booking.created_at) return;
    const date = new Date(booking.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split("T")[0];
    const existing = revenueByWeekMap.get(weekKey) || 0;
    const amount = (booking.amount_cents || 0) / 100;
    revenueByWeekMap.set(weekKey, existing + amount);
  });

  const revenueByWeekArray = Array.from(revenueByWeekMap.entries())
    .map(([week, revenue]) => ({ week, revenue }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Get weekly analytics
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const { data: weeklyData } = await supabase
    .from("provider_analytics_weekly")
    .select("*")
    .eq("provider_id", providerId)
    .eq("week_start", weekStartStr)
    .single();

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekStartStr = lastWeekStart.toISOString().split("T")[0];

  const { data: lastWeekData } = await supabase
    .from("provider_analytics_weekly")
    .select("*")
    .eq("provider_id", providerId)
    .eq("week_start", lastWeekStartStr)
    .single();

  // Calculate profile health score
  let profileHealthScore = 0;
  if (metrics?.total_classes > 0) profileHealthScore += 10;
  if (metrics?.active_classes > 0) profileHealthScore += 10;
  if (metrics?.average_rating > 0) profileHealthScore += 10;
  if (metrics?.review_count > 0) profileHealthScore += 10;
  if (metrics?.total_bookings > 10) profileHealthScore += 15;
  else if (metrics?.total_bookings > 0) profileHealthScore += 5;
  if (metrics?.revenue_last_30_days > 0) profileHealthScore += 15;
  if (metrics?.review_count > 5) profileHealthScore += 15;
  else if (metrics?.review_count > 0) profileHealthScore += 5;
  if (metrics?.average_rating >= 4.5) profileHealthScore += 15;
  else if (metrics?.average_rating >= 4.0) profileHealthScore += 10;
  else if (metrics?.average_rating > 0) profileHealthScore += 5;
  profileHealthScore = Math.min(100, profileHealthScore);

  // Calculate changes
  const viewsChange = weeklyData && lastWeekData
    ? Math.round(((weeklyData.views - lastWeekData.views) / Math.max(lastWeekData.views, 1)) * 100)
    : undefined;
  const bookingsChange = weeklyData && lastWeekData
    ? Math.round(((weeklyData.bookings - lastWeekData.bookings) / Math.max(lastWeekData.bookings, 1)) * 100)
    : undefined;
  const conversionChange = weeklyData && lastWeekData
    ? Math.round((Number(weeklyData.conversion_rate) - Number(lastWeekData.conversion_rate)) * 10) / 10
    : undefined;
  const searchChange = weeklyData && lastWeekData
    ? Math.round(((weeklyData.search_appearances - lastWeekData.search_appearances) / Math.max(lastWeekData.search_appearances, 1)) * 100)
    : undefined;
  const reviewsChange = weeklyData && lastWeekData
    ? Math.round(((weeklyData.reviews - lastWeekData.reviews) / Math.max(lastWeekData.reviews, 1)) * 100)
    : undefined;
  const healthChange = weeklyData && lastWeekData
    ? Math.round(profileHealthScore - (lastWeekData.profile_health_score || 0))
    : undefined;

  return {
    provider_id: providerId,
    ...metrics,
    bookings_by_day: bookingsByDayArray,
    revenue_by_week: revenueByWeekArray,
    average_rating: metrics?.average_rating || 0,
    views: weeklyData?.views || 0,
    bookings_this_week: weeklyData?.bookings || 0,
    conversion_rate: weeklyData ? Number(weeklyData.conversion_rate) : 0,
    search_appearances: weeklyData?.search_appearances || 0,
    reviews_this_week: weeklyData?.reviews || 0,
    profile_health_score: profileHealthScore,
    views_change: viewsChange,
    bookings_change: bookingsChange,
    conversion_change: conversionChange,
    search_change: searchChange,
    reviews_change: reviewsChange,
    health_change: healthChange,
  } as DashboardData["analytics"];
}

/**
 * Helper functions for growth score
 */
function getTierFromScore(score: number): "Bronze" | "Silver" | "Gold" | "None" {
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "None";
}

function getMultiplierFromTier(tier: "Bronze" | "Silver" | "Gold" | "None"): number {
  switch (tier) {
    case "Gold":
      return 1.30;
    case "Silver":
      return 1.15;
    case "Bronze":
      return 1.05;
    default:
      return 1.0;
  }
}

/**
 * Fetch visibility boost data
 */
async function fetchVisibilityBoost(supabase: ReturnType<typeof getSupabaseServer>, providerId: number) {
  const { data: boost } = await supabase
    .from("provider_visibility_boosts")
    .select("boost_type, multiplier, expires_at")
    .eq("provider_id", providerId)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!boost || !boost.multiplier || boost.multiplier <= 1.0) {
    return null;
  }

  return {
    boost_type: boost.boost_type || "Premium",
    multiplier: boost.multiplier,
    expires_at: boost.expires_at || undefined,
  };
}

/**
 * Main server action to fetch all dashboard data
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createSupabaseServerComponentClient();
  const membership = await getActiveMembershipForUser(supabase, userId);
  
  if (!membership?.providers) {
    throw new Error("Provider not found");
  }

  const providerId = membership.provider_id;
  
  // Use cached function with provider-specific cache key
  return unstable_cache(
    () => fetchDashboardData(providerId, userId),
    [`provider-dashboard-${providerId}`],
    {
      revalidate: 60, // 1 minute cache
      tags: [`provider-dashboard:${providerId}`],
    }
  )();
}

