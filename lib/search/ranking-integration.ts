/**
 * Ranking Integration Helpers
 * 
 * Functions to integrate ranking v2 into search API
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Batch processing of ranking signals
 * - Reduced parsing overhead (parse once, reuse)
 * - Smarter limit calculations
 * - Minimized repeated computations
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { rankClassesV2, type RankingContext, type ClassWithSignals } from "./ranking-v2";
import { getUserProfile } from "./user-preferences";

/**
 * Choose ranking strategy (v1 or v2) based on request
 */
export function chooseRankingStrategy(abParam?: string | null): "v1" | "v2" {
  if (abParam === "v1") return "v1";
  if (abParam === "v2") return "v2";
  return "v2"; // Default to v2
}

/**
 * Parse age string to months (cached for repeated calls)
 */
const ageCache = new Map<string, number | null>();

function parseAgeToMonths(age: string): number | null {
  if (ageCache.has(age)) {
    return ageCache.get(age)!;
  }

  const ageLower = age.toLowerCase();
  let result: number | null = null;

  if (ageLower.includes("baby") || ageLower.includes("0-12")) {
    result = 6; // 6 months (middle of range)
  } else if (ageLower.includes("toddler") || ageLower.includes("1-3")) {
    result = 24; // 24 months
  } else if (ageLower.includes("preschool") || ageLower.includes("3-5")) {
    result = 48; // 48 months
  } else {
    // Try to parse as number
    const match = age.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1], 10);
      result = years * 12;
    }
  }

  ageCache.set(age, result);
  return result;
}

type RankingSignalRow = {
  class_id: number;
  provider_id: number;
  category: string | null;
  age_min_months: number | null;
  age_max_months: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
  town: string | null;
  name: string | null;
  description: string | null;
  popularity_score: number | null;
  profile_quality_score: number | null;
  monetisation_tier: string | null;
  featured_until: string | null;
  sponsored_until: string | null;
  last_booked_date: string | null;
  search_rank_boost: number | null;
  created_at: string;
  updated_at: string;
  rating: number | string | null;
  review_count: number | null;
  image_urls: unknown;
  views_30d: number | null;
  clicks_30d: number | null;
  bookings_30d: number | null;
  saves_30d: number | null;
  time_on_page_30d: number | null;
  ctr_30d: number | null;
  conversion_rate_30d: number | null;
  avg_distance_score_30d: number | null;
};

/**
 * Fetch candidates with ranking signals from database
 * 
 * OPTIMIZATIONS:
 * - Push filters to SQL layer
 * - Dynamic limit based on filter count
 * - Batch parse coordinates
 * - Minimal object allocation
 */
export async function fetchCandidatesWithSignals(params: {
  query?: string;
  category?: string;
  age?: string;
  town?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}): Promise<ClassWithSignals[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  // Dynamic limit: if many filters, we need fewer results
  const filterCount = [params.query, params.category, params.age, params.town].filter(Boolean).length;
  const effectiveLimit = params.limit || (filterCount >= 2 ? 75 : 100);

  let query = supabase
    .from("v_class_ranking_signals")
    .select("*")
    .limit(effectiveLimit);

  // Push filters to SQL
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.town) {
    query = query.eq("town", params.town);
  }
  if (params.age) {
    const ageMonths = parseAgeToMonths(params.age);
    if (ageMonths) {
      query = query.lte("age_min_months", ageMonths).gte("age_max_months", ageMonths);
    }
  }

  // Distance filter using PostGIS (if location provided)
  // Note: Would use ST_DWithin in production with PostGIS enabled
  // For now, fetch and filter in-app (but still better than before)
  if (params.lat && params.lng) {
    const radius = params.radiusKm || 20;
    // TODO: Use PostGIS: .not("location", "is", null).filter(`ST_DWithin(location, ST_MakePoint(${params.lng}, ${params.lat})::geography, ${radius * 1000})`)
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchCandidatesWithSignals] Error:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Batch process rows - minimize parsing and allocations
  return (data as RankingSignalRow[]).map((row) => {
    // Parse coordinates once
    const lat = row.latitude ? (typeof row.latitude === "string" ? parseFloat(row.latitude) : row.latitude) : null;
    const lng = row.longitude ? (typeof row.longitude === "string" ? parseFloat(row.longitude) : row.longitude) : null;
    const rating = row.rating ? (typeof row.rating === "string" ? parseFloat(row.rating) : row.rating) : null;

    return {
      classId: row.class_id,
      providerId: row.provider_id,
      category: row.category || "",
      ageMinMonths: row.age_min_months || 0,
      ageMaxMonths: row.age_max_months || 999,
      latitude: lat,
      longitude: lng,
      town: row.town || null,
      name: row.name || "",
      description: row.description || null,
      popularityScore: row.popularity_score || 0,
      profileQualityScore: row.profile_quality_score || 0,
      monetisationTier: (row.monetisation_tier || "free") as "free" | "featured" | "sponsored" | "enterprise",
      featuredUntil: row.featured_until ? new Date(row.featured_until) : null,
      sponsoredUntil: row.sponsored_until ? new Date(row.sponsored_until) : null,
      lastBookedDate: row.last_booked_date ? new Date(row.last_booked_date) : null,
      searchRankBoost: row.search_rank_boost || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      rating,
      reviewCount: row.review_count || null,
      imageUrls: row.image_urls || null,
      views30d: row.views_30d || 0,
      clicks30d: row.clicks_30d || 0,
      bookings30d: row.bookings_30d || 0,
      saves30d: row.saves_30d || 0,
      timeOnPage30d: row.time_on_page_30d || 0,
      ctr30d: row.ctr_30d || 0,
      conversionRate30d: row.conversion_rate_30d || 0,
      avgDistanceScore30d: row.avg_distance_score_30d || 0,
      // Schedule info would need to be joined separately
      dayOfWeek: null,
      time: null,
      timeOfDay: null,
    };
  });
}

/**
 * Build ranking context from search params
 * 
 * OPTIMIZATIONS:
 * - Pre-compute time ranges (static map)
 * - Avoid repeated parsing
 */
const TIME_RANGE_MAP: Record<string, { start: string; end: string }> = {
  morning: { start: "06:00", end: "12:00" },
  afternoon: { start: "12:00", end: "16:00" },
  evening: { start: "16:00", end: "20:00" },
};

export async function buildRankingContext(params: {
  query?: string;
  age?: string;
  day?: string;
  timeOfDay?: string;
  lat?: number;
  lng?: number;
  userId?: string | null;
  debug?: boolean;
}): Promise<RankingContext> {
  const isLoggedIn = !!params.userId;

  // Parse time range (use pre-computed map)
  let desiredTimeRange: { start: string; end: string } | undefined;
  if (params.timeOfDay) {
    desiredTimeRange = TIME_RANGE_MAP[params.timeOfDay.toLowerCase()];
  }

  // Parse age to months (cached)
  let desiredAgeMonths: number | undefined;
  if (params.age) {
    const ageMonths = parseAgeToMonths(params.age);
    if (ageMonths) desiredAgeMonths = ageMonths;
  }

  return {
    query: params.query || "",
    userLocation: params.lat && params.lng ? { lat: params.lat, lng: params.lng } : undefined,
    desiredAgeMonths,
    desiredDay: params.day,
    desiredTimeRange,
    userId: params.userId || null,
    isLoggedIn,
    debug: params.debug || false,
  };
}

