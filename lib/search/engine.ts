/**
 * Unified Search Engine
 * 
 * Shared utilities for search functionality across API, UI, and SEO pages
 */

import { normalizeDistanceScore, calculateRankingScore, getRankingWeights, type RankingInput } from "./ranking";

export type SearchFilters = {
  q?: string; // keyword
  age?: string; // 'baby' | 'toddler' | 'preschool'
  category?: string;
  day?: string; // mon|tue|wed|thu|fri|sat|sun
  timeOfDay?: "morning" | "afternoon" | "evening";
  lat?: number;
  lng?: number;
  radiusKm?: number; // default 5km
  town?: string;
  page?: number;
  limit?: number;
};

export type AgeRange = {
  minMonths: number;
  maxMonths: number;
};

/**
 * Map age filter to months range
 */
export function mapAgeToMonths(age?: string): AgeRange | null {
  if (!age) return null;

  switch (age.toLowerCase()) {
    case "baby":
      return { minMonths: 0, maxMonths: 12 };
    case "toddler":
      return { minMonths: 12, maxMonths: 36 };
    case "preschool":
      return { minMonths: 36, maxMonths: 60 };
    default:
      return null;
  }
}

/**
 * Normalize keyword for search
 */
export function normalizeKeyword(keyword?: string): string {
  if (!keyword) return "";
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ") // Remove special chars
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Check if time falls within time of day range
 */
export function matchesTimeOfDay(time: string | null, timeOfDay?: "morning" | "afternoon" | "evening"): boolean {
  if (!timeOfDay || !time) return true;

  // Extract hour from time string (handles formats like "10:00", "10:00 AM", etc.)
  const hourMatch = time.match(/(\d{1,2})/);
  if (!hourMatch) return true;

  const hour = parseInt(hourMatch[1], 10);
  const isPM = time.toLowerCase().includes("pm") || time.toLowerCase().includes("p.m");

  // Convert to 24-hour format
  let hour24 = hour;
  if (isPM && hour !== 12) hour24 = hour + 12;
  if (!isPM && hour === 12) hour24 = 0;

  switch (timeOfDay) {
    case "morning":
      return hour24 >= 6 && hour24 < 12;
    case "afternoon":
      return hour24 >= 12 && hour24 < 16;
    case "evening":
      return hour24 >= 16 && hour24 < 20;
    default:
      return true;
  }
}

/**
 * Normalize day name to standard format
 */
export function normalizeDay(day?: string): string | null {
  if (!day) return null;

  const dayLower = day.toLowerCase().trim();
  const dayMap: Record<string, string> = {
    monday: "monday",
    mon: "monday",
    tuesday: "tuesday",
    tue: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
    thursday: "thursday",
    thu: "thursday",
    friday: "friday",
    fri: "friday",
    saturday: "saturday",
    sat: "saturday",
    sunday: "sunday",
    sun: "sunday",
  };

  return dayMap[dayLower] || null;
}

/**
 * Haversine distance calculation (in kilometers)
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate search score for a class
 * Uses the unified ranking algorithm
 */
export function calculateSearchScore(params: {
  classItem: {
    id: number;
    name: string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    age_group_min?: number | null;
    age_group_max?: number | null;
    town?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    rating?: number | string | null;
    review_count?: number | null;
    popularity?: number | null;
    price?: string | null;
    is_featured?: boolean;
    featured_priority?: number | null;
    featured_status?: string | null;
    featured_starts_at?: string | null;
    featured_ends_at?: string | null;
  };
  searchQuery: string;
  searchLat?: number;
  searchLng?: number;
  providerCompleteness?: number; // 0-1 score from provider metrics/onboarding
  sessionRecency?: number; // Days since last session (lower = better)
}): number {
  const { classItem, searchQuery, searchLat, searchLng, providerCompleteness = 0.5, sessionRecency = 30 } = params;

  // Build ranking input
  const rankingInput: RankingInput = {
    classItem: {
      id: classItem.id,
      title: classItem.title,
      name: classItem.name,
      description: classItem.description,
      category: classItem.category,
      main_category: classItem.category,
      town: classItem.town,
      latitude: classItem.latitude,
      longitude: classItem.longitude,
      rating: classItem.rating,
      review_count: classItem.review_count || null,
      popularity: classItem.popularity || null,
      price: classItem.price,
      is_featured: classItem.is_featured,
      featured_priority: classItem.featured_priority,
      featured_status: classItem.featured_status,
      featured_starts_at: classItem.featured_starts_at,
      featured_ends_at: classItem.featured_ends_at,
    },
    searchQuery,
    searchLatitude: searchLat,
    searchLongitude: searchLng,
  };

  const weights = getRankingWeights();
  const rankingResult = calculateRankingScore(rankingInput, weights);

  // Apply additional factors
  // 0.50 * keyword relevance (already in ranking)
  // 0.20 * provider completeness
  // 0.20 * recency of sessions
  // 0.10 * proximity (already in ranking as distance)

  const providerScore = providerCompleteness * 0.2;
  const recencyScore = Math.max(0, 1 - sessionRecency / 30) * 0.2; // Decay over 30 days

  // Base score from ranking (already includes keyword relevance and distance)
  const baseScore = rankingResult.totalScore * 0.5;

  return baseScore + providerScore + recencyScore;
}

/**
 * Check if class age range overlaps with filter
 */
export function ageRangeOverlaps(
  classMinMonths: number | null,
  classMaxMonths: number | null,
  filterMinMonths: number,
  filterMaxMonths: number
): boolean {
  if (classMinMonths === null || classMaxMonths === null) return true; // No age filter = show all
  return classMinMonths <= filterMaxMonths && classMaxMonths >= filterMinMonths;
}





