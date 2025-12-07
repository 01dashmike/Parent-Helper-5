/**
 * Growth Score Pipeline
 * Canonical calculation and data loading for provider growth scores
 */

import { createClient } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import {
  calculateReviewMetrics,
  calculateActivityMetrics,
  calculateTrendMetrics,
  getDaysAgo,
  type Review,
  type Class,
} from "./core";
import {
  calculateGrowthScore,
  calculateProfileCompletionScore,
  calculateListingQualityScore,
  calculateBookingActivityScore,
  calculateReviewsScore,
  calculateReferralActivityScore,
  type GrowthScoreMetrics,
  type GrowthScoreResult,
} from "@/lib/growth-score";
import { getProviderAnalyticsMetrics, getProviderBookings } from "@/lib/provider-analytics/helpers";

/**
 * Provider gamification data structure
 */
export interface ProviderGamificationData {
  provider: {
    id: number;
    name?: string | null;
    description_raw?: string | null;
    description_override?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    website?: string | null;
    address_line1?: string | null;
    postcode?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    youtube_url?: string | null;
    stripe_account_id?: string | null;
    booking_enabled?: boolean | null;
    metadata?: unknown;
  };
  classes: Class[];
  reviews: Review[];
  bookingRequests: Array<{
    created_at?: string | null;
    responded_at?: string | null;
    status?: string | null;
  }>;
  sessions: Array<{ class_id?: number | null }>;
  bookings: Array<{ status?: string | null }>;
  weeklyActivities: Array<{ created_at?: string | Date | null }>;
  referralAnalytics: Array<{ event_type?: string | null }>;
  metrics: {
    total_bookings?: number | null;
    revenue_last_30_days?: number | null;
    review_count?: number | null;
    average_rating?: string | number | null;
  } | null;
  seoScore: { score?: number | null } | null;
  historicalScores: number[];
}

/**
 * Load all provider gamification data in one unified call
 * Replaces multiple scattered data loads across files
 */
export async function loadProviderGamificationData(
  providerId: number,
  supabase?: ReturnType<typeof getSupabaseServer>
): Promise<ProviderGamificationData> {
  const client = supabase || getSupabaseServer();
  if (!client) {
    throw new Error("Supabase client not available");
  }

  // Load provider data
  const { data: provider } = await client
    .from("providers")
    .select("*")
    .eq("id", providerId)
    .single();

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Load classes
  const { data: classes } = await client
    .from("classes")
    .select("id, name, description, rating, review_count, is_active, image_urls, provider_id")
    .eq("provider_id", providerId);

  // Load reviews
  const { data: reviews } = await client
    .from("provider_reviews")
    .select("id, rating, response_text, response_at, created_at, responded_at")
    .eq("provider_id", providerId)
    .eq("status", "approved");

  // Load booking requests for response time
  const { data: bookingRequests } = await client
    .from("booking_requests")
    .select("created_at, responded_at, status")
    .eq("provider_id", providerId);

  // Load sessions
  const classIds = (classes || [])
    .map((c: { id?: number | null }) => c.id)
    .filter((id: number | null | undefined): id is number => typeof id === "number");
  const { data: sessions } =
    classIds.length > 0
      ? await client
          .from("class_sessions")
          .select("class_id")
          .in("class_id", classIds)
      : { data: null };

  // Load bookings
  const thirtyDaysAgo = getDaysAgo(30);
  const { data: bookings } = await client
    .from("bookings")
    .select("status, created_at")
    .eq("provider_id", providerId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .eq("status", "confirmed");

  // Load weekly activities for streak
  const { data: weeklyActivities } = await client
    .from("provider_xp_events")
    .select("created_at")
    .eq("provider_id", providerId)
    .eq("event_type", "weekly_activity")
    .order("created_at", { ascending: false })
    .limit(12);

  // Load referral analytics
  const { data: referralAnalytics } = await client
    .from("provider_referral_analytics")
    .select("event_type")
    .eq("provider_id", providerId);

  // Load provider metrics view
  const { data: metrics } = await client
    .from("v_provider_metrics")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  // Load SEO score
  const { data: seoScore } = await client
    .from("provider_seo_scores")
    .select("score")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Load historical scores
  const { data: historicalScoresData } = await client
    .from("provider_growth_score")
    .select("growth_score")
    .eq("provider_id", providerId)
    .order("week_start", { ascending: false })
    .limit(12);

  const historicalScores =
    historicalScoresData?.map((s: { growth_score?: number | null }) => s.growth_score || 0) || [];

  return {
    provider: provider as ProviderGamificationData["provider"],
    classes: (classes || []) as Class[],
    reviews: (reviews || []) as Review[],
    bookingRequests: bookingRequests || [],
    sessions: sessions || [],
    bookings: bookings || [],
    weeklyActivities: weeklyActivities || [],
    referralAnalytics: referralAnalytics || [],
    metrics: metrics,
    seoScore: seoScore,
    historicalScores,
  };
}

/**
 * Compute provider growth score using canonical pipeline
 * Uses shared data loader and core utilities
 */
export async function computeProviderGrowthScore(
  providerId: number,
  supabase?: ReturnType<typeof getSupabaseServer>
): Promise<ExtendedGrowthScoreResult> {
  // Load all data
  const data = await loadProviderGamificationData(providerId, supabase);

  // Calculate review metrics using core utility
  const reviewMetrics = calculateReviewMetrics(data.reviews);

  // Activity and trend metrics calculated but not currently used in score calculation
  // Available for future enhancements if needed

  // Calculate profile completion
  const hasPhotos = data.classes.some((cls) => {
    const classWithImages = cls as Class & { images?: unknown };
    const images = classWithImages.images;
    return Array.isArray(images) && images.length > 0;
  });
  const profileCompletion = calculateProfileCompletionScore({
    hasDescription: !!(data.provider.description_raw || data.provider.description_override),
    hasContactInfo: !!(data.provider.contact_email || data.provider.contact_phone),
    hasClasses: data.classes.length > 0,
    hasPhotos,
    hasSocialLinks: !!(
      data.provider.facebook_url ||
      data.provider.instagram_url ||
      data.provider.website
    ),
  });

  // Calculate listing quality
  const totalClasses = data.classes.length;
  const activeClasses = data.classes.filter((c) => c.is_active).length;
  const avgRating = reviewMetrics.avgRating;
  const classesWithDescriptions = data.classes.filter(
    (c) => c.description && c.description.trim().length > 0
  ).length;
  const listingQuality = calculateListingQualityScore({
    totalClasses,
    activeClasses,
    avgClassRating: avgRating,
    classesWithDescriptions,
  });

  // Get analytics metrics (30-day window) - single call
  const client = supabase || getSupabaseServer();
  if (!client) {
    throw new Error("Supabase client not available");
  }
  const analyticsMetrics = await getProviderAnalyticsMetrics(client, providerId);
  const bookingsLast30Days = await getProviderBookings(client, providerId);

  // Calculate booking activity
  const bookingActivity = calculateBookingActivityScore({
    totalBookings: data.metrics?.total_bookings || 0,
    bookingsLast30Days,
    revenueLast30Days: data.metrics?.revenue_last_30_days || 0,
    conversionRate: analyticsMetrics.conversionRate,
  });

  // Calculate reviews score
  const reviewsScore = calculateReviewsScore({
    reviewCount: data.metrics?.review_count || 0,
    averageRating: data.metrics?.average_rating
      ? Number(data.metrics.average_rating)
      : reviewMetrics.avgRating,
    recentReviews: analyticsMetrics.recentReviews,
  });

  // Calculate referral activity
  const registrations =
    data.referralAnalytics.filter((r) => r.event_type === "registration").length || 0;
  const listingsCreated =
    data.referralAnalytics.filter((r) => r.event_type === "listing_created").length || 0;
  const firstBookings =
    data.referralAnalytics.filter((r) => r.event_type === "first_booking").length || 0;
  const referralActivity = calculateReferralActivityScore(
    registrations,
    listingsCreated,
    firstBookings
  );

  // Calculate review response rate
  const reviewResponseRate = reviewMetrics.responseRate;

  // Build growth metrics
  const growthMetrics: GrowthScoreMetrics = {
    profile_completion: profileCompletion,
    listing_quality: listingQuality,
    booking_activity: bookingActivity,
    reviews_score: reviewsScore,
    referral_activity: referralActivity,
    reviewResponseRate,
  };

  // Calculate final score
  const result = calculateGrowthScore(growthMetrics);

  // Return result with additional data for API response
  // Extend GrowthScoreResult type to include additional metadata
  return {
    ...result,
    // Include additional metadata for API consumers
    hasPhotos,
    conversionRate: analyticsMetrics.conversionRate,
    recentReviews: analyticsMetrics.recentReviews,
    totalReviews: reviewMetrics.count,
    reviewsWithResponses: Math.round((reviewMetrics.responseRate / 100) * reviewMetrics.count),
    reviewResponseRate,
    views: analyticsMetrics.views,
    bookings: analyticsMetrics.bookings,
  };
}

/**
 * Extended growth score result type for API responses
 */
export type ExtendedGrowthScoreResult = GrowthScoreResult & {
  hasPhotos: boolean;
  conversionRate: number;
  recentReviews: number;
  totalReviews: number;
  reviewsWithResponses: number;
  reviewResponseRate: number;
  views: number;
  bookings: number;
};

