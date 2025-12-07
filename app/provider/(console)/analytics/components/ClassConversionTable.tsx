"use client";

import { useEffect, useState } from "react";

type ClassMetrics = {
  class_id: number;
  class_name: string;
  views: number;
  bookings: number;
  confirmed_bookings: number;
  conversion_rate: number;
  total_revenue: number;
  average_rating: number;
  review_count: number;
};

export default function ClassConversionTable({ providerId }: { providerId: number }) {
  const [classes, setClasses] = useState<ClassMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchClassMetrics() {
      try {
        const response = await fetch(`/api/provider/classes-metrics?provider_id=${providerId}`);
        if (cancelled) return;
        
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setClasses(Array.isArray(data?.classes) ? data.classes : []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch class metrics:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchClassMetrics();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const formatCurrency = (amount: number) => {
    const safeAmount = amount ?? 0;
    if (isNaN(safeAmount)) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(safeAmount);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
        <p className="text-sm text-charcoal/70">Loading class metrics...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm" role="status">
        <h3 className="mb-4 text-lg font-semibold text-charcoal">Class Performance</h3>
        <div className="text-center py-4">
          <h4 className="text-sm font-semibold text-charcoal">No class metrics available yet</h4>
          <p className="mt-1 text-small text-charcoal/50">Metrics will appear here once you have booking data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-charcoal">Class Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Class Name
              </th>
              <th className="px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Views
              </th>
              <th className="px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Bookings
              </th>
              <th className="px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Conversion Rate
              </th>
              <th className="px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-small font-semibold uppercase tracking-wide text-charcoal/70">
                Rating
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {classes.map((classItem) => (
              <tr key={classItem.class_id} className="hover:bg-cream/50">
                <td className="px-4 py-3 text-sm font-medium text-charcoal">
                  {classItem.class_name || "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-charcoal/70">
                  {classItem.views ?? 0}
                </td>
                <td className="px-4 py-3 text-right text-sm text-charcoal/70">
                  {classItem.confirmed_bookings ?? 0} / {classItem.bookings ?? 0}
                </td>
                <td className="px-4 py-3 text-right text-sm text-charcoal/70">
                  {(classItem.conversion_rate ?? 0) > 0 ? `${(classItem.conversion_rate ?? 0).toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-charcoal">
                  {formatCurrency(classItem.total_revenue ?? 0)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-charcoal/70">
                  {(classItem.average_rating ?? 0) > 0 ? (
                    <>
                      {(classItem.average_rating ?? 0).toFixed(1)} ({classItem.review_count ?? 0})
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

