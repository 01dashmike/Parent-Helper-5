"use client";

import { useEffect } from "react";
import { useRetryFetch } from "@/hooks/useRetryFetch";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { OverviewSkeleton, GrowthScoreSkeleton, UpcomingSessionsSkeleton } from "@/components/provider/DashboardSkeleton";
import GrowthScoreClient from "../(console)/dashboard/GrowthScoreClient";
import { OverviewStats } from "../(console)/components/OverviewStats";
import { UpcomingSessions } from "../(console)/components/UpcomingSessions";
import type { DashboardData } from "../(console)/actions";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";
import { getDashboardDataForDev } from "./actions";

type DevDashboardClientProps = {
  providerId: number;
};

export default function DevDashboardClient({ providerId }: DevDashboardClientProps) {
  const { data, loading, error, retry } = useRetryFetch<DashboardData>(
    () => getDashboardDataForDev(providerId),
    {
      maxRetries: 3,
      retryDelay: 1000,
    }
  );

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
        <OverviewStats data={data.overview} />
        <section>
          <h2 className="text-title font-semibold text-charcoal mb-3 sm:mb-4">Growth Score</h2>
          {data.growthScore ? (
            <GrowthScoreClient data={data.growthScore} />
          ) : (
            <GrowthScoreSkeleton />
          )}
        </section>
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-title font-semibold text-charcoal">Next sessions</h2>
            <p className="text-small text-charcoal/60">
              Showing the next 5 occurrences scheduled after today.
            </p>
          </div>
          <UpcomingSessions occurrences={data.overview.upcomingOccurrences} />
        </section>
      </div>
    </ErrorBoundaryWrapper>
  );
}

