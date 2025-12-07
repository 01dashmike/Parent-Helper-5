/**
 * Shared helper functions for provider analytics
 * Ensures consistent calculation of views, bookings, conversion rate, and reviews
 * Now uses core gamification utilities for date calculations
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { getDaysAgo } from "@/lib/gamification/core";

/**
 * Get 30-day window date (consistent across all metrics)
 * Uses core utility for consistency
 */
export function getThirtyDaysAgo(): Date {
  return getDaysAgo(30);
}

/**
 * Calculate views for a provider (last 30 days)
 * Filters analytics_events by provider_id consistently
 * Prevents double-counting for multi-class providers by using DISTINCT session IDs
 * 
 * @param supabase - Supabase client
 * @param providerId - Provider ID
 * @returns Number of unique views
 */
export async function getProviderViews(
  supabase: ReturnType<typeof getSupabaseServer>,
  providerId: number
): Promise<number> {
  if (!supabase) return 0;

  // Get all class IDs for this provider
  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("provider_id", providerId);

  if (!classes || classes.length === 0) {
    return 0;
  }

  const classIds = classes.map((c: { id: number }) => c.id);
  const classIdStrings = classIds.map(String);
  const thirtyDaysAgo = getDaysAgo(30);

  // Fetch class_viewed events for this provider's classes
  const { data: viewEvents } = await supabase
    .from("analytics_events")
    .select("payload")
    .eq("event_type", "class_viewed")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (!viewEvents) {
    return 0;
  }

  // Filter by provider's classes and count unique class views per session
  // This prevents double-counting: same session viewing same class multiple times = 1 view
  // But different classes or different sessions = separate views
  const uniqueClassViews = new Set<string>();
  viewEvents.forEach((event: { payload?: unknown; created_at?: string }) => {
    const payload = event.payload as Record<string, unknown>;
    if (payload?.classId && classIdStrings.includes(String(payload.classId))) {
      if (payload.sessionId) {
        // Use sessionId + classId as unique key to prevent double-counting same class in same session
        const viewKey = `${payload.sessionId}:${payload.classId}`;
        uniqueClassViews.add(viewKey);
      } else {
        // If no sessionId, fall back to counting each event (less ideal but handles edge cases)
        uniqueClassViews.add(`${event.created_at}:${payload.classId}`);
      }
    }
  });

  return uniqueClassViews.size;
}

/**
 * Calculate bookings for a provider (last 30 days)
 * Only counts confirmed bookings
 * Excludes test bookings (email LIKE '%@example.com')
 * 
 * @param supabase - Supabase client
 * @param providerId - Provider ID
 * @returns Number of confirmed bookings (excluding test bookings)
 */
export async function getProviderBookings(
  supabase: ReturnType<typeof getSupabaseServer>,
  providerId: number
): Promise<number> {
  if (!supabase) return 0;

  const thirtyDaysAgo = getDaysAgo(30);

  // Get class IDs for this provider
  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("provider_id", providerId);

  if (!classes || classes.length === 0) {
    return 0;
  }

  const classIds = classes.map((c: { id: number }) => c.id);

  // Count confirmed bookings, excluding test bookings
  // Note: Supabase PostgREST doesn't support .not() with "like", so we filter in code
  const { data: bookings } = await supabase
    .from("simple_bookings")
    .select("*", { count: "exact" })
    .in("class_id", classIds)
    .eq("status", "confirmed")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Filter out test bookings (email LIKE '%@example.com')
  const validBookings = bookings?.filter(
    (booking: { email?: string | null }) => booking.email && !booking.email.toLowerCase().includes("@example.com")
  ) || [];

  return validBookings.length;
}

/**
 * Calculate conversion rate for a provider (last 30 days)
 * Uses consistent 30-day window and same filtering logic as views/bookings
 * 
 * @param supabase - Supabase client
 * @param providerId - Provider ID
 * @returns Conversion rate percentage (0-100)
 */
export async function getProviderConversionRate(
  supabase: ReturnType<typeof getSupabaseServer>,
  providerId: number
): Promise<number> {
  const views = await getProviderViews(supabase, providerId);
  const bookings = await getProviderBookings(supabase, providerId);

  if (views === 0) {
    return 0;
  }

  return Math.round((bookings / views) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate recent reviews for a provider (last 30 days)
 * Uses consistent 30-day window (not 60 days)
 * 
 * @param supabase - Supabase client
 * @param providerId - Provider ID
 * @returns Number of approved reviews in last 30 days
 */
export async function getProviderRecentReviews(
  supabase: ReturnType<typeof getSupabaseServer>,
  providerId: number
): Promise<number> {
  if (!supabase) return 0;

  const thirtyDaysAgo = getDaysAgo(30);

  const { count } = await supabase
    .from("provider_reviews")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("status", "approved")
    .gte("created_at", thirtyDaysAgo.toISOString());

  return count || 0;
}

/**
 * Get all provider analytics metrics (last 30 days)
 * Uses consistent window and filtering across all metrics
 * 
 * @param supabase - Supabase client
 * @param providerId - Provider ID
 * @returns Object with views, bookings, conversionRate, recentReviews
 */
export async function getProviderAnalyticsMetrics(
  supabase: ReturnType<typeof getSupabaseServer>,
  providerId: number
): Promise<{
  views: number;
  bookings: number;
  conversionRate: number;
  recentReviews: number;
}> {
  const [views, bookings, conversionRate, recentReviews] = await Promise.all([
    getProviderViews(supabase, providerId),
    getProviderBookings(supabase, providerId),
    getProviderConversionRate(supabase, providerId),
    getProviderRecentReviews(supabase, providerId),
  ]);

  return {
    views,
    bookings,
    conversionRate,
    recentReviews,
  };
}

