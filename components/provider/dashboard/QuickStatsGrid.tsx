"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

interface QuickStatsGridProps {
  stats: HeroDashboardResponse["quickStats"];
}

export function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatConversionRate = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const StatCard = ({
    label,
    thisWeek,
    lastWeek,
    changePercent,
    formatValue = formatNumber,
  }: {
    label: string;
    thisWeek: number;
    lastWeek: number;
    changePercent: number | null;
    formatValue?: (num: number) => string;
  }) => {
    const hasChange = changePercent !== null;
    const isPositive = hasChange && changePercent > 0;
    const isNegative = hasChange && changePercent < 0;

    return (
      <Card className="border-sage/30">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-charcoal/60 uppercase tracking-wide mb-2">
            {label}
          </p>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-charcoal">{formatValue(thisWeek)}</span>
              {hasChange && (
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : isNegative ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isPositive && "text-green-600",
                      isNegative && "text-red-600",
                      !isPositive && !isNegative && "text-charcoal/60"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {changePercent}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-charcoal/50">Last week: {formatValue(lastWeek)}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Views"
        thisWeek={stats.views.thisWeek}
        lastWeek={stats.views.lastWeek}
        changePercent={stats.views.changePercent}
      />
      <StatCard
        label="Bookings"
        thisWeek={stats.bookings.thisWeek}
        lastWeek={stats.bookings.lastWeek}
        changePercent={stats.bookings.changePercent}
      />
      <StatCard
        label="Conversion"
        thisWeek={stats.conversionRate.thisWeek}
        lastWeek={stats.conversionRate.lastWeek}
        changePercent={stats.conversionRate.changePercent}
        formatValue={formatConversionRate}
      />
      <StatCard
        label="Search Appearances"
        thisWeek={stats.searchAppearances.thisWeek}
        lastWeek={stats.searchAppearances.lastWeek}
        changePercent={stats.searchAppearances.changePercent}
      />
    </div>
  );
}

