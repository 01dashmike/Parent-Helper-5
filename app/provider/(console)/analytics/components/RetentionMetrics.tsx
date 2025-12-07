"use client";

import { Eye, BookOpen, TrendingUp, Search, Star, Heart } from "lucide-react";
import MetricCard from "./MetricCard";

interface RetentionMetricsProps {
  views: number;
  bookings: number;
  conversionRate: number;
  searchAppearances: number;
  reviews: number;
  profileHealthScore: number;
  viewsChange?: number;
  bookingsChange?: number;
  conversionChange?: number;
  searchChange?: number;
  reviewsChange?: number;
  healthChange?: number;
}

function getStatus(value: number, thresholds: { good: number; warning: number }): "good" | "warning" | "critical" {
  const safeValue = value ?? 0;
  if (isNaN(safeValue)) return "critical";
  if (safeValue >= thresholds.good) return "good";
  if (safeValue >= thresholds.warning) return "warning";
  return "critical";
}

export default function RetentionMetrics({
  views = 0,
  bookings = 0,
  conversionRate = 0,
  searchAppearances = 0,
  reviews = 0,
  profileHealthScore = 0,
  viewsChange,
  bookingsChange,
  conversionChange,
  searchChange,
  reviewsChange,
  healthChange,
}: RetentionMetricsProps) {
  const safeConversionRate = conversionRate ?? 0;
  const safeProfileHealthScore = profileHealthScore ?? 0;
  const conversionStatus = getStatus(safeConversionRate, { good: 5, warning: 2 });
  const healthStatus = getStatus(safeProfileHealthScore, { good: 70, warning: 50 });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Views"
        value={views}
        subtitle="Class page views this week"
        status={views > 50 ? "good" : views > 20 ? "warning" : "critical"}
        icon={<Eye className="h-4 w-4" aria-hidden="true" />}
        trend={viewsChange !== undefined && viewsChange !== null ? { value: viewsChange, label: `${Math.abs(viewsChange)}% vs last week` } : undefined}
      />

      <MetricCard
        title="Bookings"
        value={bookings}
        subtitle="Confirmed bookings"
        status={bookings > 10 ? "good" : bookings > 3 ? "warning" : "critical"}
        icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
        trend={bookingsChange !== undefined && bookingsChange !== null ? { value: bookingsChange, label: `${Math.abs(bookingsChange)}% vs last week` } : undefined}
      />

      <MetricCard
        title="Conversion"
        value={`${(conversionRate || 0).toFixed(1)}%`}
        subtitle="Views to bookings"
        status={conversionStatus}
        icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        trend={conversionChange !== undefined && conversionChange !== null ? { value: conversionChange, label: `${Math.abs(conversionChange)}% vs last week` } : undefined}
      />

      <MetricCard
        title="Search Appearances"
        value={searchAppearances}
        subtitle="Times shown in search results"
        status={searchAppearances > 100 ? "good" : searchAppearances > 30 ? "warning" : "critical"}
        icon={<Search className="h-4 w-4" aria-hidden="true" />}
        trend={searchChange !== undefined && searchChange !== null ? { value: searchChange, label: `${Math.abs(searchChange)}% vs last week` } : undefined}
      />

      <MetricCard
        title="Reviews"
        value={reviews}
        subtitle="New reviews this week"
        status={reviews > 2 ? "good" : reviews > 0 ? "warning" : "critical"}
        icon={<Star className="h-4 w-4" aria-hidden="true" />}
        trend={reviewsChange !== undefined && reviewsChange !== null ? { value: reviewsChange, label: `${Math.abs(reviewsChange)}% vs last week` } : undefined}
      />

      <MetricCard
        title="Profile Health"
        value={`${profileHealthScore || 0}/100`}
        subtitle="Completeness & quality score"
        status={healthStatus}
        icon={<Heart className="h-4 w-4" aria-hidden="true" />}
        trend={healthChange !== undefined && healthChange !== null ? { value: healthChange, label: `${Math.abs(healthChange)}% vs last week` } : undefined}
      />
    </div>
  );
}

