/**
 * SEO Stats Helper
 * 
 * Functions to check if category/age/town combinations have enough classes
 * to warrant generating SEO pages
 */

import { createServerClient } from "@/lib/supabase/server";
import type { SEOCategory, SEOAge, SEOCity } from "./taxonomy";
import { ageRangeOverlaps, normalizeTownName } from "./taxonomy";

type AnyRow = Record<string, unknown>;

const MIN_CLASSES_FOR_PAGE = 3; // Minimum classes to generate a page

/**
 * Check if a category has enough classes (across all towns)
 */
export async function categoryHasEnoughClasses(
  category: SEOCategory,
  minClasses: number = MIN_CLASSES_FOR_PAGE
): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return false;

  try {
    const { count, error } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("category", category.internalCategory);

    if (error) {
      console.error(`[SEO Stats] Error checking category ${category.slug}:`, error);
      return false;
    }

    return (count || 0) >= minClasses;
  } catch (error) {
    console.error(`[SEO Stats] Error in categoryHasEnoughClasses:`, error);
    return false;
  }
}

/**
 * Check if a category+age combination has enough classes
 */
export async function categoryAgeHasEnoughClasses(
  category: SEOCategory,
  age: SEOAge,
  minClasses: number = MIN_CLASSES_FOR_PAGE
): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return false;

  try {
    // Query classes where category matches and age range overlaps
    const { data, error } = await supabase
      .from("classes")
      .select("id, age_group_min, age_group_max")
      .eq("is_active", true)
      .eq("category", category.internalCategory);

    if (error) {
      console.error(`[SEO Stats] Error checking category+age ${category.slug}/${age.slug}:`, error);
      return false;
    }

    if (!data) return false;

    // Filter by age overlap
    const matchingClasses = data.filter((cls: AnyRow) =>
      ageRangeOverlaps((typeof cls.age_group_min === "number" ? cls.age_group_min : 0), (typeof cls.age_group_max === "number" ? cls.age_group_max : 999), age)
    );

    return matchingClasses.length >= minClasses;
  } catch (error) {
    console.error(`[SEO Stats] Error in categoryAgeHasEnoughClasses:`, error);
    return false;
  }
}

/**
 * Check if a category+age+town combination has enough classes
 */
export async function categoryAgeTownHasEnoughClasses(
  category: SEOCategory,
  age: SEOAge,
  town: SEOCity,
  minClasses: number = MIN_CLASSES_FOR_PAGE
): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return false;

  try {
    const normalizedTown = normalizeTownName(town.label);

    // Query classes matching all criteria
    const { data, error } = await supabase
      .from("classes")
      .select("id, age_group_min, age_group_max, town")
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .ilike("town", `%${town.label}%`); // Case-insensitive partial match

    if (error) {
      console.error(`[SEO Stats] Error checking category+age+town ${category.slug}/${age.slug}/${town.slug}:`, error);
      return false;
    }

    if (!data) return false;

    // Filter by age overlap and exact town match
    const matchingClasses = data.filter((cls: AnyRow) => {
      const townStr = typeof cls.town === "string" ? cls.town : "";
      const townMatches =
        normalizeTownName(townStr) === normalizedTown ||
        townStr.toLowerCase().includes(town.label.toLowerCase());
      return (
        townMatches &&
        ageRangeOverlaps((typeof cls.age_group_min === "number" ? cls.age_group_min : 0), (typeof cls.age_group_max === "number" ? cls.age_group_max : 999), age)
      );
    });

    return matchingClasses.length >= minClasses;
  } catch (error) {
    console.error(`[SEO Stats] Error in categoryAgeTownHasEnoughClasses:`, error);
    return false;
  }
}

/**
 * Check if a town+category combination has enough classes (any age)
 */
export async function townCategoryHasEnoughClasses(
  town: SEOCity,
  category: SEOCategory,
  minClasses: number = MIN_CLASSES_FOR_PAGE
): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return false;

  try {
    const { count, error } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("category", category.internalCategory)
      .ilike("town", `%${town.label}%`);

    if (error) {
      console.error(`[SEO Stats] Error checking town+category ${town.slug}/${category.slug}:`, error);
      return false;
    }

    return (count || 0) >= minClasses;
  } catch (error) {
    console.error(`[SEO Stats] Error in townCategoryHasEnoughClasses:`, error);
    return false;
  }
}

/**
 * Get count of classes for a category+age+town combination
 * (for internal linking - only need to know if > 0)
 */
export async function getClassCountForCombo(
  category: SEOCategory,
  age: SEOAge | null,
  town: SEOCity | null
): Promise<number> {
  const supabase = createServerClient();
  if (!supabase) return 0;

  try {
    let query = supabase
      .from("classes")
      .select("id, age_group_min, age_group_max, town", { count: "exact", head: false })
      .eq("is_active", true)
      .eq("category", category.internalCategory);

    if (town) {
      query = query.ilike("town", `%${town.label}%`);
    }

    const { data, error } = await query;

    if (error || !data) return 0;

    // Filter by age if provided
    if (age) {
      const matching = data.filter((cls: any) =>
        ageRangeOverlaps(cls.age_group_min || 0, cls.age_group_max || 999, age)
      );
      return matching.length;
    }

    return data.length;
  } catch (error) {
    console.error(`[SEO Stats] Error in getClassCountForCombo:`, error);
    return 0;
  }
}

