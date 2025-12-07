/**
 * SEO Query Helpers
 * 
 * Functions to query classes for SEO pages
 */

import { createServerClient } from "@/lib/supabase/server";
import type { SEOCategory, SEOAge, SEOCity } from "./taxonomy";
import { ageRangeOverlaps, normalizeTownName } from "./taxonomy";

type AnyRow = Record<string, unknown>;

export type SEOClassResult = {
  id: number;
  name: string;
  title?: string | null;
  description?: string | null;
  category: string;
  town: string;
  age_group_min: number;
  age_group_max: number;
  price?: string | null;
  provider_id?: number | null;
  is_featured?: boolean;
  popularity?: number | null;
  rating?: number | string | null;
  review_count?: number | null;
};

/**
 * Query classes for a category (all towns)
 */
export async function queryClassesForCategory(
  category: SEOCategory,
  limit: number = 20
): Promise<SEOClassResult[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, title, description, category, town, age_group_min, age_group_max, price, provider_id, is_featured, popularity, rating, review_count")
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .order("is_featured", { ascending: false })
      .order("popularity", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[SEO Queries] Error querying category ${category.slug}:`, error);
      return [];
    }

    return (data || []) as SEOClassResult[];
  } catch (error) {
    console.error(`[SEO Queries] Error in queryClassesForCategory:`, error);
    return [];
  }
}

/**
 * Query classes for category + age
 */
export async function queryClassesForCategoryAge(
  category: SEOCategory,
  age: SEOAge,
  limit: number = 20
): Promise<SEOClassResult[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, title, description, category, town, age_group_min, age_group_max, price, provider_id, is_featured, popularity, rating, review_count")
      .eq("is_active", true)
      .eq("category", category.internalCategory);

    if (error) {
      console.error(`[SEO Queries] Error querying category+age ${category.slug}/${age.slug}:`, error);
      return [];
    }

    if (!data) return [];

    // Filter by age overlap
    const matching = data
      .filter((cls: AnyRow) =>
        ageRangeOverlaps((typeof cls.age_group_min === "number" ? cls.age_group_min : 0), (typeof cls.age_group_max === "number" ? cls.age_group_max : 999), age)
      )
      .sort((a: AnyRow, b: AnyRow) => {
        // Sort by featured, then popularity, then reviews
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        const aPop = typeof a.popularity === "number" ? a.popularity : 0;
        const bPop = typeof b.popularity === "number" ? b.popularity : 0;
        if (aPop > bPop) return -1;
        if (aPop < bPop) return 1;
        const aReviews = typeof a.review_count === "number" ? a.review_count : 0;
        const bReviews = typeof b.review_count === "number" ? b.review_count : 0;
        return bReviews - aReviews;
      })
      .slice(0, limit);

    return matching as SEOClassResult[];
  } catch (error) {
    console.error(`[SEO Queries] Error in queryClassesForCategoryAge:`, error);
    return [];
  }
}

/**
 * Query classes for category + age + town
 */
export async function queryClassesForCategoryAgeTown(
  category: SEOCategory,
  age: SEOAge,
  town: SEOCity,
  limit: number = 50
): Promise<SEOClassResult[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const normalizedTown = normalizeTownName(town.label);

    const { data, error } = await supabase
      .from("classes")
      .select("id, name, title, description, category, town, age_group_min, age_group_max, price, provider_id, is_featured, popularity, rating, review_count")
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .ilike("town", `%${town.label}%`);

    if (error) {
      console.error(`[SEO Queries] Error querying category+age+town ${category.slug}/${age.slug}/${town.slug}:`, error);
      return [];
    }

    if (!data) return [];

    // Filter by age overlap and exact town match
    const matching = data
      .filter((cls: AnyRow) => {
        const townStr = typeof cls.town === "string" ? cls.town : "";
        const townMatches =
          normalizeTownName(townStr) === normalizedTown ||
          townStr.toLowerCase().includes(town.label.toLowerCase());
        return (
          townMatches &&
          ageRangeOverlaps((typeof cls.age_group_min === "number" ? cls.age_group_min : 0), (typeof cls.age_group_max === "number" ? cls.age_group_max : 999), age)
        );
      })
      .sort((a: AnyRow, b: AnyRow) => {
        // Sort by featured, then popularity, then reviews
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        const aPop = typeof a.popularity === "number" ? a.popularity : 0;
        const bPop = typeof b.popularity === "number" ? b.popularity : 0;
        if (aPop > bPop) return -1;
        if (aPop < bPop) return 1;
        const aReviews = typeof a.review_count === "number" ? a.review_count : 0;
        const bReviews = typeof b.review_count === "number" ? b.review_count : 0;
        return bReviews - aReviews;
      })
      .slice(0, limit);

    return matching as SEOClassResult[];
  } catch (error) {
    console.error(`[SEO Queries] Error in queryClassesForCategoryAgeTown:`, error);
    return [];
  }
}

/**
 * Query classes for town + category (any age)
 */
export async function queryClassesForTownCategory(
  town: SEOCity,
  category: SEOCategory,
  limit: number = 50
): Promise<SEOClassResult[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, title, description, category, town, age_group_min, age_group_max, price, provider_id, is_featured, popularity, rating, review_count")
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .ilike("town", `%${town.label}%`)
      .order("is_featured", { ascending: false })
      .order("popularity", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[SEO Queries] Error querying town+category ${town.slug}/${category.slug}:`, error);
      return [];
    }

    return (data || []) as SEOClassResult[];
  } catch (error) {
    console.error(`[SEO Queries] Error in queryClassesForTownCategory:`, error);
    return [];
  }
}

/**
 * Get top towns for a category (by class count)
 */
export async function getTopTownsForCategory(
  category: SEOCategory,
  limit: number = 10
): Promise<Array<{ town: string; count: number }>> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("town")
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .not("town", "is", null);

    if (error || !data) return [];

    // Count classes per town
    const townCounts = new Map<string, number>();
    data.forEach((row: AnyRow) => {
      const town = typeof row.town === "string" ? row.town.toLowerCase().trim() : "";
      if (town) {
        townCounts.set(town, (townCounts.get(town) || 0) + 1);
      }
    });

    // Sort by count and return top N
    return Array.from(townCounts.entries())
      .map(([town, count]) => ({ town, count }))
      .sort((a, b) => {
        const aCount = typeof a.count === "number" ? a.count : 0;
        const bCount = typeof b.count === "number" ? b.count : 0;
        return bCount - aCount;
      })
      .slice(0, limit);
  } catch (error) {
    console.error(`[SEO Queries] Error in getTopTownsForCategory:`, error);
    return [];
  }
}

