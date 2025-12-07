"use client";

import { memo, useMemo } from "react";
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
  sage: "#9BAE82",
  sageLight: "#A8B8A8",
};

type BookingsData = Array<{ date: string; bookings: number; revenue: number }>;

const BookingsChart = memo(function BookingsChart({ data }: { data: BookingsData }) {
  const safeData = useMemo(() => data || [], [data]);

  // Memoize formatted data
  const formattedData = useMemo(() => {
    return safeData.map((item) => ({
      ...item,
      dateLabel: new Date(item.date).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft" aria-label="Bookings by day chart showing daily booking trends">
        <h3 className="mb-4 text-title font-semibold text-charcoal">Bookings by Day</h3>
        <EmptyState
          title="No bookings data available yet"
          description="Booking data will appear here once you receive bookings."
          iconVariant="inbox"
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-charcoal">Bookings by Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.sage} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.sage} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#9BAE8220" />
          <XAxis
            dataKey="dateLabel"
            stroke="#3D3D3D"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#3D3D3D" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #9BAE8230",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#3D3D3D", fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="bookings"
            stroke={COLORS.sage}
            fillOpacity={1}
            fill="url(#colorBookings)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

BookingsChart.displayName = "BookingsChart";

export default BookingsChart;

