"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

// Brand colors
const COLORS = {
  sage: "#9BAE82",
  sageLight: "#A8B8A8",
  sageDark: "#7C8F67",
  terracotta: "#C97C5C",
  cream: "#F5F3F0",
  charcoal: "#3D3D3D",
};

const CHART_COLORS = [
  COLORS.sage,
  COLORS.sageLight,
  COLORS.terracotta,
  COLORS.sageDark,
  "#B8C9A8",
  "#8FA97C",
];

interface AnalyticsEvent {
  id: string;
  event_type: string;
  payload: any;
  created_at: string;
}

interface InsightsDashboardProps {
  events: AnalyticsEvent[];
}

export default function InsightsDashboard({ events }: InsightsDashboardProps) {
  const [lastUpdated] = useState(new Date());

  // Calculate time since last update
  const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);

  // Aggregate data
  const insights = useMemo(() => {
    // Top searched categories
    const categories: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const blogPosts: Record<string, { title: string; count: number }> = {};
    const dailySearches: Record<string, number> = {};
    let totalMapInteractions = 0;
    let uniqueSessions = new Set<string>();

    events.forEach((event) => {
      const { event_type, payload, created_at } = event;
      
      // Track unique sessions
      if (payload.sessionId) {
        uniqueSessions.add(payload.sessionId);
      }

      // Track searches
      if (event_type === "search") {
        if (payload.category) {
          categories[payload.category] = (categories[payload.category] || 0) + 1;
        }
        if (payload.location) {
          locations[payload.location] = (locations[payload.location] || 0) + 1;
        }

        // Daily searches
        const date = new Date(created_at).toLocaleDateString();
        dailySearches[date] = (dailySearches[date] || 0) + 1;
      }

      // Track blog views
      if (event_type === "blog_view") {
        const slug = payload.slug;
        if (slug) {
          if (!blogPosts[slug]) {
            blogPosts[slug] = { title: payload.title || slug, count: 0 };
          }
          blogPosts[slug].count++;
        }
      }

      // Track map interactions
      if (event_type === "map_interaction") {
        totalMapInteractions++;
      }
    });

    // Top 10 categories
    const topCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // Top 10 locations
    const topLocations = Object.entries(locations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // Top 10 blog posts
    const topBlogPosts = Object.entries(blogPosts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([slug, data]) => ({
        name: data.title,
        value: data.count,
      }));

    // Daily search trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString();
    });

    const searchTrend = last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
      searches: dailySearches[date] || 0,
    }));

    // Average map interactions per session
    const avgMapInteractions =
      uniqueSessions.size > 0
        ? (totalMapInteractions / uniqueSessions.size).toFixed(1)
        : "0";

    return {
      topCategories,
      topLocations,
      topBlogPosts,
      searchTrend,
      totalEvents: events.length,
      uniqueSessions: uniqueSessions.size,
      avgMapInteractions,
    };
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={insights.totalEvents.toLocaleString()}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Unique Sessions"
          value={insights.uniqueSessions.toLocaleString()}
          subtitle="Anonymous visitors"
        />
        <StatCard
          title="Map Interactions"
          value={insights.avgMapInteractions}
          subtitle="Per session avg"
        />
        <StatCard
          title="Last Updated"
          value={minutesAgo === 0 ? "Just now" : `${minutesAgo}m ago`}
          subtitle={lastUpdated.toLocaleTimeString()}
        />
      </div>

      {/* Daily Search Trend */}
      <ChartCard title="Search Activity (Last 7 Days)">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={insights.searchTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
            <XAxis
              dataKey="date"
              stroke={COLORS.charcoal}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={COLORS.charcoal} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.cream,
                border: `1px solid ${COLORS.sage}`,
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="searches"
              stroke={COLORS.sage}
              strokeWidth={3}
              dot={{ fill: COLORS.sage, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <ChartCard title="Top 10 Searched Categories">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
              <XAxis
                dataKey="name"
                stroke={COLORS.charcoal}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={COLORS.charcoal} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.cream,
                  border: `1px solid ${COLORS.sage}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill={COLORS.sage} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Locations */}
        <ChartCard title="Most Active Towns">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insights.topLocations}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {insights.topLocations.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.cream,
                  border: `1px solid ${COLORS.sage}`,
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Blog Posts */}
        <ChartCard title="Most Read Blog Posts">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.topBlogPosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
              <XAxis type="number" stroke={COLORS.charcoal} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={COLORS.charcoal}
                fontSize={11}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: COLORS.cream,
                  border: `1px solid ${COLORS.sage}`,
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="value"
                fill={COLORS.terracotta}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Privacy Notice */}
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-3">
            🔒 Privacy-First Analytics
          </h3>
          <ul className="space-y-2 text-sm text-slateSoft">
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>No personal data collected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>No cookies used (localStorage only)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>Anonymous session IDs only</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>90-day automatic data deletion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>Fully GDPR compliant</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-slateSoft mb-1">{title}</p>
      <p className="text-3xl font-bold text-charcoal mb-1">{value}</p>
      <p className="text-xs text-slateSoft">{subtitle}</p>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-charcoal mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}


