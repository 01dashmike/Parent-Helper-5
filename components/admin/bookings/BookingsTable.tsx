"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: number;
  confirmation_code: string;
  parent_name: string;
  parent_email: string;
  child_name: string;
  total_paid: string;
  status: string;
  payment_status: string;
  created_at: string;
  session_date: string;
  classes: { name: string } | null;
  providers: { name: string } | null;
}

interface BookingsTableProps {
  bookings: Booking[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      paid: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-sage/20 bg-white p-6 shadow-xl"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20">
          <thead className="bg-cream/70">
            <tr>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Confirmation Code
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Class
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Parent
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Child
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Status
              </th>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10 bg-white">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slateSoft">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 text-small font-mono font-medium text-charcoal">
                    {booking.confirmation_code}
                  </td>
                  <td className="px-4 py-3 text-small text-charcoal">
                    {booking.classes?.name || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-small text-charcoal">
                    <div>{booking.parent_name}</div>
                    <div className="text-small text-slateSoft">{booking.parent_email}</div>
                  </td>
                  <td className="px-4 py-3 text-small text-charcoal">{booking.child_name}</td>
                  <td className="px-4 py-3 text-small font-semibold text-charcoal">
                    {formatCurrency(booking.total_paid)}
                  </td>
                  <td className="px-4 py-3 text-small">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-small font-medium ${getStatusBadge(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                    <br />
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-small font-medium ${getStatusBadge(booking.payment_status)}`}
                    >
                      {booking.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-small text-slateSoft">
                    {formatDate(booking.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

