"use client";

import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { Chart } from "@/components/icons";

interface KPIs {
  referral_conversion_rate: number;
  avg_wallet_balance: number;
  revenue_growth_rate: number;
  email_open_rate: number;
  email_click_rate: number;
}

interface GrowthKpiCardsProps {
  kpis: KPIs;
  metrics: Array<{
    week: string;
    active_users: number;
    total_revenue: number;
    wallet_credits: number;
    total_referrals: number;
    conversions: number;
    emails_sent: number;
    emails_opened: number;
  }>;
}

export default function GrowthKpiCards({ kpis, metrics }: GrowthKpiCardsProps) {
  const thisWeek = metrics[0];
  const totalActiveUsers = metrics.reduce((sum, m) => sum + (m.active_users || 0), 0);
  const totalRevenue = metrics.reduce((sum, m) => sum + (m.total_revenue || 0), 0);
  const totalWalletCredits = metrics.reduce((sum, m) => sum + (m.wallet_credits || 0), 0);

  const cards = [
    {
      title: "Active Users",
      value: thisWeek?.active_users?.toLocaleString() || "0",
      subtitle: `${totalActiveUsers.toLocaleString()} total`,
      color: "bg-sage/15 text-sage",
    },
    {
      title: "Total Revenue",
      value: `£${totalRevenue.toFixed(2)}`,
      subtitle: `£${(thisWeek?.total_revenue || 0).toFixed(2)} this week`,
      color: "bg-green-100 text-green-800",
      trend: kpis.revenue_growth_rate > 0 ? "+" : "",
      trendValue: `${kpis.revenue_growth_rate.toFixed(1)}%`,
    },
    {
      title: "Wallet Credits Issued",
      value: `£${totalWalletCredits.toFixed(2)}`,
      subtitle: `£${(thisWeek?.wallet_credits || 0).toFixed(2)} this week`,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Referral Conversion",
      value: `${kpis.referral_conversion_rate.toFixed(1)}%`,
      subtitle: `${thisWeek?.conversions || 0} of ${thisWeek?.total_referrals || 0} converted`,
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Avg Wallet Balance",
      value: `£${kpis.avg_wallet_balance.toFixed(2)}`,
      subtitle: "Per active user",
      color: "bg-amber-100 text-amber-800",
    },
    {
      title: "Email Open Rate",
      value: `${kpis.email_open_rate.toFixed(1)}%`,
      subtitle: `${kpis.email_click_rate.toFixed(1)}% click rate`,
      color: "bg-pink-100 text-pink-800",
    },
  ];

  return (
    <div className="grid-responsive gap-card">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.medium, delay: index * 0.05 }}
          className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-small font-medium text-slateSoft">{card.title}</p>
              <p className="mt-2 text-title font-bold text-charcoal">{card.value}</p>
              {card.trend && (
                <p className="mt-1 text-small font-semibold text-green-600">
                  {card.trend}{card.trendValue}
                </p>
              )}
              <p className="mt-2 text-small text-slateSoft">{card.subtitle}</p>
            </div>
            <div className={`rounded-full ${card.color} p-3`}>
              <Chart size={24} className="h-6 w-6" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

