"use client";

import { memo, useMemo, useCallback } from "react";
import { EmptyState } from "@/components/ui/emptystate";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  terracotta: "#C97C5C",
  terracottaLight: "#C97C5C80",
};

type RevenueData = Array<{ week: string; revenue: number }>;

const RevenueChart = memo(function RevenueChart({ data }: { data: RevenueData }) {
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
    }).format(value);
  }, []);

  const safeData = useMemo(() => data || [], [data]);

  // Memoize formatted data
  const formattedData = useMemo(() => {
    return safeData.map((item) => {
      const weekDate = new Date(item.week);
      return {
        ...item,
        weekLabel: `Week ${weekDate.getDate()}/${weekDate.getMonth() + 1}`,
      };
    });
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft" aria-label="Revenue by week chart showing weekly revenue trends">
        <h3 className="mb-4 text-title font-semibold text-charcoal">Revenue by Week</h3>
        <EmptyState
          title="No revenue data available yet"
          description="Revenue data will appear here once you receive payments."
          iconVariant="inbox"
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft" aria-label="Revenue by week chart showing weekly revenue trends">
      <h3 className="mb-4 text-title font-semibold text-charcoal">Revenue by Week</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.terracotta} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.terracotta} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#C97C5C20" />
          <XAxis
            dataKey="weekLabel"
            stroke="#3D3D3D"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#3D3D3D"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #C97C5C30",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#3D3D3D", fontWeight: 600 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.terracotta}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

RevenueChart.displayName = "RevenueChart";

export default RevenueChart;

