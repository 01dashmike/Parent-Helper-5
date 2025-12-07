/**
 * Activity Logging Utility
 * Central logging for admin activity feed
 */

import { getSupabaseServer } from "@/lib/supabase.server";

export type ActivityLevel = "info" | "warning" | "error";

export type ActivityEventType =
  | "provider.signup"
  | "provider.approved"
  | "class.created"
  | "class.updated"
  | "class.cancelled"
  | "booking.completed"
  | "booking.cancelled"
  | "booking.refunded"
  | "email.sent"
  | "email.failed"
  | "cron.weekly"
  | "cron.daily"
  | "stripe.payment.succeeded"
  | "stripe.payment.failed"
  | "stripe.refund"
  | "system.error";

export interface LogActivityParams {
  eventType: ActivityEventType;
  scope: string;
  level?: ActivityLevel;
  title: string;
  description?: string;
  providerId?: number | null;
  classId?: number | null;
  bookingId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ActivityLogEntry {
  id: number;
  created_at: string;
  event_type: ActivityEventType;
  scope: string;
  level: ActivityLevel;
  title: string;
  description: string | null;
  provider_id: number | null;
  class_id: number | null;
  booking_id: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface GetRecentActivityParams {
  limit?: number;
  offset?: number;
  scope?: string;
  level?: ActivityLevel;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Log an activity event
 * Never throws - logs errors to console and continues
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.warn("[activityLog] Supabase not configured, skipping log");
      return;
    }

    const { error } = await supabase.from("activity_log").insert({
      event_type: params.eventType,
      scope: params.scope,
      level: params.level || "info",
      title: params.title,
      description: params.description || null,
      provider_id: params.providerId || null,
      class_id: params.classId || null,
      booking_id: params.bookingId || null,
      actor_id: params.actorId || null,
      metadata: params.metadata || null,
    });

    if (error) {
      console.error("[activityLog] Failed to log activity:", error);
      // Don't throw - this should never break user flows
    }
  } catch (error) {
    console.error("[activityLog] Unexpected error logging activity:", error);
    // Don't throw - this should never break user flows
  }
}

/**
 * Get recent activity entries
 */
export async function getRecentActivity(
  params: GetRecentActivityParams = {}
): Promise<ActivityLogEntry[]> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.warn("[activityLog] Supabase not configured");
      return [];
    }

    const {
      limit = 50,
      offset = 0,
      scope,
      level,
      startDate,
      endDate,
    } = params;

    let query = supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (scope) {
      query = query.eq("scope", scope);
    }

    if (level) {
      query = query.eq("level", level);
    }

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("[activityLog] Failed to fetch activity:", error);
      return [];
    }

    return (data || []) as ActivityLogEntry[];
  } catch (error) {
    console.error("[activityLog] Unexpected error fetching activity:", error);
    return [];
  }
}

/**
 * Get activity count for a time period
 */
export async function getActivityCount(
  startDate: Date,
  endDate: Date,
  scope?: string,
  level?: ActivityLevel
): Promise<number> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return 0;
    }

    let query = supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (scope) {
      query = query.eq("scope", scope);
    }

    if (level) {
      query = query.eq("level", level);
    }

    const { count, error } = await query;

    if (error) {
      console.error("[activityLog] Failed to count activity:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("[activityLog] Unexpected error counting activity:", error);
    return 0;
  }
}

