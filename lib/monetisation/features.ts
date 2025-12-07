/**
 * Feature Management Utilities
 * 
 * Functions to activate/deactivate provider features
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import type { FeatureType } from "./entitlements";

/**
 * Activate a feature for a provider
 */
export async function activateFeature(params: {
  providerId: number;
  featureType: FeatureType;
  subscriptionItemId?: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Deactivate any existing active feature of this type
  await supabase
    .from("provider_features")
    .update({ status: "expired" })
    .eq("provider_id", params.providerId)
    .eq("feature_type", params.featureType)
    .eq("status", "active");

  // Create new feature
  const { data: feature, error } = await supabase
    .from("provider_features")
    .insert({
      provider_id: params.providerId,
      feature_type: params.featureType,
      subscription_item_id: params.subscriptionItemId || null,
      status: "active",
      expires_at: params.expiresAt || null,
      metadata: params.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to activate feature: ${error.message}`);
  }

  // Create specific feature records
  if (params.featureType === "featured_listing") {
    await supabase.from("provider_featured_listings").insert({
      provider_id: params.providerId,
      feature_id: feature.id,
      priority: 0,
    });
  } else if (params.featureType === "verified_badge") {
    await supabase.from("provider_verified_status").upsert({
      provider_id: params.providerId,
      feature_id: feature.id,
      verified_at: new Date().toISOString(),
    });
  }

  return feature.id;
}

/**
 * Deactivate a feature for a provider
 */
export async function deactivateFeature(
  providerId: number,
  featureType: FeatureType
): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  await supabase
    .from("provider_features")
    .update({ status: "expired" })
    .eq("provider_id", providerId)
    .eq("feature_type", featureType)
    .eq("status", "active");
}

/**
 * Log monetisation event
 */
export async function logMonetisationEvent(params: {
  providerId?: number;
  franchiseId?: number;
  eventType: string;
  eventData?: Record<string, unknown>;
  stripeEventId?: string;
  createdBy?: string;
}): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("monetisation_logs").insert({
    provider_id: params.providerId || null,
    franchise_id: params.franchiseId || null,
    event_type: params.eventType,
    event_data: params.eventData || {},
    stripe_event_id: params.stripeEventId || null,
    created_by: params.createdBy || null,
  });
}

/**
 * Create revenue event
 */
export async function createRevenueEvent(params: {
  providerId?: number;
  franchiseId?: number;
  eventType: "subscription_started" | "subscription_renewed" | "subscription_canceled" | "subscription_upgraded" | "subscription_downgraded" | "one_time_payment";
  amountCents: number;
  currency?: string;
  billingPeriod?: "monthly" | "quarterly" | "annually";
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  eventDate: string;
}): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  await supabase.from("revenue_events").insert({
    provider_id: params.providerId || null,
    franchise_id: params.franchiseId || null,
    event_type: params.eventType,
    amount_cents: params.amountCents,
    currency: params.currency || "gbp",
    billing_period: params.billingPeriod || null,
    stripe_invoice_id: params.stripeInvoiceId || null,
    stripe_payment_intent_id: params.stripePaymentIntentId || null,
    event_date: params.eventDate,
  });
}


