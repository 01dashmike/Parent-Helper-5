"use client";

import { useEffect } from "react";
import { track, page } from "@/lib/analytics/index";
import { getDashboardData } from "./actions";
import { useRetryFetch } from "@/hooks/useRetryFetch";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { OverviewSkeleton, GrowthScoreSkeleton, UpcomingSessionsSkeleton } from "@/components/provider/DashboardSkeleton";
import GrowthScoreClient from "./dashboard/GrowthScoreClient";
import { OverviewStats } from "./components/OverviewStats";
import { UpcomingSessions } from "./components/UpcomingSessions";
import type { DashboardData } from "./actions";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";

type ProviderDashboardClientProps = {
  providerId: number;
  userId: string;
};

/**
 * Client component to fetch and display provider dashboard data
 * Uses batch server action with retry logic and error boundaries
 */
export default function ProviderDashboardClient({ providerId, userId }: ProviderDashboardClientProps) {
  const { data, loading, error, retry, retryCount } = useRetryFetch<DashboardData>(
    () => getDashboardData(userId),
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt) => {
        console.log(`[ProviderDashboard] Retry attempt ${attempt}`);
      },
      onError: (err) => {
        console.error("[ProviderDashboard] Failed after retries:", err);
      },
    }
  );

  useEffect(() => {
    // Track page view
    page("/provider");

    // Track provider dashboard load
    track("provider_dashboard_loaded", {
      providerId,
      retryCount,
    });
  }, [providerId, retryCount]);

  if (loading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <OverviewSkeleton />
        <GrowthScoreSkeleton />
        <section>
          <h2 className="text-title font-semibold text-charcoal mb-3 sm:mb-4">Next sessions</h2>
          <UpcomingSessionsSkeleton />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error.message}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No dashboard data available"
        description="No dashboard data available."
        iconVariant="inbox"
        size="sm"
      />
    );
  }

  return (
    <ErrorBoundaryWrapper>
      <div className="space-y-8" aria-busy={loading ? "true" : "false"}>
        {/* Overview Stats */}
        <ErrorBoundaryWrapper
          fallback={
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-small text-red-800" role="alert">
              Failed to load overview stats
            </div>
          }
        >
          <OverviewStats data={data.overview} />
        </ErrorBoundaryWrapper>

        {/* Growth Score */}
        <section>
          <h2 className="text-title font-semibold text-charcoal mb-3 sm:mb-4">Growth Score</h2>
          <ErrorBoundaryWrapper
            fallback={
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-small text-red-800" role="alert">
                Failed to load growth score
              </div>
            }
          >
            {data.growthScore ? (
              <GrowthScoreClient data={data.growthScore} />
            ) : (
              <GrowthScoreSkeleton />
            )}
          </ErrorBoundaryWrapper>
        </section>

        {/* Upcoming Sessions */}
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-title font-semibold text-charcoal">Next sessions</h2>
            <p className="text-small text-charcoal/60">
              Showing the next 5 occurrences scheduled after today.
            </p>
          </div>
          <ErrorBoundaryWrapper
            fallback={
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-small text-red-800" role="alert">
                Failed to load upcoming sessions
              </div>
            }
          >
            <UpcomingSessions occurrences={data.overview.upcomingOccurrences} />
          </ErrorBoundaryWrapper>
        </section>
      </div>
    </ErrorBoundaryWrapper>
  );
}
