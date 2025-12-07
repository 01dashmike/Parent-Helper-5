"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

interface ReferralAnalytics {
  total_referrals_sent: number;
  total_conversions: number;
  conversion_rate: number;
  referrals_by_type: {
    member: number;
    provider: number;
  };
  top_referrers: Array<{
    user_id: string;
    referrals_sent: number;
    conversions: number;
    conversion_rate: number;
  }>;
  coupon_usage: {
    total_redeemed: number;
    total_available: number;
    total_pending: number;
    coupons_with_stripe_id: number;
  };
  trend_data: Array<{
    date: string;
    member: number;
    provider: number;
    total: number;
  }>;
  provider_metrics?: {
    total_provider_referrals: number;
    provider_referral_conversions: number;
    provider_referral_conversion_rate: number;
    provider_reward_coupons_issued: number;
  };
  provider_leaderboard?: Array<{
    provider_id: number;
    provider_name: string;
    provider_slug: string;
    referrals_sent: number;
    conversions: number;
    conversion_rate: number;
  }>;
  provider_coupon_usage?: {
    redeemed: number;
    available: number;
    expired: number;
  };
}

export default function ReferralsDashboardClient() {
  const [data, setData] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/referrals");
        if (!response.ok) {
          throw new Error("Failed to fetch referral analytics");
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
        Loading referral analytics...
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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };

  // Prepare pie chart data
  const referralsByTypeData = [
    { name: "Member", value: data.referrals_by_type.member },
    { name: "Provider", value: data.referrals_by_type.provider },
  ];

  // Prepare coupon usage data
  const couponUsageData = [
    { name: "Redeemed", value: data.coupon_usage.total_redeemed },
    { name: "Available", value: data.coupon_usage.total_available },
    { name: "Pending", value: data.coupon_usage.total_pending },
  ];

  // Prepare provider coupon usage data
  const providerCouponUsageData = data.provider_coupon_usage
    ? [
        { name: "Redeemed", value: data.provider_coupon_usage.redeemed },
        { name: "Available", value: data.provider_coupon_usage.available },
        { name: "Expired", value: data.provider_coupon_usage.expired },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-small font-medium text-slateSoft">Total Referrals Sent</h3>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">{data.total_referrals_sent}</p>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-small font-medium text-slateSoft">Total Conversions</h3>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">{data.total_conversions}</p>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-small font-medium text-slateSoft">Conversion Rate</h3>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">
            {data.conversion_rate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-small font-medium text-slateSoft">Coupons Redeemed</h3>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">
            {data.coupon_usage.total_redeemed}
          </p>
        </div>
      </div>

      {/* Provider-Specific KPIs */}
      {data.provider_metrics && (
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Provider Referral Metrics</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-cream p-4">
              <h3 className="text-small font-medium text-slateSoft">Total Provider Referrals</h3>
              <p className="mt-1 text-title font-semibold text-charcoal">
                {data.provider_metrics.total_provider_referrals}
              </p>
            </div>
            <div className="rounded-lg bg-cream p-4">
              <h3 className="text-small font-medium text-slateSoft">Provider Conversions</h3>
              <p className="mt-1 text-title font-semibold text-charcoal">
                {data.provider_metrics.provider_referral_conversions}
              </p>
            </div>
            <div className="rounded-lg bg-cream p-4">
              <h3 className="text-small font-medium text-slateSoft">Provider Conversion Rate</h3>
              <p className="mt-1 text-title font-semibold text-charcoal">
                {data.provider_metrics.provider_referral_conversion_rate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-cream p-4">
              <h3 className="text-small font-medium text-slateSoft">Provider Coupons Issued</h3>
              <p className="mt-1 text-title font-semibold text-charcoal">
                {data.provider_metrics.provider_reward_coupons_issued}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="rounded-2xl border border-sage/20 bg-white p-6">
        <h2 className="mb-4 text-title font-semibold text-charcoal">Referrals Over Time (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.trend_data}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.light} />
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
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.light}`,
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              name="Total"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="member"
              stroke={themeColors.sage.light}
              strokeWidth={2}
              name="Member"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="provider"
              stroke={themeColors.terracotta}
              strokeWidth={2}
              name="Provider"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Referrals by Type */}
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Referrals by Type</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={referralsByTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill={themeColors.purple[500]}
                dataKey="value"
              >
                {referralsByTypeData.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Coupon Usage */}
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Member Coupon Usage Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={couponUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.light} />
              <XAxis dataKey="name" stroke={themeColors.charcoal.dark} style={{ fontSize: "12px" }} />
              <YAxis stroke={themeColors.charcoal.dark} style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeColors.cream.DEFAULT,
                  border: `1px solid ${themeColors.sage.light}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill={themeColors.sage.alt} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider Coupon Usage Chart */}
      {data.provider_coupon_usage && providerCouponUsageData.length > 0 && (
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Provider Coupon Usage Breakdown</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={providerCouponUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.light} />
                <XAxis dataKey="name" stroke={themeColors.charcoal.dark} style={{ fontSize: "12px" }} />
                <YAxis stroke={themeColors.charcoal.dark} style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeColors.cream.DEFAULT,
                    border: `1px solid ${themeColors.sage.light}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill={themeColors.terracotta} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-4">
              <div className="rounded-lg bg-cream p-4">
                <p className="text-small text-slateSoft">Redeemed</p>
                <p className="mt-1 text-title font-semibold text-charcoal">
                  {data.provider_coupon_usage.redeemed}
                </p>
              </div>
              <div className="rounded-lg bg-cream p-4">
                <p className="text-small text-slateSoft">Available</p>
                <p className="mt-1 text-title font-semibold text-charcoal">
                  {data.provider_coupon_usage.available}
                </p>
              </div>
              <div className="rounded-lg bg-cream p-4">
                <p className="text-small text-slateSoft">Expired</p>
                <p className="mt-1 text-title font-semibold text-charcoal">
                  {data.provider_coupon_usage.expired}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboards Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Referrers Leaderboard (Member) */}
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold text-charcoal">Top Member Referrers</h2>
          {data.top_referrers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage/20">
                    <th className="px-4 py-3 text-left text-small font-medium text-slateSoft">User ID</th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Referrals Sent
                    </th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Conversions
                    </th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_referrers.map((referrer, _index) => (
                    <tr
                      key={referrer.user_id}
                      className="border-b border-sage/10 last:border-0 hover:bg-cream/50"
                    >
                      <td className="px-4 py-3 text-small text-charcoal">
                        {referrer.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-right text-small text-charcoal">
                        {referrer.referrals_sent}
                      </td>
                      <td className="px-4 py-3 text-right text-small text-charcoal">
                        {referrer.conversions}
                      </td>
                      <td className="px-4 py-3 text-right text-small font-medium text-charcoal">
                        {referrer.conversion_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-slateSoft">No referrer data available</p>
          )}
        </div>

        {/* Provider Leaderboard */}
        {data.provider_leaderboard && data.provider_leaderboard.length > 0 && (
          <div className="rounded-2xl border border-sage/20 bg-white p-6">
            <h2 className="mb-4 text-title font-semibold text-charcoal">Provider Referral Leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage/20">
                    <th className="px-4 py-3 text-left text-small font-medium text-slateSoft">Provider</th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Referrals Sent
                    </th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Conversions
                    </th>
                    <th className="px-4 py-3 text-right text-small font-medium text-slateSoft">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.provider_leaderboard.map((provider) => (
                    <tr
                      key={provider.provider_id}
                      className="border-b border-sage/10 last:border-0 hover:bg-cream/50"
                    >
                      <td className="px-4 py-3 text-small text-charcoal">
                        {provider.provider_name}
                      </td>
                      <td className="px-4 py-3 text-right text-small text-charcoal">
                        {provider.referrals_sent}
                      </td>
                      <td className="px-4 py-3 text-right text-small text-charcoal">
                        {provider.conversions}
                      </td>
                      <td className="px-4 py-3 text-right text-small font-medium text-charcoal">
                        {provider.conversion_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Coupon Usage Metrics */}
      <div className="rounded-2xl border border-sage/20 bg-white p-6">
        <h2 className="mb-4 text-title font-semibold text-charcoal">Referral Coupon Usage Metrics</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-cream p-4">
            <p className="text-small text-slateSoft">Total Redeemed</p>
            <p className="mt-1 text-title font-semibold text-charcoal">
              {data.coupon_usage.total_redeemed}
            </p>
          </div>
          <div className="rounded-lg bg-cream p-4">
            <p className="text-small text-slateSoft">Available</p>
            <p className="mt-1 text-title font-semibold text-charcoal">
              {data.coupon_usage.total_available}
            </p>
          </div>
          <div className="rounded-lg bg-cream p-4">
            <p className="text-small text-slateSoft">Pending</p>
            <p className="mt-1 text-title font-semibold text-charcoal">
              {data.coupon_usage.total_pending}
            </p>
          </div>
          <div className="rounded-lg bg-cream p-4">
            <p className="text-small text-slateSoft">With Stripe ID</p>
            <p className="mt-1 text-title font-semibold text-charcoal">
              {data.coupon_usage.coupons_with_stripe_id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

