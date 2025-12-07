"use client";

type PremiumMetricsProps = {
  metrics: {
    periodLabel: string;
    featured: {
      activeListings: number;
      pausedListings: number;
      overCapListings: number;
      totalImpressions: number;
      totalSpendCents: number;
      totalClicks: number;
      avgDailySpendCents: number;
    };
    bookings: {
      totalBookings: number;
      confirmedBookings: number;
      cancelledBookings: number;
      pendingRequests: number;
      awaitingProviderRequests: number;
      bookingsFromUsage: number;
      totalRevenueCents: number;
      settledRevenueCents: number;
      totalRefundsCents: number;
    };
  };
};

function formatCurrency(cents: number) {
  const amount = cents / 100;
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({
  label,
  value,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        highlight ? "border-amber-200 bg-amber-50/70" : "border-sage/20 bg-white"
      }`}
    >
      <p className="text-small font-semibold uppercase tracking-wide text-slateSoft">
        {label}
      </p>
      <p className="mt-2 text-title font-semibold text-charcoal">{value}</p>
      {helper && <p className="mt-1 text-small text-charcoal/60">{helper}</p>}
    </div>
  );
}

export default function PremiumMetrics({ metrics }: PremiumMetricsProps) {
  const { featured, bookings, periodLabel } = metrics;

  return (
    <section className="mb-10 space-y-6">
      <header>
        <h2 className="text-title font-semibold text-charcoal">
          Premium Performance
        </h2>
        <p className="text-small text-slateSoft">
          {periodLabel} summarising featured boosts and booking conversions.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-small font-semibold uppercase tracking-wide text-sage">
            Featured Listings
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Active Featured Listings"
              value={featured.activeListings.toString()}
              helper={`${featured.pausedListings} paused • ${featured.overCapListings} at daily cap`}
              highlight
            />
            <StatCard
              label="Impressions"
              value={featured.totalImpressions.toLocaleString("en-GB")}
              helper={`${featured.totalClicks.toLocaleString("en-GB")} clicks`}
            />
            <StatCard
              label="Spend"
              value={formatCurrency(featured.totalSpendCents)}
              helper={`Avg ${formatCurrency(featured.avgDailySpendCents)} per day`}
            />
            <StatCard
              label="Featured Efficiency"
              value={
                featured.totalImpressions > 0
                  ? `${(featured.totalClicks / Math.max(featured.totalImpressions, 1) * 100).toFixed(1)}% CTR`
                  : "Not enough data"
              }
              helper="Click-through rate for boosted listings"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-small font-semibold uppercase tracking-wide text-sage">
            Bookings
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Confirmed Bookings"
              value={bookings.confirmedBookings.toString()}
              helper={`${bookings.totalBookings} total • ${bookings.cancelledBookings} cancelled`}
              highlight
            />
            <StatCard
              label="Pipeline"
              value={`${bookings.pendingRequests} pending`}
              helper={`${bookings.awaitingProviderRequests} awaiting provider response`}
            />
            <StatCard
              label="Net Revenue"
              value={formatCurrency(bookings.totalRevenueCents - bookings.totalRefundsCents)}
              helper={`Gross ${formatCurrency(bookings.totalRevenueCents)} • Refunds ${formatCurrency(bookings.totalRefundsCents)}`}
            />
            <StatCard
              label="Bookings From Featured"
              value={bookings.bookingsFromUsage.toString()}
              helper={`Matched revenue ${formatCurrency(bookings.settledRevenueCents)}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

