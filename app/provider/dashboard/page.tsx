"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- Types ---
interface ProviderDashboardData {
  stats: {
    totalBookings: number;
    totalRevenue: number;
    avgRating: number;
  };
  trends: Array<{ date: string; bookings: number }>;
  popularity: Array<{ class: string; views: number }>;
  revenueByCategory: Array<{ category: string; value: number }>;
  aiTips: string;
}

const CHART_COLORS = ["#007A74", "#FF7A73", "#D7E8E0", "#E7E2F5", "#1F3B3B", "#FDBA8C"];

// --- Component ---
export default function ProviderDashboard() {
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/provider/dashboard");
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
      const json: ProviderDashboardData = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error("[ProviderDashboard] fetch error:", err);
      setError("Unable to load provider dashboard data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-brand-teal">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-medium text-brand-muted">Loading dashboard...</p>
      </div>
    );
  }

  // --- Error or empty state ---
  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center text-brand-muted">
        <p className="mb-4">{error ?? "No data available."}</p>
        <Button onClick={fetchDashboard} className="bg-brand-teal text-white hover:bg-brand-coral">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // --- Dashboard content ---
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-brand-teal">Provider Dashboard</h1>
        <Button variant="default" className="bg-brand-teal text-white hover:bg-brand-coral">
          Export Report
        </Button>
      </div>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <StatCard title="Total Bookings" value={data.stats.totalBookings} />
        <StatCard
          title="Revenue"
          value={`£${data.stats.totalRevenue.toLocaleString("en-GB", {
            minimumFractionDigits: 2,
          })}`}
        />
        <StatCard
          title="Average Rating"
          value={
            <>
              {data.stats.avgRating.toFixed(1)}{" "}
              <span className="text-base text-brand-lavender">★</span>
            </>
          }
        />
      </motion.div>

      {/* Bookings Trend */}
      <ChartCard title="Bookings Trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.trends}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="#007A74"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Popularity & Revenue */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard title="Class Popularity">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.popularity}>
              <XAxis dataKey="class" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#FF7A73" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.revenueByCategory}
                dataKey="value"
                nameKey="category"
                outerRadius={100}
                label
              >
                {data.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI Business Tips */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-teal">AI Business Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-6 text-brand-textMuted">
            {data.aiTips}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Small stat card helper component ---
function StatCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card className="bg-brand-cream/80 shadow">
      <CardHeader>
        <CardTitle className="text-brand-teal">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-brand-teal">{value}</p>
      </CardContent>
    </Card>
  );
}

// --- Small chart card helper component ---
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-brand-teal">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
