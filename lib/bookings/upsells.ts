/**
 * Upsell Management
 * 
 * Functions for managing upsells and tracking analytics
 */

import { getSupabaseServer } from "@/lib/supabase/server";
// Analytics tracking - placeholder for now
async function track(event: string, data: Record<string, any>) {
  // TODO: Implement analytics tracking
  console.log(`[Analytics] ${event}:`, data);
}

export type UpsellItem = {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "block_upgrade" | "add_on" | "subscription_offer";
  metadata?: Record<string, any>;
};

/**
 * Get available upsells for a class/provider
 */
export async function getAvailableUpsells(
  providerId: number,
  classId?: number
): Promise<UpsellItem[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("upsells")
    .select("*")
    .eq("provider_id", providerId)
    .eq("is_enabled", true)
    .order("display_order", { ascending: true });

  if (classId) {
    // Get class-specific or provider-wide upsells
    query = query.or(`class_id.is.null,class_id.eq.${classId}`);
  } else {
    query = query.is("class_id", null); // Provider-wide only
  }

  const { data: upsells, error } = await query;

  if (error) {
    console.error("[getAvailableUpsells] Error:", error);
    return [];
  }

  return (upsells || []).map((u: any) => ({
    id: u.id,
    title: u.title,
    description: u.description || "",
    price: parseFloat(u.price?.toString() || "0"),
    type: u.type as UpsellItem["type"],
    metadata: u.metadata || {},
  }));
}

/**
 * Track upsell view
 */
export async function trackUpsellView(
  upsellId: number,
  sessionId?: number
): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("upsell_analytics").insert({
    upsell_id: upsellId,
    event_type: "viewed",
    session_id: sessionId || null,
  });

  await track("upsell_viewed", {
    upsell_id: upsellId,
    session_id: sessionId,
  });
}

/**
 * Track upsell acceptance
 */
export async function trackUpsellAccepted(
  upsellId: number,
  bookingId: number
): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("upsell_analytics").insert({
    upsell_id: upsellId,
    booking_id: bookingId,
    event_type: "accepted",
  });

  await track("upsell_accepted", {
    upsell_id: upsellId,
    booking_id: bookingId,
  });
}

