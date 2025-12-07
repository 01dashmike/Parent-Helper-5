/**
 * Referral Conversion Analytics Utility
 * 
 * Type-safe utility for tracking referral conversions to prevent duplication
 * and ensure consistent event structure.
 */

import { getSupabaseServer } from "@/lib/supabase.server";

export type ReferralSource = "member" | "provider";

export interface ReferralConversionEvent {
  referral_code: string;
  referrer_user_id: string | null;
  referred_user_id?: string | null;
  provider_id?: number | null;
  source: ReferralSource;
  timestamp: string;
}

/**
 * Track a referral conversion event
 * 
 * @param event - Referral conversion event data
 * @returns Promise that resolves when event is logged
 */
export async function trackReferralConversion(
  event: ReferralConversionEvent
): Promise<void> {
  const serverSupabase = getSupabaseServer();
  
  if (!serverSupabase) {
    console.error("[trackReferralConversion] Supabase server client not available");
    return;
  }

  try {
    // Use the existing log_event RPC function
    await serverSupabase.rpc("log_event", {
      p_event_type: "referral_converted",
      p_user_id: event.referrer_user_id,
      p_metadata: {
        referral_code: event.referral_code,
        referrer_user_id: event.referrer_user_id,
        referred_user_id: event.referred_user_id ?? null,
        provider_id: event.provider_id ?? null,
        source: event.source,
        timestamp: event.timestamp,
      },
    });
  } catch (error) {
    // Silent fail - analytics should never break the app
    console.error("[trackReferralConversion] Failed to log event:", error);
  }
}

