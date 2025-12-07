/**
 * Server-Side Search Utility
 * 
 * For use in SEO pages and server-rendered components
 * Uses the same search engine logic as the API but runs server-side
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Push filters to database layer (age, time of day)
 * - Use PostGIS for distance calculations when available
 * - Reduced over-fetching (smart limits)
 * - Minimal in-memory filtering
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import type { SearchFilters } from "./engine";
import {
  mapAgeToMonths,
  normalizeKeyword,
  normalizeDay,
  matchesTimeOfDay,
  calculateSearchScore,
  ageRangeOverlaps,
} from "./engine";

export type ServerSearchResult = {
  id: number;
  name: string;
  providerName: string;
  category: string;
  town: string;
  score: number;
};

type ClassRow = {
  id: number;
  name: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  age_group_min: number | null;
  age_group_max: number | null;
  town: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  rating: number | string | null;
  review_count: number | null;
  popularity: number | null;
  price: string | null;
  is_featured: boolean;
  featured_priority: number | null;
  featured_status: string | null;
  featured_starts_at: string | null;
  featured_ends_at: string | null;
  day_of_week: string | null;
  time: string | null;
  provider_id: number;
  providers: { name: string } | Array<{ name: string }> | null;
  provider_onboarding: { progress: number; is_complete: boolean } | Array<{ progress: number; is_complete: boolean }> | null;
};

/**
 * Run search server-side (for SEO pages)
 * 
 * OPTIMIZATIONS:
 * - Smarter limit based on filter count
 * - Push age filtering to SQL where possible
 * - Reduced field selection for faster I/O
 * - Early exit on empty results
 */
export async function runServerSearch(filters: SearchFilters): Promise<ServerSearchResult[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const ageRange = mapAgeToMonths(filters.age);
  const normalizedKeyword = normalizeKeyword(filters.q);
  const normalizedDay = normalizeDay(filters.day);

  // Dynamic limit: fewer results needed if many filters applied
  const filterCount = [filters.q, filters.age, filters.category, filters.town, filters.day, filters.timeOfDay].filter(Boolean).length;
  const fetchLimit = filterCount >= 3 ? 50 : filterCount >= 2 ? 75 : 100;

  // Build query - only select fields we need
  let query = supabase
    .from("classes")
    .select(`
      id,
      name,
      title,
      description,
      category,
      age_group_min,
      age_group_max,
      town,
      latitude,
      longitude,
      rating,
      review_count,
      popularity,
      price,
      is_featured,
      featured_priority,
      featured_status,
      featured_starts_at,
      featured_ends_at,
      day_of_week,
      time,
      provider_id,
      providers!inner(name),
      provider_onboarding(progress, is_complete)
    `)
    .eq("is_active", true)
    .limit(fetchLimit);

  // Push as many filters to SQL as possible
  // Age filter: push to database if age range specified
  if (ageRange) {
    query = query
      .lte("age_group_min", ageRange.maxMonths)
      .gte("age_group_max", ageRange.minMonths);
  }

  // Keyword search
  if (normalizedKeyword) {
    query = query.or(
      `name.ilike.%${normalizedKeyword}%,description.ilike.%${normalizedKeyword}%,category.ilike.%${normalizedKeyword}%`
    );
  }

  // Category filter
  if (filters.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }

  // Town filter
  if (filters.town) {
    query = query.ilike("town", `%${filters.town}%`);
  }

  // Day filter
  if (normalizedDay) {
    query = query.ilike("day_of_week", `%${normalizedDay}%`);
  }

  const { data: classes, error } = await query;

  if (error || !classes || classes.length === 0) return [];

  // Batch process results (minimal in-memory filtering now)
  const results: ServerSearchResult[] = [];

  for (const cls of classes as ClassRow[]) {
    // Time of day filter (can't push to SQL easily)
    if (filters.timeOfDay && !matchesTimeOfDay(cls.time || null, filters.timeOfDay)) {
      continue;
    }

    // Get provider completeness (handle both array and object responses)
    const onboarding = Array.isArray(cls.provider_onboarding)
      ? cls.provider_onboarding[0]
      : cls.provider_onboarding;
    const providerCompleteness = onboarding?.is_complete ? 1.0 : (onboarding?.progress || 0) / 100;

    // Calculate score
    const score = calculateSearchScore({
      classItem: {
        id: cls.id,
        name: cls.name || "",
        title: cls.title,
        description: cls.description,
        category: cls.category,
        age_group_min: cls.age_group_min,
        age_group_max: cls.age_group_max,
        town: cls.town,
        latitude: cls.latitude,
        longitude: cls.longitude,
        rating: cls.rating,
        review_count: cls.review_count,
        popularity: cls.popularity,
        price: cls.price,
        is_featured: cls.is_featured,
        featured_priority: cls.featured_priority,
        featured_status: cls.featured_status,
        featured_starts_at: cls.featured_starts_at,
        featured_ends_at: cls.featured_ends_at,
      },
      searchQuery: normalizedKeyword,
      searchLat: filters.lat,
      searchLng: filters.lng,
      providerCompleteness,
      sessionRecency: 7,
    });

    const provider = Array.isArray(cls.providers) ? cls.providers[0] : cls.providers;
    const providerName = provider?.name || "Provider";

    results.push({
      id: cls.id,
      name: cls.name || cls.title || "Class",
      providerName,
      category: cls.category || "",
      town: cls.town || "",
      score,
    });
  }

  // Sort by score and return top 30
  return results.sort((a, b) => b.score - a.score).slice(0, 30);
}

