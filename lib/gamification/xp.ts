/**
 * Provider XP (Experience Points) System
 * Handles XP awarding, level calculation, and badge unlocks
 */

import { createClient } from "@/lib/supabase/server";
import type { InsertProviderXpEvent } from "@/shared/schema";
import { castDb } from "@/lib/supabase/type-helpers";

/**
 * Normalized XP event type
 */
export type XpEventType =
  | "new_class_published"
  | "photo_uploaded"
  | "review_received"
  | "seo_fix_applied"
  | "referral_sent"
  | "calendar_updated"
  | "weekly_activity"
  | "completed_onboarding";

/**
 * XP event payload interface
 * Normalized metadata structure
 */
export interface XpEventPayload {
  providerId: number;
  eventType: XpEventType;
  points: number;
  metadata?: Record<string, unknown>;
}

// XP weights for different event types
export const XP_WEIGHTS: Record<XpEventType, number> = {
  new_class_published: 50,
  photo_uploaded: 10,
  review_received: 40,
  seo_fix_applied: 20,
  referral_sent: 10,
  calendar_updated: 5,
  weekly_activity: 5,
  completed_onboarding: 100,
};

// Level thresholds
export const LEVEL_THRESHOLDS = {
  bronze: { min: 0, max: 199 },
  silver: { min: 200, max: 699 },
  gold: { min: 700, max: 1499 },
  platinum: { min: 1500, max: Infinity },
} as const;

export type Level = keyof typeof LEVEL_THRESHOLDS;

/**
 * Calculate level based on total XP
 */
export function calculateLevel(xpTotal: number): Level {
  if (xpTotal >= LEVEL_THRESHOLDS.platinum.min) return "platinum";
  if (xpTotal >= LEVEL_THRESHOLDS.gold.min) return "gold";
  if (xpTotal >= LEVEL_THRESHOLDS.silver.min) return "silver";
  return "bronze";
}

/**
 * Get XP required for next level
 */
export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const thresholds = LEVEL_THRESHOLDS[currentLevel];
  
  if (currentLevel === "platinum") return Infinity; // Max level
  
  const nextLevelMin = Object.values(LEVEL_THRESHOLDS).find(
    (t) => t.min > thresholds.max
  )?.min;
  
  return nextLevelMin ? nextLevelMin - currentXp : 0;
}

/**
 * Record XP event to database
 * Unified function to replace all direct supabase inserts
 */
export async function recordXpEvent(
  payload: XpEventPayload
): Promise<{ success: boolean; error?: unknown }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("provider_xp_events")
      .insert(
        castDb<InsertProviderXpEvent>({
          provider_id: payload.providerId,
          event_type: payload.eventType,
          points: payload.points,
          metadata: payload.metadata || {},
        })
      );

    if (error) {
      console.error("Error recording XP event:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording XP event:", error);
    return { success: false, error };
  }
}

/**
 * Award XP to a provider
 * Main entry point for awarding XP with level tracking
 */
export async function awardXp(
  providerId: number,
  eventType: XpEventType,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; xpAwarded: number; newLevel?: Level; levelUp?: boolean }> {
  const supabase = await createClient();
  const points = XP_WEIGHTS[eventType] || 0;

  if (points === 0) {
    return { success: false, xpAwarded: 0 };
  }

  try {
    // Record XP event using unified function
    const eventResult = await recordXpEvent({
      providerId,
      eventType,
      points,
      metadata,
    });

    if (!eventResult.success) {
      return { success: false, xpAwarded: 0 };
    }

    // Get current level data
    const { data: currentLevel } = await supabase
      .from("provider_levels")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    const currentXp = currentLevel?.xp_total || 0;
    const newXpTotal = currentXp + points;
    const oldLevel = currentLevel?.level || "bronze";
    const newLevel = calculateLevel(newXpTotal);
    const levelUp = newLevel !== oldLevel;

    // Update or insert level
    if (currentLevel) {
      const { error: updateError } = await supabase
        .from("provider_levels")
        .update({
          xp_total: newXpTotal,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("provider_id", providerId);

      if (updateError) {
        console.error("Error updating level:", updateError);
        return { success: false, xpAwarded: 0 };
      }
    } else {
      const { error: insertError } = await supabase
        .from("provider_levels")
        .insert({
          provider_id: providerId,
          xp_total: newXpTotal,
          level: newLevel,
        });

      if (insertError) {
        console.error("Error inserting level:", insertError);
        return { success: false, xpAwarded: 0 };
      }
    }

    return {
      success: true,
      xpAwarded: points,
      newLevel,
      levelUp,
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return { success: false, xpAwarded: 0 };
  }
}

/**
 * Get provider's current XP and level
 */
export async function getProviderLevel(providerId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_levels")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (error || !data) {
    return {
      xpTotal: 0,
      level: "bronze" as Level,
      xpForNextLevel: getXpForNextLevel(0),
    };
  }

  return {
    xpTotal: data.xp_total,
    level: data.level as Level,
    xpForNextLevel: getXpForNextLevel(data.xp_total),
  };
}

/**
 * Get recent XP events for a provider
 */
export async function getRecentXpEvents(providerId: number, limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("provider_xp_events")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching XP events:", error);
    return [];
  }

  return data || [];
}

