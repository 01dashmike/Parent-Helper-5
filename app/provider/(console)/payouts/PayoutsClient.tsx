"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Calendar, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/emptystate";
import { ErrorState } from "@/components/ui/errorstate";

type PayoutData = {
  payout: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrival_date: number;
    created: number;
    description: string | null;
  };
  balanceTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    net: number;
    fee: number;
    currency: string;
    created: number;
    description: string | null;
    source: string | null;
    bookingIds: number[];
  }>;
  bookings: Array<{
    id: number;
    parent_name: string;
    parent_email: string;
    child_name: string;
    total_paid: string;
    session_date: string;
    confirmation_code: string;
    created_at: string;
  }>;
};

type PayoutsResponse = {
  summary: {
    totalGross: number;
    totalFees: number;
    totalNet: number;
    lastPayout: {
      id: string;
      amount: number;
      currency: string;
      arrival_date: number;
    } | null;
    payoutCount: number;
  };
  payouts: PayoutData[];
  dateRange: {
    from: string;
    to: string;
  };
};

export default function PayoutsClient({ providerId: _providerId }: { providerId: number }) {
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Set default dates (last month)
  useEffect(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    setFromDate(format(lastMonthStart, "yyyy-MM-dd"));
    setToDate(format(lastMonthEnd, "yyyy-MM-dd"));
  }, []);

  const fetchPayouts = async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/provider/payouts?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch payouts");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) {
      fetchPayouts();
    }
  }, [fromDate, toDate]);

  const formatCurrency = (amountCents: number, currency: string = "gbp") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "dd MMM yyyy");
  };

  const exportToCSV = () => {
    if (!data) return;

    const rows: string[] = [];
    
    // Header
    rows.push("Payout ID,Arrival Date,Amount,Currency,Status,Transaction ID,Transaction Type,Net Amount,Fee,Booking ID,Parent Name,Child Name,Total Paid,Session Date");

    // Data rows
    (data.payouts || []).forEach((payoutData) => {
      const payout = payoutData.payout;
      const bookings = payoutData.bookings || [];
      const balanceTransactions = payoutData.balanceTransactions || [];
      
      if (bookings.length === 0) {
        // Payout row without bookings
        balanceTransactions.forEach((tx) => {
          rows.push(
            [
              payout.id,
              formatDate(payout.arrival_date),
              (payout.amount / 100).toFixed(2),
              payout.currency.toUpperCase(),
              payout.status,
              tx.id,
              tx.type,
              (tx.net / 100).toFixed(2),
              (tx.fee / 100).toFixed(2),
              "",
              "",
              "",
              "",
              "",
            ].join(",")
          );
        });
      } else {
        // Rows with bookings
        bookings.forEach((booking) => {
          const relatedTx = balanceTransactions.find((tx) =>
            tx.bookingIds?.includes(booking.id)
          ) || balanceTransactions[0];

          rows.push(
            [
              payout.id,
              formatDate(payout.arrival_date),
              (payout.amount / 100).toFixed(2),
              payout.currency.toUpperCase(),
              payout.status,
              relatedTx.id,
              relatedTx.type,
              (relatedTx.net / 100).toFixed(2),
              (relatedTx.fee / 100).toFixed(2),
              booking.id.toString(),
              booking.parent_name,
              booking.child_name,
              booking.total_paid,
              format(new Date(booking.session_date), "dd MMM yyyy"),
            ].join(",")
          );
        });
      }
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 motion-safe:animate-spin motion-reduce:animate-none text-sage" aria-hidden="true" />
        <span className="sr-only">Loading payouts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-2 font-semibold text-charcoal">Payout Reconciliation</h1>
          <p className="mt-1 text-small text-charcoal/70">
            Reconcile your Stripe payouts with bookings
          </p>
        </div>
        {data && data.payouts.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-md border border-sage/30 bg-white px-4 py-2 text-small font-medium text-charcoal transition hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        )}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
        <Calendar className="h-5 w-5 text-sage/70" aria-hidden="true" />
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-small font-medium text-charcoal/70">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 rounded-md border border-sage/30 px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal/70">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 rounded-md border border-sage/30 px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            fetchPayouts();
          }}
          size="sm"
        />
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
              <p className="text-small uppercase tracking-wide text-charcoal/80">Total Gross</p>
              <p className="mt-2 text-display-2 font-semibold text-charcoal">
                {formatCurrency(data.summary?.totalGross || 0)}
              </p>
              <p className="mt-1 text-small text-charcoal/70">
                {data.summary?.payoutCount || 0} {(data.summary?.payoutCount || 0) === 1 ? "payout" : "payouts"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
              <p className="text-small uppercase tracking-wide text-charcoal/80">Total Fees</p>
              <p className="mt-2 text-display-2 font-semibold text-charcoal">
                {formatCurrency(data.summary?.totalFees || 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
              <p className="text-small uppercase tracking-wide text-charcoal/80">Total Net</p>
              <p className="mt-2 text-display-2 font-semibold text-charcoal">
                {formatCurrency(data.summary?.totalNet || 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
              <p className="text-small uppercase tracking-wide text-charcoal/80">Last Payout</p>
              <p className="mt-2 text-display-2 font-semibold text-charcoal">
                {data.summary?.lastPayout
                  ? formatCurrency(data.summary.lastPayout.amount, data.summary.lastPayout.currency)
                  : "—"}
              </p>
              {data.summary?.lastPayout && (
                <p className="mt-1 text-small text-charcoal/70">
                  {formatDate(data.summary.lastPayout.arrival_date)}
                </p>
              )}
            </div>
          </div>

          {/* Payouts Table */}
          {!data.payouts || data.payouts.length === 0 ? (
            <EmptyState
              title="No payouts found"
              description="No payouts found for the selected date range. Try adjusting your filters or check back later."
              iconVariant="inbox"
            />
          ) : (
            <div className="space-y-6">
              {(data.payouts || []).map((payoutData) => {
                const payout = payoutData.payout;
                const bookings = payoutData.bookings || [];
                const totalBookings = bookings.length;
                const totalBookingAmount = bookings.reduce(
                  (sum, b) => sum + parseFloat(b.total_paid || "0"),
                  0
                );

                return (
                  <div
                    key={payout.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-soft"
                  >
                    {/* Payout Header */}
                    <div className="border-b border-sage/20 bg-sage/5 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-title font-semibold text-charcoal">
                            Payout {payout.id.slice(-8)}
                          </h2>
                          <p className="mt-1 text-small text-charcoal/70">
                            Arrival: {formatDate(payout.arrival_date)} • Created:{" "}
                            {formatDate(payout.created)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-display-2 font-semibold text-charcoal">
                            {formatCurrency(payout.amount, payout.currency)}
                          </p>
                          <p
                            className={`mt-1 text-small ${
                              payout.status === "paid"
                                ? "text-green-600"
                                : payout.status === "pending"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {payout.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bookings Table */}
                    {totalBookings > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-sage/5">
                            <tr>
                              <th className="px-6 py-3 text-left text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Booking ID
                              </th>
                              <th className="px-6 py-3 text-left text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Parent
                              </th>
                              <th className="px-6 py-3 text-left text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Child
                              </th>
                              <th className="px-6 py-3 text-left text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Session Date
                              </th>
                              <th className="px-6 py-3 text-right text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-small font-medium uppercase tracking-wide text-charcoal/70">
                                Confirmation
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sage/20">
                            {bookings.map((booking) => (
                              <tr key={booking.id} className="hover:bg-sage/5">
                                <td className="whitespace-nowrap px-6 py-4 text-small text-charcoal">
                                  #{booking.id}
                                </td>
                                <td className="px-6 py-4 text-small text-charcoal">
                                  {booking.parent_name}
                                </td>
                                <td className="px-6 py-4 text-small text-charcoal">
                                  {booking.child_name}
                                </td>
                                <td className="px-6 py-4 text-small text-charcoal">
                                  {format(new Date(booking.session_date), "dd MMM yyyy")}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-small font-medium text-charcoal">
                                  {formatCurrency(parseFloat(booking.total_paid) * 100)}
                                </td>
                                <td className="px-6 py-4 text-small text-charcoal/70">
                                  {booking.confirmation_code}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-sage/5">
                            <tr>
                              <td colSpan={4} className="px-6 py-3 text-right text-small font-medium text-charcoal">
                                Total ({totalBookings} {totalBookings === 1 ? "booking" : "bookings"}):
                              </td>
                              <td className="px-6 py-3 text-right text-small font-semibold text-charcoal">
                                {formatCurrency(totalBookingAmount * 100)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-8">
                        <EmptyState
                          title="No bookings found"
                          description="No bookings found for this payout period."
                          iconVariant="inbox"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

