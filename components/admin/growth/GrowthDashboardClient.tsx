"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import GrowthFunnel from "./GrowthFunnel";
import GrowthKpiCards from "./GrowthKpiCards";
import GrowthTrendsChart from "./GrowthTrendsChart";
import MarketingTable from "./MarketingTable";
import WalletInsightsTable from "./WalletInsightsTable";

type GrowthMetricsData = {
  metrics: Array<{
    week: string;
    active_users: number;
    total_revenue: number;
    wallet_credits: number;
    total_referrals: number;
    conversions: number;
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
    marketing_conversions: number;
  }>;
  kpis: {
    referral_conversion_rate: number;
    avg_wallet_balance: number;
    revenue_growth_rate: number;
    email_open_rate: number;
    email_click_rate: number;
  };
  topWallets: Array<{
    wallet_id: string;
    owner_id: string;
    total_credits: number;
    total_transactions: number;
    member_count: number;
  }>;
  campaignStats: Array<{
    campaignId: string;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
};

export default function GrowthDashboardClient() {
  const [data, setData] = useState<GrowthMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d">("all");
  const [source, setSource] = useState<"all" | "referrals" | "bookings" | "automations">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange !== "all") params.append("range", dateRange);
      if (source !== "all") params.append("source", source);

      const response = await fetch(`/api/admin/growth-metrics?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch growth metrics");
      }
      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      console.error("[GrowthDashboardClient] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, source]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />
          ))}
        </div>
        <div className="h-96 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">{error || "Failed to load growth metrics"}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-small text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-sage/20 bg-white p-4"
      >
        <label className="flex items-center gap-2 text-small">
          <span className="text-slateSoft">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all" || value === "30d" || value === "90d") {
                setDateRange(value);
              }
            }}
            className="ph-input"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-small">
          <span className="text-slateSoft">Source:</span>
          <select
            value={source}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all" || value === "referrals" || value === "bookings" || value === "automations") {
                setSource(value);
              }
            }}
            className="ph-input"
          >
            <option value="all">All Sources</option>
            <option value="referrals">Referrals</option>
            <option value="bookings">Bookings</option>
            <option value="automations">Automations</option>
          </select>
        </label>
      </motion.div>

      {/* KPI Cards */}
      <Suspense fallback={<div className="h-32 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
        <GrowthKpiCards kpis={data.kpis} metrics={data.metrics} />
      </Suspense>

      {/* Trends Charts */}
      <Suspense fallback={<div className="h-96 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
        <GrowthTrendsChart metrics={data.metrics} />
      </Suspense>

      {/* Funnel */}
      <Suspense fallback={<div className="h-64 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
        <GrowthFunnel metrics={data.metrics} />
      </Suspense>

      {/* Marketing Table */}
      <Suspense fallback={<div className="h-64 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
        <MarketingTable campaigns={data.campaignStats} />
      </Suspense>

      {/* Wallet Insights */}
      <Suspense fallback={<div className="h-64 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-cream/50" />}>
        <WalletInsightsTable wallets={data.topWallets} />
      </Suspense>
    </div>
  );
}

