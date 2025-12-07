/**
 * Search Ranking v2 - PERFORMANCE OPTIMIZED
 * 
 * RankBrain-style ranking engine that prioritizes:
 * - Relevance (text, age, distance, time)
 * - Performance (popularity, conversion, engagement)
 * - Monetisation (featured, sponsored, premium tiers)
 * - Personalisation (user history, preferences)
 * 
 * PERF OPTIMIZATIONS:
 * - Pre-computed values cached
 * - Early exits for neutral scores
 * - Optimized string operations
 * - Reduced memory allocations
 * - Batch processing support
 */

import { addDays, differenceInDays } from "date-fns";

// ========================================
// TYPES
// ========================================

export type RankingContext = {
  query: string;
  userLocation?: { lat: number; lng: number };
  desiredAgeMonths?: number;
  desiredDay?: string; // e.g., "Monday", "Tuesday"
  desiredTimeRange?: { start: string; end: string }; // e.g., "09:00", "12:00"
  userId?: string | null;
  isLoggedIn: boolean;
  debug?: boolean;
  // PERF: Pre-computed query tokens
  _queryTokens?: string[];
  _queryLower?: string;
};

export type ClassWithSignals = {
  classId: number;
  providerId: number;
  category: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  latitude?: number | null;
  longitude?: number | null;
  town?: string | null;
  name: string;
  description?: string | null;
  popularityScore: number;
  profileQualityScore: number;
  monetisationTier: "free" | "featured" | "sponsored" | "enterprise";
  featuredUntil?: Date | null;
  sponsoredUntil?: Date | null;
  lastBookedDate?: Date | null;
  searchRankBoost: number;
  createdAt: Date;
  updatedAt: Date;
  rating?: number | null;
  reviewCount?: number | null;
  imageUrls?: string | null;
  // Metrics (30-day)
  views30d: number;
  clicks30d: number;
  bookings30d: number;
  saves30d: number;
  timeOnPage30d: number;
  ctr30d: number;
  conversionRate30d: number;
  avgDistanceScore30d: number;
  // Schedule info (if available)
  dayOfWeek?: string | null;
  time?: string | null;
  timeOfDay?: string | null;
  // PERF: Pre-computed lowercase values
  _nameLower?: string;
  _categoryLower?: string;
  _descriptionLower?: string;
};

export type RankedClass = {
  classId: number;
  score: number;
  reasons: string[]; // For debug
  // Include original fields for convenience
  [key: string]: unknown;
};

export type UserProfile = {
  preferredCategories?: string[];
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  recentClassIds?: number[];
  lastCity?: string;
  lastSearchQuery?: string;
};

// ========================================
// CONFIGURABLE WEIGHTS
// ========================================

export const RANKING_WEIGHTS = {
  text: 0.25, // Text relevance (title, description, category)
  age: 0.15, // Age match
  distance: 0.15, // Distance from user
  time: 0.10, // Day/time match
  popularity: 0.10, // Views, saves, bookings
  conversion: 0.10, // Click → booking rate
  recency: 0.05, // Newly added/updated classes
  profile: 0.05, // Profile quality (images, reviews, completeness)
  engagement: 0.03, // Time on page, scroll depth
  monetisation: 0.05, // Featured, sponsored boosts
  personalization: 0.07, // User history, preferences
} as const;

// PERF: Cache for computed values
const NEUTRAL_SCORE = 0.5;
const NOW_CACHE_TTL = 1000; // 1 second
let cachedNow: Date | null = null;
let cachedNowTimestamp = 0;

function getNow(): Date {
  const now = Date.now();
  if (!cachedNow || now - cachedNowTimestamp > NOW_CACHE_TTL) {
    cachedNow = new Date();
    cachedNowTimestamp = now;
  }
  return cachedNow;
}

// ========================================
// SIGNAL FUNCTIONS
// ========================================

/**
 * Compute text relevance score (0-1)
 * PERF: Pre-tokenize query, cache lowercase strings
 */
export function computeTextRelevance(
  candidate: ClassWithSignals,
  context: RankingContext
): number {
  // PERF: Early exit for no query
  if (!context.query || context.query.trim().length === 0) {
    return NEUTRAL_SCORE;
  }

  // PERF: Use cached query tokens
  const queryLower = context._queryLower || context.query.toLowerCase().trim();
  const queryWords = context._queryTokens || queryLower.split(/\s+/).filter((w) => w.length > 0);

  let score = 0;

  // PERF: Use cached lowercase values
  const titleLower = candidate._nameLower || candidate.name.toLowerCase();
  
  // Title match (weighted highest)
  if (titleLower.includes(queryLower)) {
    score += 0.4; // Exact phrase match
  } else {
    // PERF: Optimize word matching
    const titleWords = titleLower.split(/\s+/);
    let matchCount = 0;
    for (const qw of queryWords) {
      for (const tw of titleWords) {
        if (tw.includes(qw) || qw.includes(tw)) {
          matchCount++;
          break;
        }
      }
    }
    score += (matchCount / queryWords.length) * 0.3;
  }

  // Category match
  const categoryLower = candidate._categoryLower || candidate.category?.toLowerCase() || "";
  if (categoryLower.includes(queryLower)) {
    score += 0.2;
  } else {
    // PERF: Short-circuit if possible
    for (const qw of queryWords) {
      if (categoryLower.includes(qw)) {
        score += 0.2;
        break;
      }
    }
  }

  // Description match (only if needed)
  if (score < 0.7 && candidate.description) {
    const descriptionLower = candidate._descriptionLower || candidate.description.toLowerCase();
    if (descriptionLower.includes(queryLower)) {
      score += 0.1;
    } else {
      let matchCount = 0;
      for (const qw of queryWords) {
        if (descriptionLower.includes(qw)) matchCount++;
      }
      score += (matchCount / queryWords.length) * 0.1;
    }
  }

  // PERF: No need for Math.min if we cap during accumulation
  return score > 1 ? 1 : score;
}

/**
 * Compute age match score (0-1)
 * PERF: Simplified logic, early exits
 */
export function computeAgeMatch(
  candidate: ClassWithSignals,
  context: RankingContext
): number {
  // PERF: Early exit
  if (!context.desiredAgeMonths) return NEUTRAL_SCORE;

  const desiredAge = context.desiredAgeMonths;
  const classMin = candidate.ageMinMonths || 0;
  const classMax = candidate.ageMaxMonths || 999;

  // Perfect match
  if (desiredAge >= classMin && desiredAge <= classMax) {
    const rangeSize = classMax - classMin;
    if (rangeSize === 0) return 1.0;

    // Slight penalty for edge of range
    const distanceFromCenter = Math.abs(desiredAge - (classMin + classMax) / 2);
    const normalizedDistance = distanceFromCenter / (rangeSize / 2);
    return 1.0 - normalizedDistance * 0.2;
  }

  // Close but outside range
  const distanceBelow = classMin - desiredAge;
  const distanceAbove = desiredAge - classMax;
  
  if (distanceBelow > 0 && distanceBelow <= 6) {
    return 0.5 - (distanceBelow / 6) * 0.3;
  }
  if (distanceAbove > 0 && distanceAbove <= 6) {
    return 0.5 - (distanceAbove / 6) * 0.3;
  }

  return 0; // No match
}

/**
 * Compute distance score (0-1)
 * PERF: Optimized haversine, lookup table for common distances
 */
const DISTANCE_SCORE_CACHE = new Map<number, number>();

export function computeDistanceScore(
  candidate: ClassWithSignals,
  context: RankingContext
): number {
  // PERF: Early exit
  if (!context.userLocation || !candidate.latitude || !candidate.longitude) {
    return NEUTRAL_SCORE;
  }

  // Haversine distance in km
  const distanceKm = haversineDistance(
    context.userLocation.lat,
    context.userLocation.lng,
    candidate.latitude,
    candidate.longitude
  );

  // PERF: Cache common distances (rounded to 0.1km)
  const distanceKey = Math.round(distanceKm * 10);
  let score = DISTANCE_SCORE_CACHE.get(distanceKey);
  
  if (score !== undefined) return score;

  // Calculate score
  if (distanceKm <= 1) score = 1.0;
  else if (distanceKm <= 5) score = 0.8 + (5 - distanceKm) / 5 * 0.2;
  else if (distanceKm <= 10) score = 0.5 + (10 - distanceKm) / 5 * 0.3;
  else if (distanceKm <= 20) score = 0.2 + (20 - distanceKm) / 10 * 0.3;
  else if (distanceKm <= 50) score = 0.05 + (50 - distanceKm) / 30 * 0.15;
  else score = 0.05;

  // Cache result
  DISTANCE_SCORE_CACHE.set(distanceKey, score);
  return score;
}

/**
 * Compute time/day match score (0-1)
 * PERF: Early exits, cached time parsing
 */
export function computeTimeMatch(
  candidate: ClassWithSignals,
  context: RankingContext
): number {
  // PERF: Early exit if no time/day filtering
  if (!context.desiredDay && !context.desiredTimeRange) {
    return NEUTRAL_SCORE;
  }

  let score = NEUTRAL_SCORE;

  // Day match
  if (context.desiredDay && candidate.dayOfWeek) {
    const desiredDayLower = context.desiredDay.toLowerCase();
    const classDayLower = candidate.dayOfWeek.toLowerCase();
    
    if (desiredDayLower === classDayLower) {
      score += 0.3;
    } else if (classDayLower.startsWith(desiredDayLower) || desiredDayLower.startsWith(classDayLower)) {
      score += 0.15;
    }
  }

  // Time range match
  if (context.desiredTimeRange && candidate.time) {
    const classTime = parseTime(candidate.time);
    const desiredStart = parseTime(context.desiredTimeRange.start);
    const desiredEnd = parseTime(context.desiredTimeRange.end);

    if (classTime >= desiredStart && classTime <= desiredEnd) {
      score += 0.2;
    } else {
      const distance = Math.min(
        Math.abs(classTime - desiredStart),
        Math.abs(classTime - desiredEnd)
      );
      if (distance <= 60) {
        score += 0.1 * (1 - distance / 60);
      }
    }
  }

  return score > 1 ? 1 : score;
}

/**
 * Compute popularity score (0-1)
 * PERF: Simplified math, early exits
 */
export function computePopularityScore(candidate: ClassWithSignals): number {
  const views = candidate.views30d || 0;
  const saves = candidate.saves30d || 0;
  const bookings = candidate.bookings30d || 0;

  // PERF: Early exit for zero engagement
  if (views === 0 && saves === 0 && bookings === 0) {
    return candidate.popularityScore ? candidate.popularityScore * 0.3 : 0.3;
  }

  // Normalize with division (faster than Math.min)
  const viewScore = views > 1000 ? 1 : views / 1000;
  const saveScore = saves > 50 ? 1 : saves / 50;
  const bookingScore = bookings > 20 ? 1 : bookings / 20;

  // Weighted combination
  const combined = viewScore * 0.4 + saveScore * 0.3 + bookingScore * 0.3;
  const existingBoost = candidate.popularityScore || 0;
  
  const result = combined * 0.7 + existingBoost * 0.3;
  return result > 1 ? 1 : result;
}

/**
 * Compute conversion score (0-1)
 * PERF: Simplified
 */
export function computeConversionScore(candidate: ClassWithSignals): number {
  const ctr = candidate.ctr30d || 0;
  const conversionRate = candidate.conversionRate30d || 0;

  // PERF: Early exit
  if (ctr === 0 && conversionRate === 0) return 0;

  const ctrScore = ctr > 0.1 ? 1 : ctr / 0.1;
  const conversionScore = conversionRate > 0.2 ? 1 : conversionRate / 0.2;

  return ctrScore * 0.6 + conversionScore * 0.4;
}

/**
 * Compute recency score (0-1)
 * PERF: Use cached now, simplified logic
 */
export function computeRecencyScore(candidate: ClassWithSignals): number {
  const now = getNow();
  const createdDaysAgo = differenceInDays(now, candidate.createdAt);

  // PERF: Early exit for very new
  if (createdDaysAgo <= 7) {
    return 1.0 - (createdDaysAgo / 7) * 0.3;
  }

  // Recently updated
  const updatedDaysAgo = differenceInDays(now, candidate.updatedAt);
  if (updatedDaysAgo <= 30) {
    return 0.7 - ((updatedDaysAgo - 7) / 23) * 0.4;
  }

  // Recently booked
  if (candidate.lastBookedDate) {
    const bookedDaysAgo = differenceInDays(now, candidate.lastBookedDate);
    if (bookedDaysAgo <= 7) {
      return 0.5 + (1 - bookedDaysAgo / 7) * 0.3;
    }
  }

  return 0.3; // Default
}

/**
 * Compute profile quality score (0-1)
 * PERF: Early exits, cached calculations
 */
export function computeProfileQualityScore(candidate: ClassWithSignals): number {
  let score = 0;

  // Images
  if (candidate.imageUrls && candidate.imageUrls.length > 0) {
    // PERF: Count commas instead of split
    const commaCount = (candidate.imageUrls.match(/,/g) || []).length;
    const imageCount = commaCount + 1;
    score += imageCount >= 5 ? 0.3 : (imageCount / 5) * 0.3;
  }

  // Description
  const descLength = (candidate.description || "").length;
  if (descLength >= 500) score += 0.2;
  else if (descLength >= 200) score += 0.15;
  else if (descLength >= 50) score += 0.1;

  // Reviews
  const reviewCount = candidate.reviewCount || 0;
  if (reviewCount > 0) {
    const rating = candidate.rating || 0;
    const reviewScore = reviewCount >= 20 ? 0.2 : (reviewCount / 20) * 0.2;
    const ratingScore = (rating / 5) * 0.1;
    score += reviewScore + ratingScore;
  }

  // Existing profile score
  score += (candidate.profileQualityScore || 0) * 0.2;

  return score > 1 ? 1 : score;
}

/**
 * Compute engagement score (0-1)
 * PERF: Simplified, early exits
 */
export function computeEngagementScore(candidate: ClassWithSignals): number {
  const views = candidate.views30d || 0;
  
  // PERF: Early exit
  if (views === 0) return 0;

  const timeOnPage = candidate.timeOnPage30d || 0;
  const avgTimeOnPage = timeOnPage / views;

  let score = 0;
  if (avgTimeOnPage >= 60) score = 1.0;
  else if (avgTimeOnPage >= 30) score = 0.7;
  else if (avgTimeOnPage >= 10) score = 0.4;
  else if (avgTimeOnPage > 0) score = 0.2;

  // View count boost
  if (views >= 500) score += 0.2;
  else if (views >= 100) score += 0.1;

  return score > 1 ? 1 : score;
}

/**
 * Compute monetisation boost (0-0.25)
 * PERF: Early exits, cached now
 */
export function computeMonetisationBoost(
  candidate: ClassWithSignals,
  textRelevance: number
): number {
  const now = getNow();
  let boost = 0;

  // Sponsored boost
  if (candidate.sponsoredUntil && candidate.sponsoredUntil > now) {
    boost += textRelevance >= 0.2 ? 0.15 : 0.05;
  }

  // Featured boost
  if (candidate.featuredUntil && candidate.featuredUntil > now) {
    boost += textRelevance >= 0.2 ? 0.08 : 0.02;
  }

  // Tier boost
  if (candidate.monetisationTier === "enterprise") {
    boost += 0.02;
  } else if (candidate.monetisationTier === "sponsored") {
    boost += 0.01;
  } else if (candidate.monetisationTier === "featured") {
    boost += 0.005;
  }

  // Search rank boost
  if (candidate.searchRankBoost > 0) {
    boost += candidate.searchRankBoost > 0.05 ? 0.05 : candidate.searchRankBoost;
  }

  return boost > 0.25 ? 0.25 : boost;
}

/**
 * Compute personalization boost (0-0.3)
 * PERF: Early exits
 */
export function computePersonalizationBoost(
  candidate: ClassWithSignals,
  context: RankingContext,
  userProfile?: UserProfile
): number {
  // PERF: Early exit
  if (!context.isLoggedIn || !userProfile) return 0;

  let boost = 0;

  // Category preference
  if (userProfile.preferredCategories?.includes(candidate.category)) {
    boost += 0.1;
  }

  // Age preference
  if (userProfile.preferredAgeMin !== undefined && userProfile.preferredAgeMax !== undefined) {
    const userAgeMin = userProfile.preferredAgeMin;
    const userAgeMax = userProfile.preferredAgeMax;
    const classMin = candidate.ageMinMonths || 0;
    const classMax = candidate.ageMaxMonths || 999;

    if (userAgeMin <= classMax && userAgeMax >= classMin) {
      boost += 0.1;
    }
  }

  // Recent class preference
  if (userProfile.recentClassIds?.includes(candidate.classId)) {
    boost += 0.15;
  }

  // Location preference
  if (userProfile.lastCity && candidate.town) {
    if (userProfile.lastCity.toLowerCase() === candidate.town.toLowerCase()) {
      boost += 0.05;
    }
  }

  return boost > 0.3 ? 0.3 : boost;
}

// ========================================
// MAIN RANKING FUNCTION
// ========================================

/**
 * Rank classes using Ranking v2 algorithm
 * PERF: Pre-compute values, batch processing, early exits
 */
export function rankClassesV2(
  candidates: ClassWithSignals[],
  context: RankingContext,
  userProfile?: UserProfile
): RankedClass[] {
  // PERF: Early exit for empty candidates
  if (candidates.length === 0) return [];

  // PERF: Pre-compute context values
  if (context.query && !context._queryLower) {
    context._queryLower = context.query.toLowerCase().trim();
    context._queryTokens = context._queryLower.split(/\s+/).filter((w) => w.length > 0);
  }

  // PERF: Pre-compute candidate lowercase values
  for (const candidate of candidates) {
    if (!candidate._nameLower) {
      candidate._nameLower = candidate.name.toLowerCase();
    }
    if (!candidate._categoryLower && candidate.category) {
      candidate._categoryLower = candidate.category.toLowerCase();
    }
    if (!candidate._descriptionLower && candidate.description) {
      candidate._descriptionLower = candidate.description.toLowerCase();
    }
  }

  const ranked = candidates.map((candidate) => {
    // Compute all signals
    const textRelevance = computeTextRelevance(candidate, context);
    const ageMatch = computeAgeMatch(candidate, context);
    const distanceScore = computeDistanceScore(candidate, context);
    const timeMatch = computeTimeMatch(candidate, context);
    const popularityScore = computePopularityScore(candidate);
    const conversionScore = computeConversionScore(candidate);
    const recencyScore = computeRecencyScore(candidate);
    const profileScore = computeProfileQualityScore(candidate);
    const engagementScore = computeEngagementScore(candidate);
    const monetisationBoost = computeMonetisationBoost(candidate, textRelevance);
    const personalizationBoost = computePersonalizationBoost(candidate, context, userProfile);

    // Weighted sum
    const totalScore =
      RANKING_WEIGHTS.text * textRelevance +
      RANKING_WEIGHTS.age * ageMatch +
      RANKING_WEIGHTS.distance * distanceScore +
      RANKING_WEIGHTS.time * timeMatch +
      RANKING_WEIGHTS.popularity * popularityScore +
      RANKING_WEIGHTS.conversion * conversionScore +
      RANKING_WEIGHTS.recency * recencyScore +
      RANKING_WEIGHTS.profile * profileScore +
      RANKING_WEIGHTS.engagement * engagementScore +
      RANKING_WEIGHTS.monetisation * monetisationBoost +
      RANKING_WEIGHTS.personalization * personalizationBoost;

    // Build reasons for debug (only if needed)
    const reasons: string[] = context.debug ? [
      `Text: ${textRelevance.toFixed(2)} (${(RANKING_WEIGHTS.text * textRelevance).toFixed(3)})`,
      `Age: ${ageMatch.toFixed(2)} (${(RANKING_WEIGHTS.age * ageMatch).toFixed(3)})`,
      `Distance: ${distanceScore.toFixed(2)} (${(RANKING_WEIGHTS.distance * distanceScore).toFixed(3)})`,
      `Time: ${timeMatch.toFixed(2)} (${(RANKING_WEIGHTS.time * timeMatch).toFixed(3)})`,
      `Popularity: ${popularityScore.toFixed(2)} (${(RANKING_WEIGHTS.popularity * popularityScore).toFixed(3)})`,
      `Conversion: ${conversionScore.toFixed(2)} (${(RANKING_WEIGHTS.conversion * conversionScore).toFixed(3)})`,
      `Recency: ${recencyScore.toFixed(2)} (${(RANKING_WEIGHTS.recency * recencyScore).toFixed(3)})`,
      `Profile: ${profileScore.toFixed(2)} (${(RANKING_WEIGHTS.profile * profileScore).toFixed(3)})`,
      `Engagement: ${engagementScore.toFixed(2)} (${(RANKING_WEIGHTS.engagement * engagementScore).toFixed(3)})`,
      `Monetisation: ${monetisationBoost.toFixed(2)} (${(RANKING_WEIGHTS.monetisation * monetisationBoost).toFixed(3)})`,
      `Personalization: ${personalizationBoost.toFixed(2)} (${(RANKING_WEIGHTS.personalization * personalizationBoost).toFixed(3)})`,
    ] : [];

    return {
      classId: candidate.classId,
      score: totalScore,
      reasons,
      ...candidate,
    };
  });

  // PERF: Sort in-place
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Haversine distance in km
 * PERF: Optimized with pre-computed constants
 */
const R = 6371; // Earth radius in km
const DEG_TO_RAD = Math.PI / 180;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  
  const a =
    sinDLat * sinDLat +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      sinDLon *
      sinDLon;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 * PERF: Cache parsed times
 */
const TIME_PARSE_CACHE = new Map<string, number>();

function parseTime(timeStr: string): number {
  let minutes = TIME_PARSE_CACHE.get(timeStr);
  if (minutes !== undefined) return minutes;

  const parts = timeStr.split(":");
  minutes = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  
  TIME_PARSE_CACHE.set(timeStr, minutes);
  return minutes;
}

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export function clearRankingCaches(): void {
  DISTANCE_SCORE_CACHE.clear();
  TIME_PARSE_CACHE.clear();
  cachedNow = null;
  cachedNowTimestamp = 0;
}
