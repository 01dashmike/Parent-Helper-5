/**
 * Recommendations Engine
 * 
 * Provides personalized class recommendations based on user context
 * This is a stub implementation - will be expanded in future prompts
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import type { SearchFilters } from "@/lib/search/engine";

export type RecommendationContext = {
  userId?: string | null;
  town?: string;
  category?: string;
  lat?: number;
  lng?: number;
};

/**
 * Get recommended classes for a user
 * 
 * Rules:
 * 1. If logged in: Show classes matching past browse history categories
 * 2. If anonymous: Show popular classes in that town/category
 * 3. If no filters: Show trending classes in user's nearest town
 */
export async function getRecommendedClassesForUser(
  context: RecommendationContext,
  limit: number = 10
): Promise<Array<{ id: number; name: string; category: string; town: string; score: number }>> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  // Rule 1: Logged in user - match past browse history
  if (context.userId) {
    // TODO: Fetch user's past browse history from analytics_events
    // For now, return popular classes in their area
    return getPopularClassesInArea(context, limit);
  }

  // Rule 2: Anonymous user with filters - show popular in town/category
  if (context.town || context.category) {
    return getPopularClassesInArea(context, limit);
  }

  // Rule 3: No filters - show trending classes
  return getTrendingClasses(context, limit);
}

/**
 * Get popular classes in a specific area
 */
async function getPopularClassesInArea(
  context: RecommendationContext,
  limit: number
): Promise<Array<{ id: number; name: string; category: string; town: string; score: number }>> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("classes")
    .select("id, name, category, town, popularity, rating, review_count")
    .eq("is_active", true)
    .order("popularity", { ascending: false })
    .limit(limit);

  if (context.town) {
    query = query.ilike("town", `%${context.town}%`);
  }

  if (context.category) {
    query = query.ilike("category", `%${context.category}%`);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((cls) => ({
    id: cls.id,
    name: cls.name || "Class",
    category: cls.category || "",
    town: cls.town || "",
    score: (cls.popularity || 0) + (cls.rating ? parseFloat(cls.rating.toString()) * 10 : 0),
  }));
}

/**
 * Get trending classes (popular this week)
 */
async function getTrendingClasses(
  context: RecommendationContext,
  limit: number
): Promise<Array<{ id: number; name: string; category: string; town: string; score: number }>> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  // Get classes with high recent views from provider_daily_metrics
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: metrics } = await supabase
    .from("provider_daily_metrics")
    .select("provider_id, views")
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("views", { ascending: false })
    .limit(limit * 2);

  if (!metrics || metrics.length === 0) {
    return getPopularClassesInArea(context, limit);
  }

  const providerIds = [...new Set(metrics.map((m) => m.provider_id))].slice(0, limit);

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, category, town")
    .eq("is_active", true)
    .in("provider_id", providerIds)
    .limit(limit);

  if (!classes) return [];

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name || "Class",
    category: cls.category || "",
    town: cls.town || "",
    score: 1.0, // Trending classes get high score
  }));
}





