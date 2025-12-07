"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
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
} from "recharts";
import { themeColors } from "@/lib/theme-colors";

interface PaymentsData {
  summary: {
    totalPaymentsCents: number;
    totalPayments: number;
    successfulPaymentsCount: number;
    failedPaymentsCount: number;
    totalPaymentsCount: number;
  };
  paymentsByProvider: Array<{
    providerId: number;
    providerName: string;
    totalCents: number;
    count: number;
  }>;
  paymentsByDate: Array<{
    date: string;
    totalCents: number;
    total: number;
    count: number;
  }>;
  payoutSummary: {
    total: number;
    pending: number;
    paid: number;
    failed: number;
    totalAmountCents: number;
  };
  failedPayments: Array<{
    id: string | number;
    amount: number;
    amountCents: number;
    paymentStatus: string;
    stripeChargeId: string | null;
    stripePaymentIntentId: string | null;
    providerName: string;
    createdAt: string;
    type: string;
  }>;
  rewardsUsed: {
    total: number;
    totalValueCents: number;
    bySource: Record<string, number>;
  };
  allPayments: Array<{
    id: string | number;
    amount: number;
    amountCents: number;
    paymentStatus: string;
    stripeChargeId: string | null;
    stripePaymentIntentId: string | null;
    providerId: number | null;
    providerName: string;
    createdAt: string;
    type: string;
  }>;
}

interface PaymentsDashboardClientProps {
  data: PaymentsData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function PaymentsDashboardClient({ data }: PaymentsDashboardClientProps) {
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Filter payments by provider
  const filteredPayments = useMemo(() => {
    if (!selectedProvider) return data.allPayments;
    return data.allPayments.filter((p) => p.providerId === selectedProvider);
  }, [data.allPayments, selectedProvider]);

  // KPI Cards
  const cards = [
    {
      title: "Total Payments (30 days)",
      value: formatCurrency(data.summary.totalPayments),
      subtitle: `${data.summary.totalPaymentsCount} transactions`,
      color: themeColors.sage.alt,
    },
    {
      title: "Successful Payments",
      value: data.summary.successfulPaymentsCount.toString(),
      subtitle: formatCurrency(
        filteredPayments
          .filter((p) => p.paymentStatus === "paid" || p.paymentStatus === "confirmed")
          .reduce((sum, p) => sum + p.amount, 0)
      ),
      color: themeColors.sage.alt,
    },
    {
      title: "Failed Payments",
      value: data.summary.failedPaymentsCount.toString(),
      subtitle: formatCurrency(
        filteredPayments
          .filter((p) => p.paymentStatus === "failed" || p.paymentStatus === "cancelled")
          .reduce((sum, p) => sum + p.amount, 0)
      ),
      color: themeColors.terracotta,
    },
    {
      title: "Rewards/Coupons Used",
      value: data.rewardsUsed.total.toString(),
      subtitle: formatCurrency(data.rewardsUsed.totalValueCents / 100),
      color: themeColors.charcoal.dark,
    },
  ];

  // Provider filter options
  const providerOptions = useMemo(() => {
    const providers = new Map<number, string>();
    data.allPayments.forEach((p) => {
      if (p.providerId && !providers.has(p.providerId)) {
        providers.set(p.providerId, p.providerName);
      }
    });
    return Array.from(providers.entries()).map(([id, name]) => ({ id, name }));
  }, [data.allPayments]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
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

      {/* Provider Filter */}
      <div className="rounded-2xl border border-sage/20 bg-white p-4 shadow-soft">
        <label className="block text-small font-medium text-charcoal mb-2">
          Filter by Provider
        </label>
        <select
          value={selectedProvider || ""}
          onChange={(e) => setSelectedProvider(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-sage/30 bg-cream/40 px-4 py-2 text-small text-charcoal focus:border-sage focus:outline-none"
        >
          <option value="">All Providers</option>
          {providerOptions.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* Payments Over Time Chart */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="text-title font-semibold text-charcoal mb-4">Payments Over Time (30 days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.paymentsByDate}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.DEFAULT} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={themeColors.charcoal.dark}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: unknown) => `£${value}`}
              stroke={themeColors.charcoal.dark}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke={themeColors.sage.alt}
              strokeWidth={2}
              name="Total (£)"
              dot={{ fill: themeColors.sage.alt, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={themeColors.terracotta}
              strokeWidth={2}
              name="Count"
              dot={{ fill: themeColors.terracotta, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Payments by Provider Chart */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="text-title font-semibold text-charcoal mb-4">Payments by Provider (Top 10)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.paymentsByProvider.slice(0, 10).map((p) => ({
              ...p,
              total: p.totalCents / 100,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.cream.DEFAULT} />
            <XAxis
              dataKey="providerName"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke={themeColors.charcoal.dark}
              style={{ fontSize: "11px" }}
            />
            <YAxis
              tickFormatter={(value: unknown) => `£${value}`}
              stroke={themeColors.charcoal.dark}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: themeColors.cream.DEFAULT,
                border: `1px solid ${themeColors.sage.alt}`,
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="total" fill={themeColors.sage.alt} name="Total (£)" />
            <Bar dataKey="count" fill={themeColors.terracotta} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.6 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft overflow-x-auto"
      >
        <h2 className="text-title font-semibold text-charcoal mb-4">
          Recent Payments ({filteredPayments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-sage/20">
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Provider</th>
                <th className="text-right py-3 px-4 font-semibold text-charcoal">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Stripe Charge ID</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.slice(0, 50).map((payment) => (
                <tr key={payment.id} className="border-b border-sage/10 hover:bg-cream/40">
                  <td className="py-3 px-4 text-slateSoft">
                    {new Date(payment.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-3 px-4 text-charcoal">{payment.providerName}</td>
                  <td className="py-3 px-4 text-right font-medium text-charcoal">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-small font-medium ${
                        payment.paymentStatus === "paid" || payment.paymentStatus === "confirmed"
                          ? "bg-sage/20 text-forest"
                          : payment.paymentStatus === "failed" || payment.paymentStatus === "cancelled"
                            ? "bg-terracotta/20 text-terracotta"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-small text-slateSoft font-mono">
                    {payment.stripeChargeId || payment.stripePaymentIntentId || "-"}
                  </td>
                  <td className="py-3 px-4 text-small text-slateSoft">{payment.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Payout Summary */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.7 }}
        className="rounded-2xl border border-sage/20 bg-white p-6 shadow-soft"
      >
        <h2 className="text-title font-semibold text-charcoal mb-4">Payout Status Summary</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-small text-slateSoft">Total Payouts</p>
            <p className="text-title font-semibold text-charcoal">{data.payoutSummary.total}</p>
          </div>
          <div>
            <p className="text-small text-slateSoft">Pending</p>
            <p className="text-title font-semibold text-charcoal">{data.payoutSummary.pending}</p>
          </div>
          <div>
            <p className="text-small text-slateSoft">Paid</p>
            <p className="text-title font-semibold text-forest">{data.payoutSummary.paid}</p>
          </div>
          <div>
            <p className="text-small text-slateSoft">Failed</p>
            <p className="text-title font-semibold text-terracotta">{data.payoutSummary.failed}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-sage/20">
          <p className="text-small text-slateSoft">Total Payout Amount</p>
          <p className="text-title font-semibold text-charcoal">
            {formatCurrency(data.payoutSummary.totalAmountCents / 100)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

