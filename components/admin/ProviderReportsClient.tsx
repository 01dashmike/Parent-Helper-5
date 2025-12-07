"use client";

import { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface ProviderReport {
  id: string;
  provider_id: number;
  week_start: string;
  stats_json: {
    total_bookings: number;
    confirmed_bookings: number;
    total_revenue: number;
    avg_rating: number;
    wallet_topups_from_referrals: number;
    class_attendance_rate: number;
    upcoming_classes_count: number;
  };
  created_at: string;
  providers?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface Props {
  reports: ProviderReport[];
}

type SortField = "revenue" | "rating" | "classes" | "bookings" | "none";
type SortDirection = "asc" | "desc";

export default function ProviderReportsClient({ reports }: Props) {
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const sortedReports = useMemo(() => {
    if (sortField === "none") return reports;

    const sorted = [...reports].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortField) {
        case "revenue":
          aValue = a.stats_json.total_revenue || 0;
          bValue = b.stats_json.total_revenue || 0;
          break;
        case "rating":
          aValue = a.stats_json.avg_rating || 0;
          bValue = b.stats_json.avg_rating || 0;
          break;
        case "classes":
          aValue = a.stats_json.upcoming_classes_count || 0;
          bValue = b.stats_json.upcoming_classes_count || 0;
          break;
        case "bookings":
          aValue = a.stats_json.total_bookings || 0;
          bValue = b.stats_json.total_bookings || 0;
          break;
      }

      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [reports, sortField, sortDirection]);

  // Virtualizer for table rows
  const rowVirtualizer = useVirtualizer({
    count: sortedReports.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Estimated height of each table row
    overscan: 5, // Render 5 extra rows outside viewport for smooth scrolling
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`text-left text-small font-medium hover:text-blue-600 ${
          isActive ? "text-blue-600" : "text-gray-600"
        }`}
      >
        {label}
        {isActive && (
          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </button>
    );
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No reports found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={tableContainerRef}
        className="overflow-auto rounded-lg border border-gray-200 bg-white"
        style={{ height: "600px", maxHeight: "70vh" }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                Provider
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                Week
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                <SortButton field="revenue" label="Revenue" />
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                <SortButton field="bookings" label="Bookings" />
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                <SortButton field="rating" label="Rating" />
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                Referrals
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                <SortButton field="classes" label="Upcoming Classes" />
              </th>
              <th className="px-4 py-3 text-left text-small font-semibold text-gray-900">
                Attendance Rate
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y divide-gray-200"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const report = sortedReports[virtualRow.index];
              return (
                <tr
                  key={virtualRow.key}
                  className="hover:bg-gray-50"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="px-4 py-3 text-small text-gray-900">
                    {report.providers?.name || `Provider ${report.provider_id}`}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {formatDate(report.week_start)}
                  </td>
                  <td className="px-4 py-3 text-small font-medium text-gray-900">
                    {formatCurrency(report.stats_json.total_revenue || 0)}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {report.stats_json.total_bookings || 0}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {report.stats_json.avg_rating > 0
                      ? `${report.stats_json.avg_rating.toFixed(1)}★`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {formatCurrency(report.stats_json.wallet_topups_from_referrals || 0)}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {report.stats_json.upcoming_classes_count || 0}
                  </td>
                  <td className="px-4 py-3 text-small text-gray-600">
                    {report.stats_json.class_attendance_rate > 0
                      ? `${report.stats_json.class_attendance_rate.toFixed(1)}%`
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

