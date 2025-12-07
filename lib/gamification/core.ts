/**
 * Core gamification utilities
 * Shared functions for badges, XP, and growth score calculations
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Review metrics calculation
 * Consolidates review aggregation logic used across badges, XP, and growth score
 */
export interface ReviewMetrics {
  count: number;
  avgRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  reviewRate: number; // Reviews per booking
  responseRate: number; // Percentage of reviews with responses
  avgResponseTime: number; // Average response time in hours
}

export interface Review {
  rating?: string | number | null;
  review_count?: number | null;
  response_text?: string | null;
  response_at?: string | Date | null;
  created_at?: string | Date | null;
  responded_at?: string | Date | null;
}

/**
 * Calculate review metrics from reviews array
 */
export function calculateReviewMetrics(reviews: Review[]): ReviewMetrics {
  if (!reviews || reviews.length === 0) {
    return {
      count: 0,
      avgRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviewRate: 0,
      responseRate: 0,
      avgResponseTime: 0,
    };
  }

  // Calculate total reviews
  const totalReviews = reviews.reduce((sum, r) => sum + (r.review_count || 0), 0);

  // Calculate average rating
  const ratings = reviews
    .map((r) => parseFloat(String(r.rating || "0")))
    .filter((r) => r > 0 && r <= 5);
  const avgRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

  // Calculate rating distribution
  const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  ratings.forEach((rating) => {
    const rounded = Math.round(rating);
    if (rounded >= 1 && rounded <= 5) {
      distribution[rounded as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  // Calculate response rate
  const reviewsWithResponses = reviews.filter(
    (r) => r.response_text && (r.response_at || r.responded_at)
  ).length;
  const responseRate = totalReviews > 0 ? (reviewsWithResponses / totalReviews) * 100 : 0;

  // Calculate average response time
  const responseTimes = reviews
    .filter((r) => {
      const createdAt = r.created_at ? new Date(r.created_at).getTime() : null;
      const respondedAt = r.responded_at
        ? new Date(r.responded_at).getTime()
        : r.response_at
          ? new Date(r.response_at).getTime()
          : null;
      return createdAt && respondedAt && respondedAt > createdAt;
    })
    .map((r) => {
      const created = new Date(r.created_at!).getTime();
      const responded = r.responded_at
        ? new Date(r.responded_at).getTime()
        : new Date(r.response_at!).getTime();
      return (responded - created) / (1000 * 60 * 60); // hours
    });

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;

  return {
    count: totalReviews,
    avgRating,
    ratingDistribution: distribution,
    reviewRate: 0, // Will be calculated separately when bookings data is available
    responseRate,
    avgResponseTime,
  };
}

/**
 * Activity metrics calculation
 * Unifies booking/session calculations
 */
export interface ActivityMetrics {
  totalSessions: number;
  totalConfirmedBookings: number;
  weeklyStreak: number;
  contentCompleteness: number; // 0-100
  photoCountCompleteness: number; // 0-100
  scheduleCompleteness: number; // 0-100
}

export interface Class {
  id?: number | null;
  image_urls?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

/**
 * Calculate activity metrics
 */
export function calculateActivityMetrics(
  classes: Class[],
  sessions: Array<{ class_id?: number | null }>,
  bookings: Array<{ status?: string | null }>,
  weeklyActivities: Array<{ created_at?: string | Date | null }>
): ActivityMetrics {
  const activeClasses = classes?.filter((c) => c.is_active) || [];
  const totalClasses = classes?.length || 0;

  // Calculate photo completeness
  const classesWithPhotos =
    activeClasses.filter(
      (c) =>
        c.image_urls &&
        c.image_urls.split(",").filter(Boolean).length >= 3
    ).length;
  const photoCountCompleteness =
    totalClasses > 0 ? Math.round((classesWithPhotos / totalClasses) * 100) : 0;

  // Calculate schedule completeness
  const classesWithSchedule = new Set(
    sessions?.map((s) => s.class_id).filter((id): id is number => typeof id === "number") || []
  ).size;
  const scheduleCompleteness =
    totalClasses > 0 ? Math.round((classesWithSchedule / totalClasses) * 100) : 0;

  // Calculate content completeness (has description)
  const classesWithDescriptions =
    activeClasses.filter((c) => c.description && c.description.trim().length > 0).length;
  const contentCompleteness =
    totalClasses > 0 ? Math.round((classesWithDescriptions / totalClasses) * 100) : 0;

  // Calculate weekly streak
  const weeklyStreak = calculateWeeklyStreak(weeklyActivities);

  // Calculate confirmed bookings
  const totalConfirmedBookings =
    bookings?.filter((b) => b.status === "confirmed").length || 0;

  return {
    totalSessions: sessions?.length || 0,
    totalConfirmedBookings,
    weeklyStreak,
    contentCompleteness,
    photoCountCompleteness,
    scheduleCompleteness,
  };
}

/**
 * Calculate weekly streak from activity events
 */
function calculateWeeklyStreak(
  weeklyActivities: Array<{ created_at?: string | Date | null }>
): number {
  if (!weeklyActivities || weeklyActivities.length === 0) return 0;

  // Group by week
  const weeks = weeklyActivities
    .map((wa) => {
      const date = new Date(wa.created_at || new Date());
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.getTime();
    })
    .sort((a, b) => b - a); // Most recent first

  // Count consecutive weeks
  let streak = 1;
  for (let i = 1; i < weeks.length; i++) {
    const weekDiff = (weeks[i - 1] - weeks[i]) / (1000 * 60 * 60 * 24 * 7);
    if (weekDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Trend metrics calculation
 * For time-series used in growth dashboards, next-action recommendations, weekly summaries
 */
export interface TrendMetrics {
  momentum: number; // Short-term trend (last 7 days vs previous 7 days)
  velocity: number; // Medium-term trend (last 30 days vs previous 30 days)
  acceleration: number; // Long-term trend (rate of change)
}

/**
 * Calculate trend metrics from historical scores
 */
export function calculateTrendMetrics(scores: number[]): TrendMetrics {
  if (scores.length < 2) {
    return { momentum: 0, velocity: 0, acceleration: 0 };
  }

  // Short-term: compare last 7 days vs previous 7 days (or last 2 values)
  const recent = scores.slice(-2);
  const momentum =
    recent.length === 2 ? recent[1] - recent[0] : 0;

  // Medium-term: compare last 4 weeks vs previous 4 weeks (or available data)
  const midTerm = scores.length >= 4 ? scores.slice(-4) : scores;
  const midTermAvg = midTerm.reduce((sum, s) => sum + s, 0) / midTerm.length;
  const previousMidTerm =
    scores.length >= 8 ? scores.slice(-8, -4) : scores.slice(0, Math.max(0, scores.length - 4));
  const previousMidTermAvg =
    previousMidTerm.length > 0
      ? previousMidTerm.reduce((sum, s) => sum + s, 0) / previousMidTerm.length
      : midTermAvg;
  const velocity = midTermAvg - previousMidTermAvg;

  // Long-term acceleration (rate of change in velocity)
  const acceleration = scores.length >= 3
    ? (scores[scores.length - 1] - 2 * scores[scores.length - 2] + scores[scores.length - 3])
    : 0;

  return { momentum, velocity, acceleration };
}

/**
 * Normalize score to 0-100 range
 * Replaces all manual Math.min(1, Math.max(0, ...)) calls
 */
export function normalizeScore(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate weighted score
 * Replaces inlined multiplication across files
 */
export function weighted(score: number, weight: number): number {
  return score * weight;
}

/**
 * Get week start date (Sunday)
 * Standardizes week boundary calculations
 */
export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get week start date (Monday)
 * Alternative week boundary for weekly summaries
 */
export function getWeekStartMonday(date: Date = new Date()): Date {
  const weekStart = new Date(date);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
  weekStart.setDate(date.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get date N days ago
 * Standardizes date window calculations
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

