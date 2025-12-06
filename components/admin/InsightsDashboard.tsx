"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
import { motionTokens } from "@/lib/motion/tokens";
import { formatMonthDay, formatDate } from "@/lib/utils/date";
import { themeColors } from "@/lib/theme-colors";

const CHART_COLORS = [
  themeColors.sage.alt,
  themeColors.sage.light,
  themeColors.terracotta,
  themeColors.sage.dark,
  themeColors.sage.lighter,
  themeColors.sage.lightest,
];

interface AnalyticsEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface InsightsDashboardProps {
  events: AnalyticsEvent[];
}

export default function InsightsDashboard({ events }: InsightsDashboardProps) {
  // Use lazy initialization to prevent hydration mismatches (server/client time differences)
  const [lastUpdated] = useState(() => new Date());

  // Calculate time since last update
  const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);

  // Aggregate data
  const insights = useMemo(() => {
    const categories: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const blogPosts: Record<string, { title: string; count: number }> = {};
    const dailySearches: Record<string, number> = {};
    const weeklyEngagementMap = new Map<
      string,
      {
        label: string;
        startTimestamp: number;
        searches: number;
        classViews: number;
        providerSignups: number;
        mapInteractions: number;
      }
    >();
    let totalMapInteractions = 0;
    const uniqueSessions = new Set<string>();
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let searchesLast7Days = 0;
    let classViewsLast7Days = 0;
    let providerSignupsLast7Days = 0;

    const getStartOfWeek = (date: Date) => {
      const monday = new Date(date);
      const day = monday.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(monday.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const bumpWeekly = (
      date: Date,
      field: "searches" | "classViews" | "providerSignups" | "mapInteractions",
    ) => {
      const startOfWeek = getStartOfWeek(date);
      const weekKey = startOfWeek.toISOString().slice(0, 10);
      const entry =
        weeklyEngagementMap.get(weekKey) ||
        {
          label: formatMonthDay(startOfWeek),
          startTimestamp: startOfWeek.getTime(),
          searches: 0,
          classViews: 0,
          providerSignups: 0,
          mapInteractions: 0,
        };

      entry[field] += 1;
      weeklyEngagementMap.set(weekKey, entry);
    };

    if (!Array.isArray(events)) {
      // Return empty insights if events is not an array
      return {
        topCategories: [],
        topLocations: [],
        topBlogPosts: [],
        searchTrend: [],
        weeklyEngagement: [],
        totalEvents: 0,
        uniqueSessions: 0,
        avgMapInteractions: "0",
        searchesLast7Days: 0,
        classViewsLast7Days: 0,
        providerSignupsLast7Days: 0,
      };
    }
    
    events.forEach((event) => {
      const { event_type, payload, created_at } = event;
      const eventDate = created_at ? new Date(created_at) : new Date();
      const isoDate = eventDate.toISOString().slice(0, 10);

      if (payload?.sessionId && typeof payload.sessionId === "string") {
        uniqueSessions.add(payload.sessionId);
      }

      if (event_type === "search" || event_type === "search_performed") {
        if (payload?.category && typeof payload.category === "string") {
          categories[payload.category] = (categories[payload.category] || 0) + 1;
        }
        if (payload?.location && typeof payload.location === "string") {
          locations[payload.location] = (locations[payload.location] || 0) + 1;
        }
        dailySearches[isoDate] = (dailySearches[isoDate] || 0) + 1;

        if (eventDate >= sevenDaysAgo) {
          searchesLast7Days += 1;
        }

        bumpWeekly(eventDate, "searches");
      }

      if (
        event_type === "class_viewed" ||
        (event_type === "class_interaction" && payload?.action === "view")
      ) {
        if (eventDate >= sevenDaysAgo) {
          classViewsLast7Days += 1;
        }

        bumpWeekly(eventDate, "classViews");
      }

      if (event_type === "provider_signup_submitted") {
        if (eventDate >= sevenDaysAgo) {
          providerSignupsLast7Days += 1;
        }

        bumpWeekly(eventDate, "providerSignups");
      }

      if (event_type === "blog_view") {
        const slug = payload?.slug;
        if (slug && typeof slug === "string") {
          const title = payload?.title && typeof payload.title === "string" ? payload.title : slug;
          if (!blogPosts[slug]) {
            blogPosts[slug] = { title, count: 0 };
          }
          blogPosts[slug].count += 1;
        }
      }

      if (event_type === "map_interaction") {
        totalMapInteractions += 1;
        bumpWeekly(eventDate, "mapInteractions");
      }
    });

    const topCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const topLocations = Object.entries(locations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const topBlogPosts = Object.entries(blogPosts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([_slug, data]) => ({
        name: data.title,
        value: data.count,
      }));

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const searchTrend = last7Days.map((date) => ({
      date: formatMonthDay(date),
      searches: dailySearches[date.toISOString().slice(0, 10)] || 0,
    }));

    const weeklyEngagement = Array.from(weeklyEngagementMap.values())
      .sort((a, b) => a.startTimestamp - b.startTimestamp)
      .slice(-8)
      .map((entry) => ({
        label: entry.label,
        searches: entry.searches,
        classViews: entry.classViews,
        providerSignups: entry.providerSignups,
        mapInteractions: entry.mapInteractions,
      }));

    const avgMapInteractions =
      uniqueSessions.size > 0
        ? (totalMapInteractions / uniqueSessions.size).toFixed(1)
        : "0";

    return {
      topCategories,
      topLocations,
      topBlogPosts,
      searchTrend,
      weeklyEngagement,
      totalEvents: Array.isArray(events) ? events.length : 0,
      uniqueSessions: uniqueSessions.size,
      avgMapInteractions,
      searchesLast7Days,
      classViewsLast7Days,
      providerSignupsLast7Days,
    };
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.slow }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-card md:grid-cols-4">
        <StatCard
          title="Searches (7 days)"
          value={insights.searchesLast7Days.toLocaleString()}
          subtitle="Organic + keyword queries"
        />
        <StatCard
          title="Class Views (7 days)"
          value={insights.classViewsLast7Days.toLocaleString()}
          subtitle="Result opens from search"
        />
        <StatCard
          title="Provider Signups (7 days)"
          value={insights.providerSignupsLast7Days.toLocaleString()}
          subtitle="Completed onboarding submissions"
        />
        <StatCard
          title="Unique Sessions (30 days)"
          value={insights.uniqueSessions.toLocaleString()}
          subtitle={`Map interactions / session: ${insights.avgMapInteractions}`}
        />
      </div>
      <p className="text-small text-slateSoft">
        Data refreshed {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`} •{" "}
        {formatDate(lastUpdated, "time")}
      </p>

      {/* Daily Search Trend */}
      <ChartCard title="Search Activity (Last 7 Days)">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={insights.searchTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.lighter} />
            <XAxis
              dataKey="date"
              stroke={themeColors.charcoal.dark}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="searches"
              stroke={themeColors.sage.alt}
              strokeWidth={3}
              dot={{ fill: themeColors.sage.alt, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Weekly Engagement */}
      <ChartCard title="Weekly Engagement (Last 8 Weeks)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={insights.weeklyEngagement}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.lighter} />
            <XAxis
              dataKey="label"
              stroke={themeColors.charcoal.dark}
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="searches"
              name="Searches"
              fill={themeColors.sage.alt}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="classViews"
              name="Class views"
              fill={themeColors.terracotta}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="providerSignups"
              name="Provider signups"
              fill={themeColors.sage.dark}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="mapInteractions"
              name="Map interactions"
              fill={themeColors.sage.lighter}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        {/* Top Categories */}
        <ChartCard title="Top 10 Searched Categories">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.lighter} />
              <XAxis
                dataKey="name"
                stroke={themeColors.charcoal.dark}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={themeColors.charcoal.dark} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeColors.cream.DEFAULT,
                  border: `1px solid ${themeColors.sage.alt}`,
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill={themeColors.sage.alt} radius={[8, 8, 0, 0]} />
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
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill={themeColors.purple[500]}
                dataKey="value"
              >
                {insights.topLocations.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: themeColors.cream.DEFAULT,
                  border: `1px solid ${themeColors.sage.alt}`,
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
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.lighter} />
              <XAxis type="number" stroke={themeColors.charcoal.dark} fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={themeColors.charcoal.dark}
                fontSize={11}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeColors.cream.DEFAULT,
                  border: `1px solid ${themeColors.sage.alt}`,
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="value"
                fill={themeColors.terracotta}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Privacy Notice */}
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h3 className="text-title font-semibold text-charcoal mb-3">
            🔒 Privacy-First Analytics
          </h3>
          <ul className="space-y-2 text-small text-slateSoft">
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
      transition={{ duration: motionTokens.medium }}
      className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
    >
      <p className="text-small text-slateSoft mb-1">{title}</p>
      <p className="text-display-2 font-bold text-charcoal mb-1">{value}</p>
      <p className="text-small text-slateSoft">{subtitle}</p>
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
      transition={{ duration: motionTokens.slow }}
      className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
    >
      <h2 className="text-title font-semibold text-charcoal mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}


