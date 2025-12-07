/**
 * Recommendation Engine
 * Builds personalized class recommendations for users based on their family profiles
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { hasSupabaseServerEnv, isPersonalizationEnabled } from "@/lib/env";
import { getRecsWeights, getRecsMaxRadiusKm, type RecommendationWeights } from "@/lib/env";

export interface RecommendationResult {
  classId: number;
  score: number;
  rationale: string;
}

/**
 * Build recommendations for a user
 */
export async function buildRecommendationsForUser(userId: string): Promise<RecommendationResult[]> {
  const startTime = Date.now();
  const shortId = userId ? `${userId.slice(0, 8)}…` : "unknown";
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) {
    console.log("[RECO] engine skip", { reason: "feature-disabled", user: shortId });
    return [];
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    console.log("[RECO] engine skip", { reason: "missing-supabase", user: shortId });
    return [];
  }

  try {
    // Load user profile data
    const { data: familyProfile } = await supabase
      .from("family_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!familyProfile) {
      console.log("[RECO] engine skip", { reason: "no-profile", user: shortId });
      return []; // No profile, return empty
    }

    const { data: children } = await supabase
      .from("child_profiles")
      .select("age_months")
      .eq("family_id", familyProfile.id);

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("default_radius_km, preferred_categories")
      .eq("user_id", userId)
      .single();

    // Determine target age ranges from children
    const targetAges = children?.map((c: { age_months?: number | null }) => c.age_months).filter((age: number | null | undefined): age is number => typeof age === "number") || [];
    const radiusKm = preferences?.default_radius_km || getRecsMaxRadiusKm();
    const homeLat = Number(familyProfile.home_lat);
    const homeLng = Number(familyProfile.home_lng);
    const hasLocation = !isNaN(homeLat) && !isNaN(homeLng) && homeLat !== 0 && homeLng !== 0;

    // Build optimized Supabase query
    let query = supabase
      .from("classes")
      .select("id, name, category, age_group_min, age_group_max, latitude, longitude, town, popularity, provider_id")
      .eq("is_active", true);

    // 1. SQL Location Filtering (Bounding Box)
    if (hasLocation) {
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(homeLat, homeLng, radiusKm);
      query = query
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLng)
        .lte("longitude", maxLng);
    }

    // 2. SQL Age Filtering (Rough superset)
    if (targetAges.length > 0) {
      const minChildAgeYears = Math.min(...targetAges) / 12;
      const maxChildAgeYears = Math.max(...targetAges) / 12;
      // Select classes that overlap with the range of all children
      query = query
        .lte("age_group_min", maxChildAgeYears)
        .gte("age_group_max", minChildAgeYears);
    }

    // 3. SQL Category Filtering
    const preferredCategories = preferences?.preferred_categories || [];
    if (preferredCategories.length > 0) {
      query = query.in("category", preferredCategories);
    }

    // 4. SQL Ordering & Limiting
    // Order by popularity to get the best candidates early, then refine with scoring
    const { data: candidates } = await query
      .order("popularity", { ascending: false })
      .limit(100);

    if (!candidates || candidates.length === 0) {
      console.log("[RECO] engine skip", { reason: "no-candidates", user: shortId });
      return [];
    }

    // 5. Compute Scores
    const weights = getRecsWeights();
    const recs = await computeRecommendationScore(supabase, candidates, {
      userId,
      targetAges,
      homeLat: hasLocation ? homeLat : 0,
      homeLng: hasLocation ? homeLng : 0,
      radiusKm: hasLocation ? radiusKm : 1000, // Large radius if no location
      weights: hasLocation ? weights : { ...weights, w_distance: 0 },
      hasLocation
    });

    // 6. Sort and Top N
    const topN = recs
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    // 7. Store in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day TTL

    // Batch delete & insert
    await Promise.all([
      supabase.from("recommendations").delete().eq("user_id", userId),
      topN.length > 0 ? supabase.from("recommendations").insert(topN.map((rec) => ({
        user_id: userId,
        class_id: rec.classId,
        score: rec.score,
        rationale: rec.rationale,
        expires_at: expiresAt.toISOString(),
      }))) : Promise.resolve()
    ]);

    console.log("[RECO] engine success", {
      user: shortId,
      durationMs: Date.now() - startTime,
      candidateCount: candidates.length,
      recommendationCount: topN.length,
    });
    return topN;
  } catch (error) {
    console.error("[buildRecommendationsForUser] Error:", error);
    console.error("[RECO] engine error", {
      user: shortId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

/**
 * Unified scoring function
 */
type SupabaseClient = ReturnType<typeof getSupabaseServer>;
type CandidateRow = {
  id?: number | null;
  provider_id?: number | null;
  popularity?: number | null;
  age_group_min?: number | null;
  age_group_max?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  [key: string]: unknown;
};

async function computeRecommendationScore(
  supabase: SupabaseClient,
  candidates: CandidateRow[],
  params: {
    userId: string;
    targetAges: number[];
    homeLat: number;
    homeLng: number;
    radiusKm: number;
    weights: RecommendationWeights;
    hasLocation: boolean;
  }
): Promise<RecommendationResult[]> {
  // Bulk fetch dependencies
  const providerIds = [...new Set(candidates.map((c) => c.provider_id).filter(Boolean))];
  const { data: qualityCache } = providerIds.length > 0
    ? await supabase.from("provider_quality_cache").select("provider_id, quality_score").in("provider_id", providerIds)
    : { data: [] };

  type QualityRow = { provider_id?: number | null; quality_score?: number | null };
  const qualityMap = new Map(
    (qualityCache || []).map((q: QualityRow) => [q.provider_id, q.quality_score])
  );

  const { data: bookings } = await supabase
    .from("simple_bookings")
    .select("classes(id)")
    .eq("email", (await getUserEmail(supabase, params.userId)) || "");

  type BookingRow = { classes?: { id?: number | null } | null } | null;
  const viewedClassIds = new Set((bookings as BookingRow[] | null)?.map((b: BookingRow) => b?.classes?.id).filter((id): id is number => typeof id === "number") || []);

  // Pre-calculate stats
  const popularities = candidates.map((c) => c.popularity || 0);
  const maxPop = Math.max(...popularities, 1);
  const minPop = Math.min(...popularities, 0);

  return candidates.map((cls) => {
    // Distance Calc (only for remaining candidates)
    let distance = 0;
    let distanceScore = 0;

    if (params.hasLocation) {
      distance = calculateDistance(
        params.homeLat,
        params.homeLng,
        Number(cls.latitude || 0),
        Number(cls.longitude || 0)
      );
      // Hard filter: if slightly outside bounding box radius (due to square vs circle)
      if (distance > params.radiusKm) return null;
      distanceScore = Math.max(0, 1 - distance / params.radiusKm);
    }

    // Age Fit
    const clsMin = typeof cls.age_group_min === "number" ? cls.age_group_min : 0;
    const clsMax = typeof cls.age_group_max === "number" ? cls.age_group_max : 100;
    const ageFit = params.targetAges.length === 0 || params.targetAges.some(ageMonths => {
      const ageYears = ageMonths / 12;
      return ageYears >= clsMin && ageYears <= clsMax;
    });
    const ageFitScore = ageFit ? 1 : 0.3;

    // Popularity
    const popularityScore = maxPop > minPop ? ((cls.popularity || 0) - minPop) / (maxPop - minPop) : 0.5;

    // Quality
    const qualityVal = qualityMap.get(cls.provider_id) ?? 0;
    const qualityScore = Math.min(1, (qualityVal as number) / 5);

    // Novelty
    const classId = typeof cls.id === "number" ? cls.id : null;
    const noveltyScore = classId !== null && viewedClassIds.has(classId) ? 0.2 : 1;

    // Final Score
    const totalScore =
      params.weights.w_age_fit * ageFitScore +
      params.weights.w_distance * distanceScore +
      params.weights.w_pop * popularityScore +
      params.weights.w_quality * qualityScore +
      params.weights.w_novelty * noveltyScore;

    // Rationale
    const rationaleParts = [];
    if (ageFit) rationaleParts.push("age-appropriate");
    if (distanceScore > 0.7) rationaleParts.push("nearby");
    if (popularityScore > 0.7) rationaleParts.push("popular");
    if (qualityScore > 0.7) rationaleParts.push("top rated");
    if (noveltyScore > 0.5 && params.weights.w_novelty > 0) rationaleParts.push("new to you");

    return {
      classId: cls.id,
      score: totalScore,
      rationale: rationaleParts.join(", ") || "recommended",
    };
  }).filter((res): res is RecommendationResult => res !== null);
}

/**
 * Helper: Calculate Bounding Box for SQL filtering
 */
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111; // 1 deg lat ~ 111km
  const lngDelta = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

/**
 * Helper: Haversine Distance
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    return user?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Refresh provider quality cache
 */
export async function refreshProviderQualityCache(): Promise<void> {
  if (!hasSupabaseServerEnv() || !isPersonalizationEnabled()) return;

  const supabase = getSupabaseServer();
  if (!supabase) return;

  try {
    const { data: providers } = await supabase.from("providers").select("id");
    if (!providers) return;

    for (const provider of providers) {
      const { data: reviews } = await supabase
        .from("provider_reviews")
        .select("rating")
        .eq("provider_id", provider.id)
        .eq("status", "approved");

      const reviewsCount = reviews?.length || 0;
      const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum: number, r: { rating?: number | null }) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

      const { data: bookings } = await supabase
        .from("simple_bookings")
        .select("status")
        .eq("provider_id", provider.id);

      const totalBookings = bookings?.length || 0;
      const confirmedBookings = bookings?.filter((b: { status?: string }) => b.status === "confirmed").length || 0;
      const completionRate = totalBookings > 0 ? confirmedBookings / totalBookings : 0;

      const qualityScore = Math.min(5, (avgRating * 0.6 + completionRate * 5 * 0.4));

      await supabase.from("provider_quality_cache").upsert({
        provider_id: provider.id,
        quality_score: qualityScore,
        reviews_count: reviewsCount,
        completion_rate: completionRate,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[refreshProviderQualityCache] Error:", error);
  }
}
