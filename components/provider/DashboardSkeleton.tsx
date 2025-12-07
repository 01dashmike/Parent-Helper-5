"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="grid gap-3 sm:gap-card sm:grid-cols-2 md:grid-cols-3" aria-busy="true" aria-label="Loading overview">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card p-5" aria-hidden="true">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function GrowthScoreSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading growth score">
      <div className="skeleton-card p-6" aria-hidden="true">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-16 w-32 mx-auto mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="skeleton-card p-6" aria-hidden="true">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
      {/* Metrics Summary Cards */}
      <div className="grid gap-card md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card p-5" aria-hidden="true">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-section md:grid-cols-2">
        <div className="skeleton-card p-6" aria-hidden="true">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="skeleton-card p-6" aria-hidden="true">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Additional Widgets */}
      <div className="grid gap-section md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card p-6" aria-hidden="true">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpcomingSessionsSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-3" aria-busy="true" aria-label="Loading upcoming sessions">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="skeleton-card flex flex-col gap-2 p-3 sm:p-4 md:flex-row md:items-center md:justify-between"
          aria-hidden="true"
        >
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

