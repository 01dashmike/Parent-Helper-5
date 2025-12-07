/**
 * Audit logging utility
 * Logs user actions for security and compliance
 */

"use server";

import { getSupabaseServer } from "@/lib/supabase.server";

export type AuditAction =
  | "provider_update"
  | "provider_create"
  | "admin_action"
  | "class_create"
  | "class_update"
  | "class_delete"
  | "booking_create"
  | "booking_cancel"
  | "user_delete"
  | "admin_login"
  | "admin_failed_login"
  | "data_export"
  | "sensitive_access"
  | "suspicious_upload"
  | "file_upload";

export interface AuditLogEntry {
  user_id?: string;
  role?: string;
  action: AuditAction;
  payload?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("[audit] Supabase not configured");
      return;
    }

    await supabase.from("audit_logs").insert({
      user_id: entry.user_id || null,
      role: entry.role || null,
      action: entry.action,
      payload: entry.payload || {},
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error("[audit] Failed to log event:", error);
  }
}

/**
 * Log provider action
 */
export async function logProviderAction(
  userId: string,
  action: "create" | "update" | "delete",
  providerId: number,
  changes?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    role: "provider",
    action: `provider_${action}` as AuditAction,
    payload: {
      provider_id: providerId,
      changes,
    },
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  payload?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    role: "admin",
    action: "admin_action",
    payload: {
      action,
      ...payload,
    },
  });
}

/**
 * Log class action
 */
export async function logClassAction(
  userId: string,
  action: "create" | "update" | "delete",
  classId: number,
  changes?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    role: "provider",
    action: `class_${action}` as AuditAction,
    payload: {
      class_id: classId,
      changes,
    },
  });
}

/**
 * Log booking action
 */
export async function logBookingAction(
  userId: string,
  action: "create" | "cancel",
  bookingId: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: `booking_${action}` as AuditAction,
    payload: {
      booking_id: bookingId,
      ...details,
    },
  });
}

