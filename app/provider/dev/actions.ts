"use server";

import { getSupabaseServer } from "@/lib/supabase.server";
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
import type { DashboardData } from "../(console)/actions";

/**
 * Dev-only function to fetch dashboard data by providerId (no auth required)
 */
async function fetchDashboardDataForDev(providerId: number): Promise<DashboardData> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const nowIso = new Date().toISOString();

  // Fetch all data in parallel (same as normal dashboard)
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
    calculateProviderGrowthScore(supabase, providerId)
      .then((result) => ({
        growthScore: result.growthScore,
        previousScore: undefined,
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
        nextBestAction: undefined,
      }))
      .catch(() => null),
    fetchAnalyticsDataForDev(supabase, providerId).catch(() => null),
    fetchVisibilityBoostForDev(supabase, providerId).catch(() => null),
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

function getTierFromScore(score: number): "Bronze" | "Silver" | "Gold" | "None" {
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "None";
}

function getMultiplierFromTier(tier: "Bronze" | "Silver" | "Gold" | "None"): number {
  switch (tier) {
    case "Gold": return 1.5;
    case "Silver": return 1.25;
    case "Bronze": return 1.1;
    default: return 1.0;
  }
}

async function fetchAnalyticsDataForDev(supabase: ReturnType<typeof getSupabaseServer>, providerId: number) {
  const { data: metrics } = await supabase
    .from("v_provider_metrics")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (!metrics) return null;

  const thirtyDaysAgo = getThirtyDaysAgo();
  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("provider_id", providerId);

  const classIds = classes?.map((c: { id: number }) => c.id).filter((id: unknown): id is number => typeof id === "number") || [];

  const { data: bookingsByDayRaw } = await supabase
    .from("simple_bookings")
    .select("created_at, total_paid, status")
    .in("class_id", classIds)
    .gte("created_at", thirtyDaysAgo);

  // Group by day
  const bookingsByDay = (bookingsByDayRaw || []).reduce((acc: Record<string, { bookings: number; revenue: number }>, booking: { created_at: string; total_paid?: number | string | null; status?: string | null }) => {
    const date = booking.created_at.split("T")[0];
    if (!acc[date]) acc[date] = { bookings: 0, revenue: 0 };
    if (booking.status === "confirmed") {
      acc[date].bookings++;
      acc[date].revenue += Number(booking.total_paid) || 0;
    }
    return acc;
  }, {});

  return {
    provider_id: providerId,
    provider_name: metrics.provider_name || "",
    total_bookings: metrics.total_bookings || 0,
    confirmed_bookings: metrics.confirmed_bookings || 0,
    cancelled_bookings: metrics.cancelled_bookings || 0,
    total_revenue: metrics.total_revenue || 0,
    revenue_last_7_days: metrics.revenue_last_7_days || 0,
    revenue_last_30_days: metrics.revenue_last_30_days || 0,
    average_rating: metrics.average_rating || 0,
    review_count: metrics.review_count || 0,
    total_classes: metrics.total_classes || 0,
    active_classes: metrics.active_classes || 0,
    bookings_by_day: Object.entries(bookingsByDay).map(([date, data]: [string, unknown]) => {
      const typedData = data as { bookings: number; revenue: number };
      return {
        date,
        bookings: typedData.bookings,
        revenue: typedData.revenue,
      } as const;
    }),
    revenue_by_week: [],
  };
}

async function fetchVisibilityBoostForDev(supabase: ReturnType<typeof getSupabaseServer>, providerId: number) {
  const { data } = await supabase
    .from("provider_visibility_boosts")
    .select("boost_type, multiplier, expires_at")
    .eq("provider_id", providerId)
    .single();

  if (!data) return null;

  return {
    boost_type: data.boost_type,
    multiplier: data.multiplier,
    expires_at: data.expires_at || undefined,
  };
}

export async function getDashboardDataForDev(providerId: number): Promise<DashboardData> {
  return fetchDashboardDataForDev(providerId);
}

