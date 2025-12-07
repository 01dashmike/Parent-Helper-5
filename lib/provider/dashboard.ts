/**
 * Provider Dashboard Hero Data
 * 
 * Consolidated dashboard data for the provider command centre
 * Optimized for performance with caching and parallel queries
 */

import { createClient } from "@/lib/supabase/server";
import { getOnboardingState } from "./onboarding";
import { buildProviderAlerts } from "./alerts";
import { buildRecommendedActions } from "./recommended-actions";
import { getOrSetCache, CacheTTL } from "@/lib/cache/helpers";

export interface HeroDashboardResponse {
  kpis: {
    views: { value: number; changePercent: number | null };
    bookings: { value: number; changePercent: number | null };
    revenue: { value: number; changePercent: number | null };
    growthScore: { value: number; changePercent: number | null };
  };
  growthScore: {
    overall: number; // 0-100
    completeness: number; // 0-100
    engagement: number; // 0-100
    growth: number; // 0-100
    notes: string[]; // human-readable hints
  };
  quickStats: {
    views: { thisWeek: number; lastWeek: number; changePercent: number | null };
    bookings: { thisWeek: number; lastWeek: number; changePercent: number | null };
    conversionRate: { thisWeek: number; lastWeek: number; changePercent: number | null };
    searchAppearances: { thisWeek: number; lastWeek: number; changePercent: number | null };
  };
  alerts: {
    id: string;
    type: "warning" | "info" | "success";
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
  }[];
  recommendedActions: {
    id: string;
    title: string;
    description: string;
    impact: "low" | "medium" | "high";
    estimatedLiftPercent?: number;
    ctaLabel: string;
    ctaHref: string;
  }[];
}

// Type definitions for better performance (reused across functions)
type MetricRow = { views?: number | null };
type BookingRow = { id?: string | number; total_paid: number | string };
type ClassRow = { 
  id?: number;
  name?: string;
  description?: string;
  image_urls?: string | string[] | null;
  is_published?: boolean | null;
};

/**
 * Calculate week-over-week change percentage (pure function)
 */
function calculateChangePercent(thisWeek: number, lastWeek: number): number | null {
  if (lastWeek === 0) {
    return thisWeek > 0 ? 100 : null;
  }
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

/**
 * Calculate views from metrics data (optimized reduce)
 */
function sumViews(metrics: MetricRow[] | null): number {
  if (!metrics || metrics.length === 0) return 0;
  let total = 0;
  for (const m of metrics) {
    total += m.views || 0;
  }
  return total;
}

/**
 * Calculate revenue from bookings (optimized reduce)
 */
function sumRevenue(bookings: BookingRow[] | null): number {
  if (!bookings || bookings.length === 0) return 0;
  let total = 0;
  for (const b of bookings) {
    total += Number(b.total_paid) || 0;
  }
  return total;
}

/**
 * Get date range for this week (Monday to Sunday)
 */
function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

/**
 * Get date range for last week
 */
function getLastWeekRange(): { start: Date; end: Date } {
  const thisWeek = getThisWeekRange();
  const lastWeekStart = new Date(thisWeek.start);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeek.end);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  return { start: lastWeekStart, end: lastWeekEnd };
}

/**
 * Calculate growth score components (optimized with parallel queries)
 */
async function calculateGrowthScore(
  supabase: ReturnType<typeof createClient>,
  providerId: number,
  kpis: HeroDashboardResponse["kpis"],
  quickStats: HeroDashboardResponse["quickStats"]
): Promise<HeroDashboardResponse["growthScore"]> {
  // Fetch all required data in parallel for better performance
  const [onboardingState, providerResult, classesResult] = await Promise.all([
    getOnboardingState(providerId),
    supabase
      .from("providers")
      .select("name, description, contact_email, contact_phone, address_line1, town, postcode")
      .eq("id", providerId)
      .single(),
    supabase
      .from("classes")
      .select("id, image_urls, is_published")
      .eq("provider_id", providerId),
  ]);

  const provider = providerResult.data;
  const classes = classesResult.data;

  let completenessScore = 0;
  const notes: string[] = [];

  // Onboarding complete: +30
  if (onboardingState.isComplete) {
    completenessScore += 30;
  } else {
    notes.push("Complete your onboarding to improve visibility");
  }

  // Provider profile complete: +20
  if (provider?.name && provider?.contact_email && provider?.contact_phone) {
    completenessScore += 20;
  } else {
    notes.push("Add your contact information");
  }

  // Provider description: +15
  if (provider?.description && provider.description.length > 50) {
    completenessScore += 15;
  } else {
    notes.push("Add a detailed description to your profile");
  }

  // Address complete: +15
  if (provider?.address_line1 && provider?.town && provider?.postcode) {
    completenessScore += 15;
  } else {
    notes.push("Complete your business address");
  }

  // Published classes and images check (combined for efficiency)
  let publishedCount = 0;
  let hasClassImages = false;
  
  if (classes && classes.length > 0) {
    for (const c of classes) {
      if (c.is_published) publishedCount++;
      if (!hasClassImages && c.image_urls) {
        const urls = c.image_urls;
        if (typeof urls === "string" && urls.length > 0) hasClassImages = true;
        else if (Array.isArray(urls) && urls.length > 0) hasClassImages = true;
      }
    }
  }
  
  completenessScore += Math.min(publishedCount * 10, 20);
  
  if (hasClassImages) {
    completenessScore += 10;
  } else {
    notes.push("Add photos to your classes to increase bookings");
  }

  // 2. Engagement (0-100)
  let engagementScore = 0;
  const totalViews = quickStats.views.thisWeek;
  const totalBookings = quickStats.bookings.thisWeek;

  // Views: 0-40 points (scaled)
  if (totalViews > 100) {
    engagementScore += 40;
  } else if (totalViews > 50) {
    engagementScore += 30;
  } else if (totalViews > 20) {
    engagementScore += 20;
  } else if (totalViews > 0) {
    engagementScore += 10;
  }

  // Bookings: 0-40 points (scaled)
  if (totalBookings > 10) {
    engagementScore += 40;
  } else if (totalBookings > 5) {
    engagementScore += 30;
  } else if (totalBookings > 2) {
    engagementScore += 20;
  } else if (totalBookings > 0) {
    engagementScore += 10;
  }

  // Conversion rate: 0-20 points
  const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
  if (conversionRate > 10) {
    engagementScore += 20;
  } else if (conversionRate > 5) {
    engagementScore += 15;
  } else if (conversionRate > 2) {
    engagementScore += 10;
  } else if (conversionRate > 0) {
    engagementScore += 5;
  }

  if (engagementScore < 30) {
    notes.push("Improve your listing to get more views and bookings");
  }

  // 3. Growth (0-100) - week-over-week trends
  let growthScore = 50; // Start at neutral
  const viewsChange = quickStats.views.changePercent;
  const bookingsChange = quickStats.bookings.changePercent;

  if (viewsChange !== null) {
    if (viewsChange > 20) {
      growthScore += 25;
    } else if (viewsChange > 10) {
      growthScore += 15;
    } else if (viewsChange > 0) {
      growthScore += 10;
    } else if (viewsChange < -20) {
      growthScore -= 25;
    } else if (viewsChange < -10) {
      growthScore -= 15;
    } else if (viewsChange < 0) {
      growthScore -= 10;
    }
  }

  if (bookingsChange !== null) {
    if (bookingsChange > 20) {
      growthScore += 25;
    } else if (bookingsChange > 10) {
      growthScore += 15;
    } else if (bookingsChange > 0) {
      growthScore += 10;
    } else if (bookingsChange < -20) {
      growthScore -= 25;
    } else if (bookingsChange < -10) {
      growthScore -= 15;
    } else if (bookingsChange < 0) {
      growthScore -= 10;
    }
  }

  growthScore = Math.max(0, Math.min(100, growthScore));

  if (growthScore < 40) {
    notes.push("Your metrics are declining - consider updating your listings");
  }

  // Overall: weighted average
  const overall = Math.round(
    0.3 * completenessScore + 0.4 * engagementScore + 0.3 * growthScore
  );

  return {
    overall,
    completeness: Math.round(completenessScore),
    engagement: Math.round(engagementScore),
    growth: Math.round(growthScore),
    notes: notes.slice(0, 3), // Limit to 3 notes
  };
}

/**
 * Get hero dashboard data for a provider (with caching)
 */
export async function getHeroDashboardData(
  providerId: number
): Promise<HeroDashboardResponse> {
  // Cache dashboard data for 5 minutes to reduce database load
  return getOrSetCache(
    "provider_dashboard",
    [providerId],
    CacheTTL.SHORT, // 5 minutes
    async () => {
      return await getHeroDashboardDataUncached(providerId);
    }
  );
}

/**
 * Internal uncached version of dashboard data fetching
 */
async function getHeroDashboardDataUncached(
  providerId: number
): Promise<HeroDashboardResponse> {
  const supabase = await createClient();

  // Get week ranges (computed once)
  const thisWeek = getThisWeekRange();
  const lastWeek = getLastWeekRange();

  // Pre-compute date strings to avoid repeated operations
  const thisWeekStartDate = thisWeek.start.toISOString().split("T")[0];
  const thisWeekEndDate = thisWeek.end.toISOString().split("T")[0];
  const lastWeekStartDate = lastWeek.start.toISOString().split("T")[0];
  const lastWeekEndDate = lastWeek.end.toISOString().split("T")[0];
  const thisWeekStartISO = thisWeek.start.toISOString();
  const thisWeekEndISO = thisWeek.end.toISOString();
  const lastWeekStartISO = lastWeek.start.toISOString();
  const lastWeekEndISO = lastWeek.end.toISOString();

  // Get metrics for this week and last week (optimized parallel queries)
  const [thisWeekMetrics, lastWeekMetrics, bookingsThisWeek, bookingsLastWeek] = await Promise.all([
    // This week views (from provider_metrics table) - select only needed column
    supabase
      .from("provider_metrics")
      .select("views")
      .eq("provider_id", providerId)
      .gte("metric_date", thisWeekStartDate)
      .lte("metric_date", thisWeekEndDate),
    // Last week views
    supabase
      .from("provider_metrics")
      .select("views")
      .eq("provider_id", providerId)
      .gte("metric_date", lastWeekStartDate)
      .lte("metric_date", lastWeekEndDate),
    // This week bookings - only select needed columns
    supabase
      .from("bookings")
      .select("total_paid", { count: "exact" })
      .eq("provider_id", providerId)
      .gte("created_at", thisWeekStartISO)
      .lte("created_at", thisWeekEndISO),
    // Last week bookings
    supabase
      .from("bookings")
      .select("total_paid", { count: "exact" })
      .eq("provider_id", providerId)
      .gte("created_at", lastWeekStartISO)
      .lte("created_at", lastWeekEndISO),
  ]);

  // Calculate views (using optimized function)
  const viewsThisWeek = sumViews(thisWeekMetrics.data);
  const viewsLastWeek = sumViews(lastWeekMetrics.data);
  const viewsChangePercent = calculateChangePercent(viewsThisWeek, viewsLastWeek);

  // Calculate bookings
  const bookingsThisWeekCount = bookingsThisWeek.count || 0;
  const bookingsLastWeekCount = bookingsLastWeek.count || 0;
  const bookingsChangePercent = calculateChangePercent(bookingsThisWeekCount, bookingsLastWeekCount);

  // Calculate revenue (using optimized function)
  const revenueThisWeek = sumRevenue(bookingsThisWeek.data);
  const revenueLastWeek = sumRevenue(bookingsLastWeek.data);
  const revenueChangePercent = calculateChangePercent(revenueThisWeek, revenueLastWeek);

  // Quick stats
  const quickStats: HeroDashboardResponse["quickStats"] = {
    views: {
      thisWeek: viewsThisWeek,
      lastWeek: viewsLastWeek,
      changePercent: viewsChangePercent,
    },
    bookings: {
      thisWeek: bookingsThisWeekCount,
      lastWeek: bookingsLastWeekCount,
      changePercent: bookingsChangePercent,
    },
    conversionRate: {
      thisWeek: viewsThisWeek > 0 ? Math.round((bookingsThisWeekCount / viewsThisWeek) * 100 * 100) / 100 : 0,
      lastWeek: viewsLastWeek > 0 ? Math.round((bookingsLastWeekCount / viewsLastWeek) * 100 * 100) / 100 : 0,
      changePercent: viewsThisWeek > 0 && viewsLastWeek > 0
        ? calculateChangePercent(
            (bookingsThisWeekCount / viewsThisWeek) * 100,
            (bookingsLastWeekCount / viewsLastWeek) * 100
          )
        : null,
    },
    searchAppearances: {
      // TODO: Implement search appearances tracking
      thisWeek: viewsThisWeek, // Stub: use views as proxy
      lastWeek: viewsLastWeek,
      changePercent: viewsChangePercent,
    },
  };

  // Build KPIs object once to avoid duplication
  const kpis: HeroDashboardResponse["kpis"] = {
    views: { value: viewsThisWeek, changePercent: viewsChangePercent },
    bookings: { value: bookingsThisWeekCount, changePercent: bookingsChangePercent },
    revenue: { value: revenueThisWeek, changePercent: revenueChangePercent },
    growthScore: { value: 0, changePercent: null }, // Will be updated below
  };

  // Fetch remaining data in parallel for better performance
  const [growthScore, onboardingState, reviewsResult] = await Promise.all([
    calculateGrowthScore(supabase, providerId, kpis, quickStats),
    getOnboardingState(providerId),
    supabase
      .from("provider_reviews")
      .select("id")
      .eq("provider_id", providerId)
      .limit(1),
  ]);

  // Update growth score in KPIs
  kpis.growthScore.value = growthScore.overall;

  // Check for payouts connection (stub for now)
  const payoutsConnected = false; // TODO: Check Stripe connection status

  // Check for reviews
  const hasReviews = (reviewsResult.data?.length || 0) > 0;
  const hasUnansweredReviews = false; // TODO: Check for unanswered reviews

  // Build onboarding object once
  const onboardingInput = {
    isComplete: onboardingState.isComplete,
    missingSteps: [], // TODO: Calculate missing steps
  };

  // Build alerts and actions (pure functions, no async needed)
  const alerts = buildProviderAlerts({
    onboarding: onboardingInput,
    metrics: kpis,
    quickStats,
    payoutsConnected,
    hasReviews,
    hasUnansweredReviews,
  });

  const recommendedActions = buildRecommendedActions({
    growthScore,
    kpis,
    quickStats,
    onboarding: onboardingInput,
  });

  return {
    kpis,
    growthScore,
    quickStats,
    alerts,
    recommendedActions,
  };
}

