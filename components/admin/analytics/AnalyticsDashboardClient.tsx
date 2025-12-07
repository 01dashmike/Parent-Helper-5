"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { motionTokens } from "@/lib/motion/tokens";
import { themeColors } from "@/lib/theme-colors";

interface AnalyticsData {
  activeUsers: number;
  sessions: Array<{ session_id: string; family_id: string | null }>;
  recClicks: Array<{ event_props: Record<string, unknown> }>;
  blogReads: Array<{ event_props: Record<string, unknown> }>;
  leaderboard: Array<{
    family_id: string;
    loyalty_score: number;
    visits_count: number;
    conversions: number;
    household_name: string;
  }>;
  referrals: Array<{ referrer: string }>;
}

interface AnalyticsDashboardClientProps {
  data: AnalyticsData;
}

export default function AnalyticsDashboardClient({ data }: AnalyticsDashboardClientProps) {
  // Calculate metrics
  const avgSessionsPerFamily = useMemo(() => {
    const familySessions = new Map<string, Set<string>>();
    data.sessions.forEach((s) => {
      if (s.family_id) {
        if (!familySessions.has(s.family_id)) {
          familySessions.set(s.family_id, new Set());
        }
        familySessions.get(s.family_id)!.add(s.session_id);
      }
    });
    const sessionCounts = Array.from(familySessions.values()).map((s) => s.size);
    return sessionCounts.length > 0
      ? Math.round((sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length) * 10) / 10
      : 0;
  }, [data.sessions]);

  const topCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    data.recClicks.forEach((click) => {
      const category = typeof click.event_props?.category === "string" ? click.event_props.category : "Unknown";
      categories[category] = (categories[category] || 0) + 1;
    });
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return sorted[0] || ["None", 0];
  }, [data.recClicks]);

  const topBlogPost = useMemo(() => {
    const posts: Record<string, number> = {};
    data.blogReads.forEach((read) => {
      const slug = typeof read.event_props?.slug === "string" ? read.event_props.slug : "Unknown";
      posts[slug] = (posts[slug] || 0) + 1;
    });
    const sorted = Object.entries(posts).sort((a, b) => b[1] - a[1]);
    return sorted[0] || ["None", 0];
  }, [data.blogReads]);

  const topReferrers = useMemo(() => {
    const referrers: Record<string, number> = {};
    data.referrals.forEach((ref) => {
      try {
        const url = new URL(ref.referrer);
        const domain = url.hostname.replace("www.", "");
        referrers[domain] = (referrers[domain] || 0) + 1;
      } catch {
        referrers[ref.referrer] = (referrers[ref.referrer] || 0) + 1;
      }
    });
    return Object.entries(referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [data.referrals]);

  const cards = [
    {
      title: "Active Users This Week",
      value: data.activeUsers.toLocaleString(),
      subtitle: "Users with page views",
      color: "bg-sage/15 text-sage",
    },
    {
      title: "Avg Sessions per Family",
      value: avgSessionsPerFamily.toFixed(1),
      subtitle: "Average session count",
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Most Clicked Category",
      value: topCategory[0],
      subtitle: `${topCategory[1]} clicks`,
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Top Blog Post",
      value: topBlogPost[0].slice(0, 20) + (topBlogPost[0].length > 20 ? "..." : ""),
      subtitle: `${topBlogPost[1]} reads`,
      color: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-card md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTokens.medium, delay: index * 0.05 }}
            className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
          >
            <p className="text-small font-medium text-slateSoft">{card.title}</p>
            <p className="mt-2 text-title font-bold text-charcoal">{card.value}</p>
            <p className="mt-2 text-small text-slateSoft">{card.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Loyalty Leaderboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionTokens.slow }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Loyalty Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-sage/20">
            <thead className="bg-cream/70">
              <tr>
                <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                  Family
                </th>
                <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                  Loyalty Score
                </th>
                <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                  Visits
                </th>
                <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                  Conversions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10 bg-white">
              {data.leaderboard.map((family, index) => (
                <tr key={family.family_id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 text-small font-medium text-charcoal">#{index + 1}</td>
                  <td className="px-4 py-3 text-small text-charcoal">
                    {family.household_name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-right text-small font-semibold text-charcoal">
                    {Number(family.loyalty_score).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-small text-charcoal">
                    {family.visits_count}
                  </td>
                  <td className="px-4 py-3 text-right text-small text-charcoal">
                    {family.conversions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Top Referral Sources */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionTokens.slow, delay: 0.1 }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Top Referral Sources</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topReferrers.map(([domain, count]) => ({ domain, count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.sage.alt + "40"} />
            <XAxis dataKey="domain" stroke={themeColors.charcoal.dark} fontSize={12} angle={-45} textAnchor="end" height={100} />
            <YAxis stroke={themeColors.charcoal.dark} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill={themeColors.sage.alt} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

