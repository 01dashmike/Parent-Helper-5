/**
 * SEO Taxonomy Configuration
 * 
 * Single source of truth for SEO route generation and sitemap
 */

import { CLASS_CATEGORIES } from "@/lib/constants/categories";
import { createServerClient } from "@/lib/supabase/server";

type AnyRow = Record<string, unknown>;

export type SEOCategory = {
  slug: string; // e.g. "baby-music"
  label: string; // e.g. "Baby Music Classes"
  internalCategory: string; // e.g. "music"
  ageSlug?: string; // e.g. "baby" - if this category is age-specific
};

export type SEOAge = {
  slug: string; // e.g. "baby"
  label: string; // e.g. "Baby (0–12 months)"
  minMonths: number;
  maxMonths: number;
};

export type SEOCity = {
  slug: string; // e.g. "london"
  label: string; // e.g. "London"
  county?: string;
};

/**
 * SEO Categories - Commercial combinations that map to internal categories
 * These are the high-value SEO targets
 */
export const SEO_CATEGORIES: SEOCategory[] = [
  // Baby classes
  { slug: "baby-music", label: "Baby Music Classes", internalCategory: "music", ageSlug: "baby" },
  { slug: "baby-sensory", label: "Baby Sensory Classes", internalCategory: "sensory", ageSlug: "baby" },
  { slug: "baby-swimming", label: "Baby Swimming Classes", internalCategory: "swimming", ageSlug: "baby" },
  { slug: "baby-massage", label: "Baby Massage Classes", internalCategory: "massage", ageSlug: "baby" },
  { slug: "baby-signing", label: "Baby Signing Classes", internalCategory: "signing", ageSlug: "baby" },
  
  // Toddler classes
  { slug: "toddler-music", label: "Toddler Music Classes", internalCategory: "music", ageSlug: "toddler" },
  { slug: "toddler-sensory", label: "Toddler Sensory Classes", internalCategory: "sensory", ageSlug: "toddler" },
  { slug: "toddler-swimming", label: "Toddler Swimming Classes", internalCategory: "swimming", ageSlug: "toddler" },
  { slug: "toddler-gymnastics", label: "Toddler Gymnastics Classes", internalCategory: "gymnastics", ageSlug: "toddler" },
  { slug: "toddler-dance", label: "Toddler Dance Classes", internalCategory: "dance", ageSlug: "toddler" },
  
  // Preschool classes
  { slug: "preschool-music", label: "Preschool Music Classes", internalCategory: "music", ageSlug: "preschool" },
  { slug: "preschool-swimming", label: "Preschool Swimming Classes", internalCategory: "swimming", ageSlug: "preschool" },
  { slug: "preschool-gymnastics", label: "Preschool Gymnastics Classes", internalCategory: "gymnastics", ageSlug: "preschool" },
  { slug: "preschool-dance", label: "Preschool Dance Classes", internalCategory: "dance", ageSlug: "preschool" },
  { slug: "preschool-art", label: "Preschool Art Classes", internalCategory: "art", ageSlug: "preschool" },
  
  // General categories (no age prefix)
  { slug: "swimming", label: "Swimming Classes", internalCategory: "swimming" },
  { slug: "music", label: "Music Classes", internalCategory: "music" },
  { slug: "sensory", label: "Sensory Classes", internalCategory: "sensory" },
  { slug: "yoga", label: "Yoga Classes", internalCategory: "yoga" },
  { slug: "gymnastics", label: "Gymnastics Classes", internalCategory: "gymnastics" },
  { slug: "dance", label: "Dance Classes", internalCategory: "dance" },
  { slug: "art", label: "Art Classes", internalCategory: "art" },
  { slug: "play", label: "Play Groups", internalCategory: "play" },
  { slug: "sports", label: "Sports Classes", internalCategory: "sports" },
  { slug: "language", label: "Language Classes", internalCategory: "language" },
];

/**
 * SEO Age Groups
 * Maps to age_group_min/max in months
 */
export const SEO_AGES: SEOAge[] = [
  { slug: "baby", label: "Baby (0–12 months)", minMonths: 0, maxMonths: 12 },
  { slug: "toddler", label: "Toddler (1–3 years)", minMonths: 12, maxMonths: 36 },
  { slug: "preschool", label: "Preschool (3–5 years)", minMonths: 36, maxMonths: 60 },
];

/**
 * Get SEO cities - only towns with minimum number of classes
 * 
 * @param minClasses - Minimum number of classes required (default: 5)
 */
export async function getSEOCities(minClasses: number = 5): Promise<SEOCity[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    // Get distinct towns that have at least minClasses active classes
    const { data, error } = await supabase
      .from("classes")
      .select("town")
      .eq("is_active", true)
      .not("town", "is", null);

    if (error || !data) {
      console.error("[SEO Taxonomy] Error fetching cities:", error);
      return [];
    }

    // Count classes per town
    const townCounts = new Map<string, number>();
    data.forEach((row: AnyRow) => {
      const town = typeof row.town === "string" ? row.town.toLowerCase().trim() : "";
      if (town) {
        townCounts.set(town, (townCounts.get(town) || 0) + 1);
      }
    });

    // Filter to towns with enough classes and create SEOCity objects
    const cities: SEOCity[] = [];
    for (const [town, count] of townCounts.entries()) {
      if (count >= minClasses) {
        // Capitalize first letter
        const label = town.charAt(0).toUpperCase() + town.slice(1);
        cities.push({
          slug: town.toLowerCase().replace(/\s+/g, "-"), // Normalize slug
          label,
        });
      }
    }

    // Sort by count (descending) then alphabetically
    return cities.sort((a, b) => {
      const countA = townCounts.get(a.slug) || 0;
      const countB = townCounts.get(b.slug) || 0;
      if (countB !== countA) return countB - countA;
      return a.label.localeCompare(b.label);
    });
  } catch (error) {
    console.error("[SEO Taxonomy] Error in getSEOCities:", error);
    return [];
  }
}

/**
 * Get SEO category by slug
 */
export function getSEOCategory(slug: string): SEOCategory | undefined {
  return SEO_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Get SEO age by slug
 */
export function getSEOAge(slug: string): SEOAge | undefined {
  return SEO_AGES.find((age) => age.slug === slug);
}

/**
 * Check if age range overlaps with SEO age definition
 */
export function ageRangeOverlaps(
  classMinMonths: number,
  classMaxMonths: number,
  seoAge: SEOAge
): boolean {
  // Overlap if: classMin <= seoAge.max AND classMax >= seoAge.min
  return classMinMonths <= seoAge.maxMonths && classMaxMonths >= seoAge.minMonths;
}

/**
 * Normalize town name for matching
 */
export function normalizeTownName(town: string): string {
  return town.toLowerCase().trim().replace(/\s+/g, "-");
}

