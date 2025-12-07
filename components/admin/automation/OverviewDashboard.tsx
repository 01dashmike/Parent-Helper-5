"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { motionTokens } from "@/lib/motion/tokens";
import { themeColors } from "@/lib/theme-colors";

interface SummaryData {
  revenue_cents: number;
  conversion_rate: number;
  wallet_credits_cents: number;
  growth_prediction: string;
  top_provider: string;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

export default function OverviewDashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/automation/summary")
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[OverviewDashboard] Unexpected error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid gap-section md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="motion-safe:animate-pulse motion-reduce:animate-none">
            <CardHeader>
              <div className="h-4 bg-sage/20 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-sage/20 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const revenue = summary?.revenue_cents ? (summary.revenue_cents / 100).toFixed(2) : "0.00";
  const walletCredits = summary?.wallet_credits_cents ? (summary.wallet_credits_cents / 100).toFixed(2) : "0.00";
  const conversionRate = summary?.conversion_rate?.toFixed(1) || "0.0";

  // Funnel data: Signups → Bookings → Referrals
  const funnelData: FunnelData[] = [
    { name: "Signups", value: 1000, fill: themeColors.sage.DEFAULT },
    { name: "Bookings", value: 350, fill: themeColors.sage.light },
    { name: "Referrals", value: 120, fill: themeColors.terracotta },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-section md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-small font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-sage" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-title font-bold">£{revenue}</div>
              <p className="text-small text-slateSoft mt-1">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-small font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-sage" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-title font-bold">{conversionRate}%</div>
              <p className="text-small text-slateSoft mt-1">Signups to bookings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-small font-medium">Wallet Credits</CardTitle>
              <Users className="h-4 w-4 text-sage" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-title font-bold">£{walletCredits}</div>
              <p className="text-small text-slateSoft mt-1">Total outstanding</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Growth Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Growth Funnel</CardTitle>
            <CardDescription>Signups → Bookings → Referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 h-64">
              {funnelData.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.value / funnelData[0].value) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: motionTokens.slow }}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      backgroundColor: item.fill,
                      height: `${(item.value / funnelData[0].value) * 100}%`,
                      minHeight: "40px",
                    }}
                  />
                  <div className="text-center">
                    <div className="font-semibold text-charcoal">{item.value}</div>
                    <div className="text-small text-slateSoft">{item.name}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Prediction Summary */}
      {summary?.growth_prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-sage/40 bg-gradient-to-br from-sage/10 to-sage/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sage" aria-hidden="true" />
                AI Growth Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-title text-charcoal">{summary.growth_prediction}</p>
              <div className="grid grid-cols-3 gap-card mt-4">
                {typeof (summary as unknown as Record<string, unknown>).revenue_growth === "number" && (
                  <div className="text-center">
                    <div className="text-title font-bold text-sage">+{(summary as unknown as Record<string, unknown>).revenue_growth as number}%</div>
                    <div className="text-small text-slateSoft">Revenue</div>
                  </div>
                )}
                {typeof (summary as unknown as Record<string, unknown>).bookings_growth === "number" && (
                  <div className="text-center">
                    <div className="text-title font-bold text-sage">+{(summary as unknown as Record<string, unknown>).bookings_growth as number}%</div>
                    <div className="text-small text-slateSoft">Bookings</div>
                  </div>
                )}
                {typeof (summary as unknown as Record<string, unknown>).signups_growth === "number" && (
                  <div className="text-center">
                    <div className="text-title font-bold text-sage">+{(summary as unknown as Record<string, unknown>).signups_growth as number}%</div>
                    <div className="text-small text-slateSoft">Signups</div>
                  </div>
                )}
              </div>
              {summary.top_provider && (
                <p className="text-small text-slateSoft mt-4">
                  Top performer: <span className="font-medium text-charcoal">{summary.top_provider}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
