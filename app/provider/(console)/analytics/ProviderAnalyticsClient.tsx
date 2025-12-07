"use client";

import { ProviderDashboardMetricsSchema } from "@/lib/schemas/api-responses";
import { validateApiResponse } from "@/lib/validation/api-validation";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/emptystate";
import { ErrorState } from "@/components/ui/errorstate";

import { useEffect, useState, useCallback, memo, lazy, Suspense } from "react";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";

// Lazy load heavy chart and widget components for better performance
const RetentionMetrics = lazy(() => import("./components/RetentionMetrics"));
const LowSlotsNotification = lazy(() => import("./components/LowSlotsNotification"));
const GrowthScoreWidget = lazy(() => import("./components/GrowthScoreWidget"));
const VisibilityBoostBadge = lazy(() => import("./components/VisibilityBoostBadge"));
const BookingsChart = lazy(() => import("./components/BookingsChart"));
const RevenueChart = lazy(() => import("./components/RevenueChart"));
const ReviewsSummary = lazy(() => import("./components/ReviewsSummary"));
const ClassConversionTable = lazy(() => import("./components/ClassConversionTable"));

const ProviderAnalyticsSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Metrics Summary Cards Skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>

    {/* Additional Widgets Skeleton */}
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
));

ProviderAnalyticsSkeleton.displayName = "ProviderAnalyticsSkeleton";

type ProviderMetrics = {
  provider_id: number;
  provider_name: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  revenue_last_7_days: number;
  revenue_last_30_days: number;
  average_rating: number;
  review_count: number;
  total_classes: number;
  active_classes: number;
  bookings_by_day: Array<{ date: string; bookings: number; revenue: number }>;
  revenue_by_week: Array<{ week: string; revenue: number }>;
  // Weekly retention metrics
  views?: number;
  bookings_this_week?: number;
  conversion_rate?: number;
  search_appearances?: number;
  reviews_this_week?: number;
  profile_health_score?: number;
  views_change?: number;
  bookings_change?: number;
  conversion_change?: number;
  search_change?: number;
  reviews_change?: number;
  health_change?: number;
  // Low slots notification
  low_slots_area?: string;
  available_slots?: number;
  total_slots?: number;
};

export default function ProviderAnalyticsClient({ providerId }: { providerId: number }) {
  const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/provider/metrics?provider_id=${providerId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch metrics");
      }
      const result = await response.json();
      
      // Validate API response
      const validation = validateApiResponse(ProviderDashboardMetricsSchema, result, {
        fallback: {
          success: false,
          data: {
            totalViews: 0,
            totalWebsiteClicks: 0,
            totalPhoneClicks: 0,
            totalEmailClicks: 0,
            metrics: [],
          },
        },
        logErrors: true,
      });

      if (validation.data) {
        // Extract metrics from validated response
        const validatedData = validation.data.data || validation.data;
        if (validatedData && typeof validatedData === "object") {
          setMetrics(validatedData as ProviderMetrics);
        }
        
        // Log warnings if validation had issues
        if (validation.warnings && validation.warnings.length > 0) {
          console.warn("[ProviderAnalyticsClient] Validation warnings:", validation.warnings);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let cancelled = false;
    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, [fetchMetrics]);

  const handleExportCSV = useCallback(() => {
    if (!metrics || typeof metrics !== "object") return;

    const csvRows = [
      ["Metric", "Value"],
      ["Total Bookings", metrics.total_bookings ?? 0],
      ["Confirmed Bookings", metrics.confirmed_bookings ?? 0],
      ["Cancelled Bookings", metrics.cancelled_bookings ?? 0],
      ["Total Revenue", `£${((metrics.total_revenue ?? 0) as number).toFixed(2)}`],
      ["Revenue (Last 7 Days)", `£${((metrics.revenue_last_7_days ?? 0) as number).toFixed(2)}`],
      ["Revenue (Last 30 Days)", `£${((metrics.revenue_last_30_days ?? 0) as number).toFixed(2)}`],
      ["Average Rating", ((metrics.average_rating ?? 0) as number).toFixed(2)],
      ["Review Count", metrics.review_count ?? 0],
      ["Total Classes", metrics.total_classes ?? 0],
      ["Active Classes", metrics.active_classes ?? 0],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `provider-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading">
        <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-4" aria-hidden="true">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading analytics"
        message={error}
        onRetry={() => {
          setError(null);
          fetchMetrics();
        }}
      />
    );
  }

  if (!metrics) {
    return (
      <EmptyState
        title="No analytics data available yet"
        description="Analytics will appear here once you start receiving bookings and views."
        iconVariant="inbox"
        size="default"
      />
    );
  }

  return (
    <ErrorBoundaryWrapper>
      <div className="space-y-8 print:space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-display-2 font-semibold text-charcoal">Analytics</h1>
            <p className="mt-1 text-small text-charcoal/70">
              Performance insights for {metrics.provider_name ?? "Provider"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="rounded-md border border-sage/50 px-4 py-2 text-small font-medium text-charcoal transition hover:border-sage hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="rounded-md border border-sage/50 px-4 py-2 text-small font-medium text-charcoal transition hover:border-sage hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Print Report
            </button>
          </div>
        </div>

        {/* Growth Score Widget */}
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <div className="mb-6">
            <GrowthScoreWidget providerId={providerId} />
          </div>
        </Suspense>

        {/* Visibility Boost Badge */}
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <div className="mb-6">
            <VisibilityBoostBadge providerId={providerId} />
          </div>
        </Suspense>

        {/* Weekly Retention Metrics - 6 Key Cards */}
        <div>
          <h2 className="mb-4 text-title font-semibold text-charcoal">This Week&apos;s Performance</h2>
          <Suspense fallback={<ProviderAnalyticsSkeleton />}>
            <RetentionMetrics
              views={metrics.views ?? 0}
              bookings={metrics.bookings_this_week ?? 0}
              conversionRate={metrics.conversion_rate ?? 0}
              searchAppearances={metrics.search_appearances ?? 0}
              reviews={metrics.reviews_this_week ?? 0}
              profileHealthScore={metrics.profile_health_score ?? 0}
              viewsChange={metrics.views_change ?? undefined}
              bookingsChange={metrics.bookings_change ?? undefined}
              conversionChange={metrics.conversion_change ?? undefined}
              searchChange={metrics.search_change ?? undefined}
              reviewsChange={metrics.reviews_change ?? undefined}
              healthChange={metrics.health_change ?? undefined}
            />
          </Suspense>
        </div>

        {/* Low Slots Notification */}
        {metrics.low_slots_area && metrics.available_slots !== undefined && metrics.total_slots !== undefined && (
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <LowSlotsNotification
              area={metrics.low_slots_area}
              availableSlots={metrics.available_slots}
              totalSlots={metrics.total_slots}
            />
          </Suspense>
        )}

        {/* Historical Charts */}
        <div className="mt-8">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Trends</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <BookingsChart data={Array.isArray(metrics.bookings_by_day) ? metrics.bookings_by_day : []} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RevenueChart data={Array.isArray(metrics.revenue_by_week) ? metrics.revenue_by_week : []} />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <ReviewsSummary
            averageRating={metrics.average_rating ?? 0}
            reviewCount={metrics.review_count ?? 0}
            providerId={providerId}
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ClassConversionTable providerId={providerId} />
        </Suspense>

        <style jsx global>{`
          @media print {
            .print\\:hidden {
              display: none;
            }
            .print\\:space-y-4 > * + * {
              margin-top: 1rem;
            }
          }
        `}</style>
      </div>
    </ErrorBoundaryWrapper>
  );
}

