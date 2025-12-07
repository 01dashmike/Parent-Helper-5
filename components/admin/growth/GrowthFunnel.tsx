"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";

interface GrowthFunnelProps {
  metrics: Array<{
    active_users: number;
    total_revenue: number;
    total_referrals: number;
    conversions: number;
  }>;
}

export default function GrowthFunnel({ metrics }: GrowthFunnelProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  // Aggregate totals - use latest week for most accurate funnel
  const funnelSteps = useMemo(() => {
    const latestWeek = metrics[0] || {};
    const totalSignups = latestWeek.active_users || 0;
    const totalBookings = latestWeek.total_revenue > 0 ? Math.ceil(latestWeek.total_revenue / 10) : 0; // Estimate bookings from revenue
    const totalReferrals = latestWeek.total_referrals || 0;
    const totalConversions = latestWeek.conversions || 0;

    return [
      {
        label: "Signups",
        value: totalSignups,
        color: "bg-sage",
        width: 100,
      },
      {
        label: "Bookings",
        value: totalBookings,
        color: "bg-sage/80",
        width: totalSignups > 0 ? (totalBookings / totalSignups) * 100 : 0,
      },
      {
        label: "Referrals",
        value: totalReferrals,
        color: "bg-sage/60",
        width: totalBookings > 0 ? (totalReferrals / totalBookings) * 100 : 0,
      },
      {
        label: "Conversions",
        value: totalConversions,
        color: "bg-terracotta",
        width: totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0,
      },
    ];
  }, [metrics]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionTokens.slow }}
      className="rounded-2xl border border-sage/20 bg-white p-6"
    >
      <h3 className="mb-6 text-title font-semibold text-charcoal">Growth Funnel</h3>
      <div className="space-y-4">
        {funnelSteps.map((step, index) => {
          const prevStep = index > 0 ? funnelSteps[index - 1] : null;
          const dropoff = prevStep
            ? prevStep.value > 0
              ? ((prevStep.value - step.value) / prevStep.value) * 100
              : 0
            : 0;

          return (
            <div key={step.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-small font-medium text-charcoal">{step.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-small font-semibold text-charcoal">
                    {step.value.toLocaleString()}
                  </span>
                  {prevStep && (
                    <span className="text-small text-slateSoft">
                      {dropoff.toFixed(1)}% drop-off
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-12 overflow-hidden rounded-lg bg-cream/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: animated ? `${step.width}%` : 0 }}
                  transition={{ duration: motionTokens.slow, delay: index * 0.1 }}
                  className={`h-full ${step.color} flex items-center justify-end pr-4`}
                >
                  {animated && step.width > 10 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      className="text-small font-semibold text-white"
                    >
                      {step.width.toFixed(1)}%
                    </motion.span>
                  )}
                </motion.div>
              </div>
              {index < funnelSteps.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: animated ? 1 : 0 }}
                  transition={{ duration: motionTokens.medium, delay: index * 0.1 + 0.4 }}
                  className="mx-auto h-6 w-0.5 bg-sage/30"
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

