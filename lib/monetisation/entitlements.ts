/**
 * Subscription Entitlement Resolver
 * 
 * Determines what features a provider has access to
 */

import { getSupabaseServer } from "@/lib/supabase/server";

export type FeatureType = "featured_listing" | "verified_badge" | "premium_analytics" | "franchise_boost";

export type ProviderEntitlements = {
  featuredListing: boolean;
  verifiedBadge: boolean;
  premiumAnalytics: boolean;
  franchiseBoost: boolean;
  featuredListingExpiresAt?: string | null;
  verifiedBadgeExpiresAt?: string | null;
  premiumAnalyticsExpiresAt?: string | null;
};

/**
 * Get active entitlements for a provider
 */
export async function getProviderEntitlements(providerId: number): Promise<ProviderEntitlements> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      featuredListing: false,
      verifiedBadge: false,
      premiumAnalytics: false,
      franchiseBoost: false,
    };
  }

  const now = new Date().toISOString();

  // Get active features
  const { data: features } = await supabase
    .from("provider_features")
    .select("feature_type, expires_at")
    .eq("provider_id", providerId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const entitlements: ProviderEntitlements = {
    featuredListing: false,
    verifiedBadge: false,
    premiumAnalytics: false,
    franchiseBoost: false,
  };

  (features || []).forEach((feature: { feature_type?: string; expires_at?: string | null }) => {
    switch (feature.feature_type) {
      case "featured_listing":
        entitlements.featuredListing = true;
        entitlements.featuredListingExpiresAt = feature.expires_at;
        break;
      case "verified_badge":
        entitlements.verifiedBadge = true;
        entitlements.verifiedBadgeExpiresAt = feature.expires_at;
        break;
      case "premium_analytics":
        entitlements.premiumAnalytics = true;
        entitlements.premiumAnalyticsExpiresAt = feature.expires_at;
        break;
      case "franchise_boost":
        entitlements.franchiseBoost = true;
        break;
    }
  });

  return entitlements;
}

/**
 * Check if provider has a specific feature
 */
export async function hasFeature(providerId: number, featureType: FeatureType): Promise<boolean> {
  const entitlements = await getProviderEntitlements(providerId);
  switch (featureType) {
    case "featured_listing":
      return entitlements.featuredListing;
    case "verified_badge":
      return entitlements.verifiedBadge;
    case "premium_analytics":
      return entitlements.premiumAnalytics;
    case "franchise_boost":
      return entitlements.franchiseBoost;
  }
}

/**
 * Check if analytics metric is locked (preview mode)
 */
export async function isAnalyticsLocked(
  providerId: number,
  metricType: string
): Promise<boolean> {
  const supabase = getSupabaseServer();
  if (!supabase) return true;

  // If provider has premium analytics, nothing is locked
  const hasPremium = await hasFeature(providerId, "premium_analytics");
  if (hasPremium) return false;

  // Check specific lock
  const { data: lock } = await supabase
    .from("analytics_preview_locks")
    .select("is_locked")
    .eq("provider_id", providerId)
    .eq("metric_type", metricType)
    .single();

  return lock?.is_locked ?? true;
}

