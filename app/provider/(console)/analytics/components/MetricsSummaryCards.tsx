"use client";

import { memo, useMemo, useCallback } from "react";

type Metrics = {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  revenue_last_7_days: number;
  revenue_last_30_days: number;
  average_rating: number;
  review_count: number;
  total_classes: number;
  active_classes: number;
};

const MetricsSummaryCards = memo(function MetricsSummaryCards({ metrics }: { metrics: Metrics }) {
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  }, []);

  // Memoize formatted values
  const formattedRevenue = useMemo(() => formatCurrency(metrics.total_revenue), [metrics.total_revenue, formatCurrency]);
  const formattedRevenue30Days = useMemo(() => formatCurrency(metrics.revenue_last_30_days), [metrics.revenue_last_30_days, formatCurrency]);
  const formattedRating = useMemo(() => metrics.average_rating > 0 ? metrics.average_rating.toFixed(1) : "—", [metrics.average_rating]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
        <p className="text-small uppercase tracking-wide text-sage/70">Total Bookings</p>
        <p className="mt-2 text-display-2 font-semibold text-charcoal">{metrics.total_bookings}</p>
        <p className="mt-1 text-small text-charcoal/70">
          {metrics.confirmed_bookings} confirmed, {metrics.cancelled_bookings} cancelled
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
        <p className="text-small uppercase tracking-wide text-sage/70">Total Revenue</p>
        <p className="mt-2 text-display-2 font-semibold text-charcoal">
          {formattedRevenue}
        </p>
        <p className="mt-1 text-small text-charcoal/70">
          {formattedRevenue30Days} last 30 days
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
        <p className="text-small uppercase tracking-wide text-sage/70">Average Rating</p>
        <p className="mt-2 text-display-2 font-semibold text-charcoal">
          {formattedRating}
        </p>
        <p className="mt-1 text-small text-charcoal/70">
          {metrics.review_count} {metrics.review_count === 1 ? "review" : "reviews"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
        <p className="text-small uppercase tracking-wide text-sage/70">Active Classes</p>
        <p className="mt-2 text-display-2 font-semibold text-charcoal">{metrics.active_classes}</p>
        <p className="mt-1 text-small text-charcoal/70">
          {metrics.total_classes} total classes
        </p>
      </div>
    </div>
  );
});

MetricsSummaryCards.displayName = "MetricsSummaryCards";

export default MetricsSummaryCards;

