"use client";

import { useMemo, useState } from "react";

interface ClientError {
  id: number;
  user_id: string | null;
  session_id: string | null;
  message: string;
  source: string | null;
  lineno: number | null;
  colno: number | null;
  error_name: string | null;
  error_message: string | null;
  error_stack: string | null;
  url: string;
  user_agent: string | null;
  severity: "error" | "unhandledrejection";
  context: Record<string, unknown>;
  created_at: string;
}

interface ErrorDashboardClientProps {
  errors: ClientError[];
}

interface ErrorGroup {
  message: string;
  error_name: string | null;
  count: number;
  first_seen: string;
  last_seen: string;
  severity: "error" | "unhandledrejection";
  sample_url: string;
  sample_stack: string | null;
}

export default function ErrorDashboardClient({ errors }: ErrorDashboardClientProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | "error" | "unhandledrejection">("all");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  // Group errors by message and error_name
  const errorGroups = useMemo(() => {
    const groups = new Map<string, ErrorGroup>();

    const now = new Date();
    const timeRanges: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now.getTime() - timeRanges[timeRange];

    const filteredErrors = errors.filter((error) => {
      const errorTime = new Date(error.created_at).getTime();
      if (errorTime < cutoff) return false;
      if (selectedSeverity !== "all" && error.severity !== selectedSeverity) return false;
      return true;
    });

    filteredErrors.forEach((error) => {
      // Create a key from message and error_name
      const key = `${error.message}|||${error.error_name || "unknown"}`;

      if (!groups.has(key)) {
        groups.set(key, {
          message: error.message,
          error_name: error.error_name,
          count: 0,
          first_seen: error.created_at,
          last_seen: error.created_at,
          severity: error.severity,
          sample_url: error.url,
          sample_stack: error.error_stack,
        });
      }

      const group = groups.get(key)!;
      group.count += 1;
      if (error.created_at < group.first_seen) {
        group.first_seen = error.created_at;
      }
      if (error.created_at > group.last_seen) {
        group.last_seen = error.created_at;
      }
    });

    // Sort by count (descending)
    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [errors, selectedSeverity, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const timeRanges: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now.getTime() - timeRanges[timeRange];

    const filteredErrors = errors.filter((error) => {
      const errorTime = new Date(error.created_at).getTime();
      return errorTime >= cutoff;
    });

    const uniqueSessions = new Set(filteredErrors.map((e) => e.session_id).filter(Boolean));
    const errorCount = filteredErrors.filter((e) => e.severity === "error").length;
    const rejectionCount = filteredErrors.filter((e) => e.severity === "unhandledrejection").length;

    return {
      total: filteredErrors.length,
      errors: errorCount,
      rejections: rejectionCount,
      uniqueSessions: uniqueSessions.size,
      uniqueErrors: errorGroups.length,
    };
  }, [errors, timeRange, errorGroups.length]);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-sage/20 bg-white p-4 shadow-sm">
          <div className="text-small text-slateSoft">Total Errors</div>
          <div className="mt-1 text-title font-semibold text-charcoal">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4 shadow-sm">
          <div className="text-small text-slateSoft">Runtime Errors</div>
          <div className="mt-1 text-title font-semibold text-terracotta">{stats.errors}</div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4 shadow-sm">
          <div className="text-small text-slateSoft">Unhandled Rejections</div>
          <div className="mt-1 text-title font-semibold text-orange-600">{stats.rejections}</div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4 shadow-sm">
          <div className="text-small text-slateSoft">Unique Errors</div>
          <div className="mt-1 text-title font-semibold text-sage">{stats.uniqueErrors}</div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4 shadow-sm">
          <div className="text-small text-slateSoft">Affected Sessions</div>
          <div className="mt-1 text-title font-semibold text-sageDark">{stats.uniqueSessions}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="severity-filter" className="text-small font-medium text-charcoal">
            Severity:
          </label>
          <select
            id="severity-filter"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as "error" | "unhandledrejection" | "all")}
            className="rounded border border-sage/20 bg-white px-3 py-1.5 text-small focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="unhandledrejection">Rejections</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="time-filter" className="text-small font-medium text-charcoal">
            Time Range:
          </label>
          <select
            id="time-filter"
            value={timeRange}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "24h" || value === "7d" || value === "30d") {
                setTimeRange(value);
              }
            }}
            className="rounded border border-sage/20 bg-white px-3 py-1.5 text-small focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Error Groups */}
      <div className="space-y-4">
        <h2 className="text-title font-semibold text-charcoal">Top Errors</h2>
        {errorGroups.length === 0 ? (
          <div className="rounded-lg border border-sage/20 bg-white p-8 text-center text-slateSoft">
            No errors found for the selected filters.
          </div>
        ) : (
          errorGroups.map((group) => (
            <div key={`${group.message}-${group.error_name || 'no-name'}`} className="rounded-lg border border-sage/20 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-small font-medium ${
                        group.severity === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {group.severity === "error" ? "Error" : "Unhandled Rejection"}
                    </span>
                    {group.error_name && (
                      <span className="rounded-full bg-sage/15 px-2 py-1 text-small text-sage">
                        {group.error_name}
                      </span>
                    )}
                    <span className="rounded-full bg-sage/15 px-2 py-1 text-small font-semibold text-sage">
                      {group.count} {group.count === 1 ? "occurrence" : "occurrences"}
                    </span>
                  </div>
                  <p className="mb-2 font-mono text-small text-charcoal">{group.message}</p>
                  <p className="text-small text-slateSoft">
                    First seen: {new Date(group.first_seen).toLocaleString()}
                    {" • "}
                    Last seen: {new Date(group.last_seen).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {group.sample_url && (
                <div className="mb-3">
                  <p className="mb-1 text-small font-medium text-slateSoft">Sample URL:</p>
                  <p className="truncate text-small text-charcoal">{group.sample_url}</p>
                </div>
              )}

              {group.sample_stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-small font-medium text-sage hover:text-sageDark">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-cream p-3 text-small text-charcoal">
                    {group.sample_stack}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

