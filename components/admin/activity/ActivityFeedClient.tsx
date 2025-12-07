"use client";

import { useState, useEffect } from "react";
import { ActivityFilterBar } from "./ActivityFilterBar";
import { ActivityList } from "./ActivityList";
import type { ActivityLogEntry } from "./ActivityItem";

interface ActivityFeedClientProps {
  initialActivity: ActivityLogEntry[];
}

export function ActivityFeedClient({ initialActivity }: ActivityFeedClientProps) {
  const [activity, setActivity] = useState<ActivityLogEntry[]>(initialActivity);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: "24h" as "24h" | "7d" | "30d" | "all",
    scope: "" as string,
    level: "" as "" | "info" | "warning" | "error",
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialActivity.length === 50);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      try {
        const startDate = getStartDate(filters.dateRange);
        const params = new URLSearchParams({
          limit: "50",
          offset: String(page * 50),
        });

        if (filters.scope) {
          params.append("scope", filters.scope);
        }
        if (filters.level) {
          params.append("level", filters.level);
        }
        if (startDate) {
          params.append("startDate", startDate.toISOString());
        }

        const response = await fetch(`/api/admin/activity?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (page === 0) {
            setActivity(data.activities || []);
          } else {
            setActivity((prev) => [...prev, ...(data.activities || [])]);
          }
          setHasMore((data.activities || []).length === 50);
        }
      } catch (error) {
        console.error("[ActivityFeedClient] Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [filters, page]);

  function handleFilterChange(newFilters: typeof filters) {
    setFilters(newFilters);
    setPage(0);
  }

  function handleLoadMore() {
    setPage((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <ActivityFilterBar filters={filters} onFilterChange={handleFilterChange} />
      <ActivityList
        activities={activity}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}

function getStartDate(dateRange: string): Date | null {
  const now = new Date();
  switch (dateRange) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

