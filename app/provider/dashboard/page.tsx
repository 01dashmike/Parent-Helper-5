"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

const COLORS = ["#007A74", "#FF7A73", "#D7E8E0", "#E7E2F5", "#1F3B3B", "#FDBA8C"];

export default function ProviderDashboard() {
  const [data, setData] = useState<ProviderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/provider/dashboard")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load provider dashboard");
        return response.json();
      })
      .then((json: ProviderDashboardData) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setError("Unable to load dashboard data.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-brand-teal">
        <Loader2 className="h-10 w-10 animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="mt-20 text-center text-brand-textMuted">{error ?? "No data available."}</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-brand-teal">Provider Dashboard</h1>
        <Button variant="default" className="bg-brand-teal text-white hover:bg-brand-coral">
          Export Report
        </Button>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="bg-brand-cream/80 shadow">
          <CardHeader>
            <CardTitle className="text-brand-teal">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-teal">{data.stats.totalBookings}</p>
          </CardContent>
        </Card>

        <Card className="bg-brand-cream/80 shadow">
          <CardHeader>
            <CardTitle className="text-brand-teal">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-teal">
              £{data.stats.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-cream/80 shadow">
          <CardHeader>
            <CardTitle className="text-brand-teal">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-teal">
              {data.stats.avgRating.toFixed(1)}{" "}
              <span className="text-base text-brand-lavender">★</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-teal">Bookings Trend</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Class Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.popularity}>
                <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#FF7A73" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-teal">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.revenueByCategory}
                  dataKey="value"
                  nameKey="category"
                  outerRadius={100}
                  label
                >
                  {data.revenueByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
