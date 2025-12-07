"use client";

import { Eye, Calendar, PoundSterling, TrendingUp } from "lucide-react";
import { KPICard } from "./KPICard";
import type { HeroDashboardResponse } from "@/lib/provider/dashboard";

interface DashboardHeroProps {
  kpis: HeroDashboardResponse["kpis"];
}

export function DashboardHero({ kpis }: DashboardHeroProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Views"
        value={kpis.views.value.toLocaleString()}
        changePercent={kpis.views.changePercent}
        icon={<Eye className="h-6 w-6" />}
      />
      <KPICard
        label="Bookings"
        value={kpis.bookings.value.toLocaleString()}
        changePercent={kpis.bookings.changePercent}
        icon={<Calendar className="h-6 w-6" />}
      />
      <KPICard
        label="Revenue"
        value={formatCurrency(kpis.revenue.value)}
        changePercent={kpis.revenue.changePercent}
        icon={<PoundSterling className="h-6 w-6" />}
      />
      <KPICard
        label="Growth Score"
        value={kpis.growthScore.value.toString()}
        changePercent={kpis.growthScore.changePercent}
        icon={<TrendingUp className="h-6 w-6" />}
      />
    </div>
  );
}





