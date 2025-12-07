"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { themeColors } from "@/lib/theme-colors";

const CHART_COLORS = [
  themeColors.sage.alt,
  themeColors.sage.light,
  themeColors.terracotta,
  themeColors.sage.dark,
];

interface InsightsData {
  totalNewUsers: number;
  totalBookings: number;
  confirmedBookings: number;
  totalReferrals: number;
  conversionRate: number;
  totalRewardsIssued: number;
  totalRewardsRedeemed: number;
  totalRewardsValueCents: number;
  providerMetrics: {
    totalProviders: number;
    avgRating: number;
    percentWithPhotos: number;
    percentRespondingToReviews: number;
  };
  dailyData: Array<{
    date: string;
    users: number;
    bookings: number;
  }>;
  referralConversions: {
    signup: number;
    booking: number;
  };
  topProviders: Array<{
    provider_id: number;
    provider_name: string;
    provider_slug: string | null;
    rating: number;
    review_count: number;
    growth_score: number;
    class_count: number;
    has_photo: boolean;
    created_at: string;
  }>;
}

export default function InsightsDashboardClient() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/insights");
        if (!response.ok) {
          throw new Error("Failed to fetch insights");
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
        Loading insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
        No data available
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };

  // KPI Cards
  const kpiCards = [
    {
      title: "New Users (30 days)",
      value: data.totalNewUsers.toLocaleString(),
      subtitle: "Total signups",
      color: themeColors.sage.alt,
    },
    {
      title: "Total Bookings (30 days)",
      value: data.totalBookings.toLocaleString(),
      subtitle: `${data.confirmedBookings} confirmed`,
      color: themeColors.sage.dark,
    },
    {
      title: "Referrals + Conversion",
      value: `${data.totalReferrals} (${data.conversionRate.toFixed(1)}%)`,
      subtitle: `${data.referralConversions.signup + data.referralConversions.booking} converted`,
      color: themeColors.terracotta,
    },
    {
      title: "Rewards Issued",
      value: data.totalRewardsIssued.toLocaleString(),
      subtitle: `${data.totalRewardsRedeemed} redeemed • ${formatCurrency(data.totalRewardsValueCents)}`,
      color: themeColors.charcoal.dark,
    },
  ];

  // Pie chart data for referral conversions
  const referralConversionData = [
    { name: "Signup Conversions", value: data.referralConversions.signup },
    { name: "Booking Conversions", value: data.referralConversions.booking },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
          >
            <h3 className="text-small font-medium text-slateSoft">{card.title}</h3>
            <p className="mt-2 text-display-2 font-semibold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="mt-1 text-small text-slateSoft">{card.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Daily Users & Bookings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-title font-semibold text-charcoal">Daily Users & Bookings</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.DEFAULT} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={themeColors.charcoal.dark}
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke={themeColors.charcoal.dark} style={{ fontSize: "12px" }} />
            <Tooltip
              labelFormatter={(label: unknown) => formatDate(label as string)}
              contentStyle={{
                backgroundColor: "white",
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              name="Users"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              dot={{ fill: themeColors.sage.alt, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="bookings"
              name="Bookings"
              stroke={themeColors.terracotta}
              strokeWidth={2}
              dot={{ fill: themeColors.terracotta, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Referral Conversions Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-title font-semibold text-charcoal">
          Referral Conversions: Signup vs Booking
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={referralConversionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {referralConversionData.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Providers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-title font-semibold text-charcoal">Top Providers (Growth Score)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Provider</th>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Rating</th>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Reviews</th>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Growth Score</th>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Classes</th>
                <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {data.topProviders.map((provider) => (
                <tr key={provider.provider_id} className="hover:bg-cream/50">
                  <td className="px-4 py-3 text-small font-medium text-charcoal">
                    {provider.provider_name}
                  </td>
                  <td className="px-4 py-3 text-small text-slateSoft">
                    {provider.rating > 0 ? provider.rating.toFixed(1) : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-small text-slateSoft">{provider.review_count}</td>
                  <td className="px-4 py-3 text-small font-semibold text-charcoal">
                    {provider.growth_score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-small text-slateSoft">{provider.class_count}</td>
                  <td className="px-4 py-3 text-small">
                    {provider.has_photo ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-slateSoft">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Provider Metrics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-title font-semibold text-charcoal">Provider Growth Metrics</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <div className="text-small text-slateSoft">Total Providers</div>
            <div className="mt-1 text-title font-semibold text-charcoal">
              {data.providerMetrics.totalProviders}
            </div>
          </div>
          <div>
            <div className="text-small text-slateSoft">Avg Rating</div>
            <div className="mt-1 text-title font-semibold text-charcoal">
              {data.providerMetrics.avgRating > 0
                ? data.providerMetrics.avgRating.toFixed(1)
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-small text-slateSoft">With Photos</div>
            <div className="mt-1 text-title font-semibold text-charcoal">
              {data.providerMetrics.percentWithPhotos.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-small text-slateSoft">Responding to Reviews</div>
            <div className="mt-1 text-title font-semibold text-charcoal">
              {data.providerMetrics.percentRespondingToReviews.toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

