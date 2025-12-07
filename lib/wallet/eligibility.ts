/**
 * Credit Eligibility Checks
 * 
 * Functions to check if credits/passes can be used for bookings
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { getActivePass, type ParentPass } from "./passes";
import { getParentWallet } from "./core";
import type { ProviderCreditSettingsRow } from "./types";

export type ProviderCreditSettings = {
  providerId: number;
  acceptsCredits: boolean;
  creditCostPerClass: number;
  unlimitedPassPrice?: number;
  unlimitedPassType?: "weekly" | "monthly";
  classOverrides: Record<string, { creditCost?: number; acceptsCredits?: boolean }>;
};

/**
 * Get provider credit settings
 */
export async function getProviderCreditSettings(
  providerId: number
): Promise<ProviderCreditSettings | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: settings, error } = await supabase
    .from("provider_credit_settings")
    .select("*")
    .eq("provider_id", providerId)
    .single();

  if (error || !settings) {
    // Return default settings if none exist
    return {
      providerId,
      acceptsCredits: false,
      creditCostPerClass: 1,
      classOverrides: {},
    };
  }

  return {
    providerId: settings.provider_id,
    acceptsCredits: settings.accepts_credits,
    creditCostPerClass: settings.credit_cost_per_class,
    unlimitedPassPrice: settings.unlimited_pass_price || undefined,
    unlimitedPassType: settings.unlimited_pass_type || undefined,
    classOverrides: (settings.class_overrides as Record<string, { creditCost?: number; acceptsCredits?: boolean }>) || {},
  };
}

/**
 * Check if provider accepts credits
 */
export async function providerAcceptsCredits(providerId: number): Promise<boolean> {
  const settings = await getProviderCreditSettings(providerId);
  return settings?.acceptsCredits || false;
}

/**
 * Get credit cost for a specific class
 */
export async function creditCostForClass(
  classId: number,
  providerSettings?: ProviderCreditSettings
): Promise<number | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  // Get class provider if settings not provided
  let settings = providerSettings;
  if (!settings) {
    const { data: classData } = await supabase
      .from("classes")
      .select("provider_id")
      .eq("id", classId)
      .single();

    if (!classData) return null;

    settings = (await getProviderCreditSettings(classData.provider_id)) ?? undefined;
  }

  if (!settings || !settings.acceptsCredits) {
    return null;
  }

  // Check for class override
  const override = settings.classOverrides[classId.toString()];
  if (override && override.acceptsCredits === false) {
    return null; // Class explicitly disabled
  }

  if (override && override.creditCost !== undefined) {
    return override.creditCost;
  }

  return settings.creditCostPerClass;
}

/**
 * Check if user can book a class with credits
 */
export type CreditEligibilityResult = {
  canUseCredits: boolean;
  canUsePass: boolean;
  creditCost?: number;
  pass?: ParentPass;
  reason?: string;
};

export async function canBookWithCredits(
  userId: string,
  classId: number
): Promise<CreditEligibilityResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { canUseCredits: false, canUsePass: false, reason: "Database not configured" };
  }

  // Get class and provider
  const { data: classData } = await supabase
    .from("classes")
    .select("provider_id")
    .eq("id", classId)
    .single();

  if (!classData) {
    return { canUseCredits: false, canUsePass: false, reason: "Class not found" };
  }

  const providerId = classData.provider_id;

  // Check provider settings
  const settings = await getProviderCreditSettings(providerId);
  if (!settings || !settings.acceptsCredits) {
    return { canUseCredits: false, canUsePass: false, reason: "Provider does not accept credits" };
  }

  // Check class override
  const override = settings.classOverrides[classId.toString()];
  if (override && override.acceptsCredits === false) {
    return { canUseCredits: false, canUsePass: false, reason: "Class does not accept credits" };
  }

  // Get credit cost
  const creditCost = await creditCostForClass(classId, settings);
  if (!creditCost) {
    return { canUseCredits: false, canUsePass: false, reason: "Credit cost not available" };
  }

  // Check wallet balance
  const wallet = await getParentWallet(userId);
  const hasEnoughCredits = wallet ? wallet.creditBalance >= creditCost : false;

  // Check for active pass
  const pass = await getActivePass(userId, providerId.toString());

  return {
    canUseCredits: hasEnoughCredits,
    canUsePass: !!pass,
    creditCost,
    pass: pass || undefined,
  };
}

/**
 * Get all providers that accept credits (for discovery)
 */
export async function getProvidersAcceptingCredits(): Promise<number[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data: settings } = await supabase
    .from("provider_credit_settings")
    .select("provider_id")
    .eq("accepts_credits", true);

  if (!settings) return [];

  return settings.map((s: ProviderCreditSettingsRow) => s.provider_id);
}

