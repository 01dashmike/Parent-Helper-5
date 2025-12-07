/**
 * Pass Management
 * 
 * Functions for managing unlimited passes
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { ParentPassRow } from "./types";

export type ParentPass = {
  id: number;
  userId: string;
  providerId: string;
  passType: "unlimited_weekly" | "unlimited_monthly" | "custom";
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

/**
 * Create a pass for a user
 */
export async function createPass(
  userId: string,
  providerId: string,
  passType: "unlimited_weekly" | "unlimited_monthly" | "custom",
  startsAt: Date,
  endsAt: Date,
  metadata?: Record<string, unknown>
): Promise<ParentPass> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Database not configured");
  }

  if (endsAt <= startsAt) {
    throw new Error("End date must be after start date");
  }

  const { data: pass, error } = await supabase
    .from("parent_passes")
    .insert({
      user_id: userId,
      provider_id: providerId,
      pass_type: passType,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_active: true,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error || !pass) {
    throw new Error(`Failed to create pass: ${error?.message}`);
  }

  return {
    id: pass.id,
    userId: pass.user_id,
    providerId: pass.provider_id.toString(),
    passType: pass.pass_type as ParentPass["passType"],
    startsAt: new Date(pass.starts_at),
    endsAt: new Date(pass.ends_at),
    isActive: pass.is_active,
    metadata: (pass.metadata as Record<string, unknown>) || {},
    createdAt: new Date(pass.created_at),
  };
}

/**
 * Check if user has an active pass for a provider - OPTIMIZED
 * 
 * Uses single query with proper filtering for better performance
 */
export async function getActivePass(
  userId: string,
  providerId: string
): Promise<ParentPass | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const now = new Date().toISOString();

  // OPTIMIZATION: Single optimized query with all filters
  const { data: pass, error } = await supabase
    .from("parent_passes")
    .select("id, user_id, provider_id, pass_type, starts_at, ends_at, is_active, metadata, created_at")
    .eq("user_id", userId)
    .eq("provider_id", providerId)
    .eq("is_active", true)
    .gte("ends_at", now)
    .lte("starts_at", now)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid PGRST116 error

  if (error || !pass) {
    return null;
  }

  return {
    id: pass.id,
    userId: pass.user_id,
    providerId: pass.provider_id.toString(),
    passType: pass.pass_type as ParentPass["passType"],
    startsAt: new Date(pass.starts_at),
    endsAt: new Date(pass.ends_at),
    isActive: pass.is_active,
    metadata: (pass.metadata as Record<string, unknown>) || {},
    createdAt: new Date(pass.created_at),
  };
}

/**
 * Get all active passes for a user - OPTIMIZED
 * 
 * Only selects necessary fields for better performance
 */
export async function getUserActivePasses(userId: string): Promise<ParentPass[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const now = new Date().toISOString();

  // OPTIMIZATION: Only select needed columns
  const { data: passes, error } = await supabase
    .from("parent_passes")
    .select("id, user_id, provider_id, pass_type, starts_at, ends_at, is_active, metadata, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("ends_at", now)
    .order("ends_at", { ascending: false });

  if (error || !passes || passes.length === 0) {
    return [];
  }

  return passes.map((p: ParentPassRow) => ({
    id: p.id,
    userId: p.user_id,
    providerId: p.provider_id.toString(),
    passType: p.pass_type as ParentPass["passType"],
    startsAt: new Date(p.starts_at),
    endsAt: new Date(p.ends_at),
    isActive: p.is_active,
    metadata: (p.metadata as Record<string, unknown>) || {},
    createdAt: new Date(p.created_at),
  }));
}

/**
 * Check if a pass can be used for a specific class
 */
export function isPassActive(pass: ParentPass, now: Date = new Date()): boolean {
  return pass.isActive && pass.startsAt <= now && pass.endsAt >= now;
}

export type ClassMetadata = {
  requires_booking?: boolean;
  capacity?: number;
};

export function canUsePassForClass(
  pass: ParentPass,
  classMeta: ClassMetadata
): boolean {
  // Passes are provider-wide, so if the pass is active, it can be used
  // Additional checks can be added here (e.g., capacity, booking requirements)
  return isPassActive(pass);
}

/**
 * Deactivate a pass (for refunds, etc.)
 */
export type DeactivatePassResult = {
  success: boolean;
  error?: string;
};

export async function deactivatePass(passId: number): Promise<DeactivatePassResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const { error } = await supabase
    .from("parent_passes")
    .update({ is_active: false })
    .eq("id", passId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

