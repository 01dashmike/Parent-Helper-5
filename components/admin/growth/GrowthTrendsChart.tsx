"use client";

import { memo, useMemo, Suspense } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { formatMonthDay } from "@/lib/utils/date";
import { themeColors } from "@/lib/theme-colors";

type MetricRow = {
  week: string;
  active_users: number;
  total_revenue: number;
  wallet_credits: number;
  total_referrals: number;
  conversions: number;
};

interface GrowthTrendsChartProps {
  metrics: MetricRow[];
}

function formatWeek(weekStr: string): string {
  try {
    const date = new Date(weekStr);
    return formatMonthDay(date);
  } catch {
    return weekStr;
  }
}

const ChartContent = memo(function ChartContent({ metrics }: GrowthTrendsChartProps) {
  const chartData = useMemo(() => {
    return metrics
      .slice()
      .reverse()
      .map((m) => ({
        week: formatWeek(m.week),
        revenue: Math.round(m.total_revenue * 100) / 100,
        referrals: m.total_referrals || 0,
        conversions: m.conversions || 0,
        walletCredits: Math.round((m.wallet_credits || 0) * 100) / 100,
      }));
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Revenue Growth */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionTokens.slow }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Revenue Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.alt + "40"} />
            <XAxis dataKey="week" stroke={themeColors.charcoal.dark} fontSize={12} />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
              formatter={(value: number) => `£${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              dot={{ fill: themeColors.sage.alt, r: 4 }}
              name="Revenue (£)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Referrals vs Conversions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionTokens.slow, delay: 0.1 }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Referrals vs Conversions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.alt + "40"} />
            <XAxis dataKey="week" stroke={themeColors.charcoal.dark} fontSize={12} />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="referrals"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              dot={{ fill: themeColors.sage.alt, r: 4 }}
              name="Referrals"
            />
            <Line
              type="monotone"
              dataKey="conversions"
              stroke={themeColors.terracotta}
              strokeWidth={2}
              dot={{ fill: themeColors.terracotta, r: 4 }}
              name="Conversions"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Wallet Credit Flow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionTokens.slow, delay: 0.2 }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Wallet Credit Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.alt + "40"} />
            <XAxis dataKey="week" stroke={themeColors.charcoal.dark} fontSize={12} />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
              formatter={(value: number) => `£${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="walletCredits"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              dot={{ fill: themeColors.sage.alt, r: 4 }}
              name="Credits Issued (£)"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
});

ChartContent.displayName = "ChartContent";

export default function GrowthTrendsChart({ metrics }: GrowthTrendsChartProps) {
  return (
    <Suspense fallback={<div className="h-96 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
      <ChartContent metrics={metrics} />
    </Suspense>
  );
}

