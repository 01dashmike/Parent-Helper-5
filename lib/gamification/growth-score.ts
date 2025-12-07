/**
 * Provider Growth Score v2
 * Composite ranking metric based on multiple factors
 */

import { createClient } from "@/lib/supabase/server";

export interface GrowthScoreBreakdown {
  listing_health: number; // 0-100
  seo_score: number; // 0-100
  response_rate: number; // 0-100
  bookings: number; // 0-100
  reviews: number; // 0-100
  engagement: number; // 0-100
}

export interface GrowthScoreResult {
  score: number; // 0-100
  breakdown: GrowthScoreBreakdown;
  recommendations: string[];
  trend: number[]; // Historical scores
}

// Weights for each component
const WEIGHTS = {
  listing_health: 0.3,
  seo_score: 0.2,
  response_rate: 0.15,
  bookings: 0.2,
  reviews: 0.1,
  engagement: 0.05,
} as const;

/**
 * Calculate listing health score (0-100)
 */
async function calculateListingHealth(providerId: number): Promise<number> {
  const supabase = await createClient();
  let score = 0;
  let maxScore = 0;

  // Get provider data
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("id", providerId)
    .single();

  if (!provider) return 0;

  // Logo (10 points)
  maxScore += 10;
  const metadata = provider.metadata as Record<string, unknown> | undefined;
  if (metadata?.logo_url) score += 10;

  // Bio (15 points)
  maxScore += 15;
  if (provider.description_raw || provider.description_override) {
    const bioLength = (provider.description_raw || provider.description_override || "").length;
    score += Math.min(15, (bioLength / 100) * 15);
  }

  // Contact info (10 points)
  maxScore += 10;
  if (provider.contact_email) score += 5;
  if (provider.contact_phone) score += 5;

  // Location (15 points)
  maxScore += 15;
  if (provider.address_line1 && provider.postcode) score += 10;
  if (provider.latitude && provider.longitude) score += 5;

  // Website (5 points)
  maxScore += 5;
  if (provider.website) score += 5;

  // Social media (5 points)
  maxScore += 5;
  const socialCount = [
    provider.facebook_url,
    provider.instagram_url,
    provider.tiktok_url,
    provider.youtube_url,
  ].filter(Boolean).length;
  score += Math.min(5, socialCount * 1.25);

  // Classes with photos (20 points)
  maxScore += 20;
  const { data: classes } = await supabase
    .from("classes")
    .select("image_urls")
    .eq("provider_id", providerId)
    .eq("is_active", true);

  if (classes && classes.length > 0) {
    const classesWithPhotos = classes.filter(
      (c: { image_urls?: string | null }) => c.image_urls && c.image_urls.split(",").filter(Boolean).length >= 3
    ).length;
    score += Math.min(20, (classesWithPhotos / classes.length) * 20);
  }

  // Schedule completeness (20 points)
  maxScore += 20;
  if (classes && classes.length > 0) {
    const { data: sessions } = await supabase
      .from("class_sessions")
      .select("class_id")
      .in(
        "class_id",
        classes.map((c: { id?: number | null }) => c.id).filter((id: number | null | undefined): id is number => typeof id === "number")
      );

    const classesWithSchedule = new Set(sessions?.map((s: { class_id?: number | null }) => s.class_id).filter((id: number | null | undefined): id is number => typeof id === "number") || []).size;
    score += Math.min(20, (classesWithSchedule / classes.length) * 20);
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Calculate SEO score (0-100)
 */
async function calculateSeoScore(providerId: number): Promise<number> {
  const supabase = await createClient();

  const { data: seoScore } = await supabase
    .from("provider_seo_scores")
    .select("score")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return seoScore?.score || 0;
}

/**
 * Calculate response rate score (0-100)
 */
async function calculateResponseRate(providerId: number): Promise<number> {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("booking_requests")
    .select("responded_at, created_at")
    .eq("provider_id", providerId);

  if (!requests || requests.length === 0) return 50; // Neutral score if no requests

  const responded = requests.filter((r: { responded_at?: string | null }) => r.responded_at).length;
  const responseRate = (responded / requests.length) * 100;

  // Calculate average response time
  const responseTimes = requests
    .filter((r: { responded_at?: string | null; created_at?: string | null }) => r.responded_at && r.created_at)
    .map((r: { responded_at: string; created_at: string }) => {
      const created = new Date(r.created_at!).getTime();
      const responded = new Date(r.responded_at!).getTime();
      return (responded - created) / (1000 * 60 * 60); // hours
    });

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum: number, rt: number) => sum + rt, 0) / responseTimes.length
      : Infinity;

  // Score based on response rate and speed
  let score = responseRate;
  if (avgResponseTime <= 2) score += 20; // Fast responder bonus
  else if (avgResponseTime <= 24) score += 10;
  else if (avgResponseTime > 48) score -= 20; // Penalty for slow responses

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate bookings score (0-100)
 */
async function calculateBookingsScore(providerId: number): Promise<number> {
  const supabase = await createClient();

  // Get bookings from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .eq("status", "confirmed");

  // Score based on booking volume (0-10 bookings = 0-50, 10-50 = 50-80, 50+ = 80-100)
  if (!count || count === 0) return 0;
  if (count < 10) return Math.round((count / 10) * 50);
  if (count < 50) return Math.round(50 + ((count - 10) / 40) * 30);
  return Math.round(80 + Math.min(20, ((count - 50) / 50) * 20));
}

/**
 * Calculate reviews score (0-100)
 */
async function calculateReviewsScore(providerId: number): Promise<number> {
  const supabase = await createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("rating, review_count")
    .eq("provider_id", providerId)
    .eq("is_active", true);

  if (!classes || classes.length === 0) return 0;

  const totalReviews = classes.reduce((sum: number, c: { review_count?: number | null }) => sum + (c.review_count || 0), 0);
  const avgRating =
    classes.reduce((sum: number, c: { rating?: string | number | null }) => sum + parseFloat(String(c.rating || "0")), 0) /
    classes.length;

  // Score based on review count and rating
  let score = 0;
  if (totalReviews >= 50) score += 50;
  else if (totalReviews >= 20) score += 35;
  else if (totalReviews >= 10) score += 20;
  else if (totalReviews >= 5) score += 10;

  if (avgRating >= 4.5) score += 50;
  else if (avgRating >= 4.0) score += 35;
  else if (avgRating >= 3.5) score += 20;
  else if (avgRating >= 3.0) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate engagement score (0-100)
 */
async function calculateEngagementScore(providerId: number): Promise<number> {
  const supabase = await createClient();

  // Get updates in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count class updates
  const { count: classUpdates } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gte("updated_at", thirtyDaysAgo.toISOString());

  // Count XP events (activity)
  const { count: xpEvents } = await supabase
    .from("provider_xp_events")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const totalActivity = (classUpdates || 0) + (xpEvents || 0);

  // Score based on activity (0-5 updates = 0-50, 5-15 = 50-80, 15+ = 80-100)
  if (totalActivity === 0) return 0;
  if (totalActivity < 5) return Math.round((totalActivity / 5) * 50);
  if (totalActivity < 15) return Math.round(50 + ((totalActivity - 5) / 10) * 30);
  return Math.round(80 + Math.min(20, ((totalActivity - 15) / 10) * 20));
}

/**
 * Generate recommendations based on breakdown
 */
function generateRecommendations(breakdown: GrowthScoreBreakdown): string[] {
  const recommendations: string[] = [];

  if (breakdown.listing_health < 70) {
    recommendations.push("Complete your provider profile with logo, bio, and photos");
  }

  if (breakdown.seo_score < 60) {
    recommendations.push("Improve your SEO score by optimizing class descriptions and keywords");
  }

  if (breakdown.response_rate < 80) {
    recommendations.push("Respond to booking requests faster to improve your response rate");
  }

  if (breakdown.bookings < 50) {
    recommendations.push("Enable online bookings and promote your classes to increase bookings");
  }

  if (breakdown.reviews < 50) {
    recommendations.push("Encourage parents to leave reviews after attending classes");
  }

  if (breakdown.engagement < 50) {
    recommendations.push("Keep your listings updated and active to improve engagement");
  }

  return recommendations;
}

/**
 * Calculate growth score for a provider
 */
export async function calculateGrowthScore(
  providerId: number
): Promise<GrowthScoreResult> {
  const supabase = await createClient();

  // Calculate all components
  const [
    listing_health,
    seo_score,
    response_rate,
    bookings,
    reviews,
    engagement,
  ] = await Promise.all([
    calculateListingHealth(providerId),
    calculateSeoScore(providerId),
    calculateResponseRate(providerId),
    calculateBookingsScore(providerId),
    calculateReviewsScore(providerId),
    calculateEngagementScore(providerId),
  ]);

  const breakdown: GrowthScoreBreakdown = {
    listing_health,
    seo_score,
    response_rate,
    bookings,
    reviews,
    engagement,
  };

  // Calculate weighted score
  const score = Math.round(
    listing_health * WEIGHTS.listing_health +
      seo_score * WEIGHTS.seo_score +
      response_rate * WEIGHTS.response_rate +
      bookings * WEIGHTS.bookings +
      reviews * WEIGHTS.reviews +
      engagement * WEIGHTS.engagement
  );

  // Get trend
  const { data: current } = await supabase
    .from("provider_growth_metrics")
    .select("trend")
    .eq("provider_id", providerId)
    .single();

  const trend = (current?.trend || []) as number[];
  const newTrend = [...trend, score].slice(-12); // Keep last 12 scores

  // Generate recommendations
  const recommendations = generateRecommendations(breakdown);

  // Save to database
  const { data: existing } = await supabase
    .from("provider_growth_metrics")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (existing) {
    await supabase
      .from("provider_growth_metrics")
      .update({
        score,
        breakdown,
        trend: newTrend,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);
  } else {
    await supabase.from("provider_growth_metrics").insert({
      provider_id: providerId,
      score,
      breakdown,
      trend: newTrend,
    });
  }

  return {
    score,
    breakdown,
    recommendations,
    trend: newTrend,
  };
}

