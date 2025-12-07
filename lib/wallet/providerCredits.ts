/**
 * Provider Credit Settings Management
 * 
 * Functions for managing provider credit acceptance and pricing
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { ProviderCreditSettingsRow } from "./types";

export type ProviderCreditSettings = {
  providerId: string;
  acceptsCredits: boolean;
  creditCostPerClass: number;
  unlimitedPassEnabled: boolean;
  unlimitedPassPrice?: number;
  unlimitedPassType?: "weekly" | "monthly";
  classOverrides: Record<string, { creditCost?: number; disabled?: boolean }>;
  createdAt: Date;
  updatedAt: Date;
};

export type ProviderCreditSettingsPayload = {
  acceptsCredits?: boolean;
  creditCostPerClass?: number;
  unlimitedPassEnabled?: boolean;
  unlimitedPassPrice?: number;
  unlimitedPassType?: "weekly" | "monthly";
  classOverrides?: Record<string, { creditCost?: number; disabled?: boolean }>;
};

/**
 * Get provider credit settings - OPTIMIZED WITH CACHING
 * 
 * Uses multi-level caching:
 * 1. Memory cache (60s TTL) - fastest, within same request
 * 2. Next.js cache (1h TTL) - fast, across requests
 * 3. Database - slowest, cache miss
 */
export async function getProviderCreditSettings(
  providerId: string
): Promise<ProviderCreditSettings | null> {
  // Check memory cache first
  const { 
    getProviderSettingsFromMemCache, 
    setProviderSettingsInMemCache,
    cacheProviderSettings 
  } = await import("./cache");
  
  const memCached = getProviderSettingsFromMemCache(providerId);
  if (memCached !== undefined) {
    return memCached;
  }

  // Query with Next.js cache
  const settings = await cacheProviderSettings(providerId, async () => {
    const supabase = getSupabaseServer();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("provider_credit_settings")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (error || !data) {
      // Return default settings if none exist
      return {
        providerId,
        acceptsCredits: false,
        creditCostPerClass: 1,
        unlimitedPassEnabled: false,
        classOverrides: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      providerId: data.provider_id.toString(),
      acceptsCredits: data.accepts_credits,
      creditCostPerClass: data.credit_cost_per_class,
      unlimitedPassEnabled: data.unlimited_pass_enabled,
      unlimitedPassPrice: data.unlimited_pass_price || undefined,
      unlimitedPassType: data.unlimited_pass_type || undefined,
      classOverrides: (data.class_overrides as Record<string, { creditCost?: number; disabled?: boolean }>) || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  });

  // Update memory cache
  setProviderSettingsInMemCache(providerId, settings);

  return settings;
}

/**
 * Update provider credit settings
 */
export async function updateProviderCreditSettings(
  providerId: string,
  payload: ProviderCreditSettingsPayload
): Promise<ProviderCreditSettings> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Database not configured");
  }

  const updateData: Partial<{
    updated_at: string;
    accepts_credits: boolean;
    credit_cost_per_class: number;
    unlimited_pass_enabled: boolean;
    unlimited_pass_price: number | null;
    unlimited_pass_type: string | null;
    class_overrides: Record<string, { creditCost?: number; disabled?: boolean }>;
  }> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.acceptsCredits !== undefined) {
    updateData.accepts_credits = payload.acceptsCredits;
  }
  if (payload.creditCostPerClass !== undefined) {
    updateData.credit_cost_per_class = payload.creditCostPerClass;
  }
  if (payload.unlimitedPassEnabled !== undefined) {
    updateData.unlimited_pass_enabled = payload.unlimitedPassEnabled;
  }
  if (payload.unlimitedPassPrice !== undefined) {
    updateData.unlimited_pass_price = payload.unlimitedPassPrice || null;
  }
  if (payload.unlimitedPassType !== undefined) {
    updateData.unlimited_pass_type = payload.unlimitedPassType || null;
  }
  if (payload.classOverrides !== undefined) {
    updateData.class_overrides = payload.classOverrides;
  }

  const { data: updated, error } = await supabase
    .from("provider_credit_settings")
    .upsert(
      {
        provider_id: providerId,
        ...updateData,
      },
      {
        onConflict: "provider_id",
      }
    )
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update settings: ${error?.message}`);
  }

  const settings = await getProviderCreditSettings(providerId);
  if (!settings) {
    throw new Error("Failed to retrieve updated settings");
  }

  return settings;
}

/**
 * Check if provider accepts credits
 */
export function providerAcceptsCredits(settings: ProviderCreditSettings): boolean {
  return settings.acceptsCredits;
}

/**
 * Get credit cost for a specific class
 * Returns null if class is not eligible for credits
 */
export function creditCostForClass(
  classId: string,
  settings: ProviderCreditSettings
): number | null {
  if (!settings.acceptsCredits) {
    return null;
  }

  // Check for class override
  const override = settings.classOverrides[classId];
  if (override?.disabled) {
    return null; // Class explicitly disabled
  }

  if (override?.creditCost !== undefined) {
    return override.creditCost;
  }

  return settings.creditCostPerClass;
}

