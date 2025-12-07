"use client";

import { memo, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

// Lazy load heavy dashboard components
const DashboardHero = lazy(() => import("@/components/provider/dashboard/DashboardHero").then(m => ({ default: m.DashboardHero })));
const GrowthScoreCard = lazy(() => import("@/components/provider/dashboard/GrowthScoreCard").then(m => ({ default: m.GrowthScoreCard })));
const AlertsPanel = lazy(() => import("@/components/provider/dashboard/AlertsPanel").then(m => ({ default: m.AlertsPanel })));
const RecommendedActions = lazy(() => import("@/components/provider/dashboard/RecommendedActions").then(m => ({ default: m.RecommendedActions })));
const QuickStatsGrid = lazy(() => import("@/components/provider/dashboard/QuickStatsGrid").then(m => ({ default: m.QuickStatsGrid })));
const OneClickActions = lazy(() => import("@/components/provider/dashboard/OneClickActions").then(m => ({ default: m.OneClickActions })));

interface ProviderDashboardHeroClientProps {
  initialData: HeroDashboardResponse;
}

const ProviderDashboardHeroClient = memo(function ProviderDashboardHeroClient({
  initialData,
}: ProviderDashboardHeroClientProps) {
  return (
    <div className="space-y-8">
      {/* Hero KPIs */}
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <DashboardHero kpis={initialData.kpis} />
      </Suspense>

      {/* Growth Score */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <GrowthScoreCard data={initialData.growthScore} />
      </Suspense>

      {/* Alerts and Recommended Actions */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <AlertsPanel alerts={initialData.alerts} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <RecommendedActions actions={initialData.recommendedActions} />
        </Suspense>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <QuickStatsGrid stats={initialData.quickStats} />
      </Suspense>

      {/* One-Click Actions */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <OneClickActions />
      </Suspense>
    </div>
  );
});

export default ProviderDashboardHeroClient;


