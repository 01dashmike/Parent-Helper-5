/**
 * Ranking Integration for Monetisation
 * 
 * Fetches provider monetisation features and applies them to ranking
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { getProviderEntitlements } from "./entitlements";

/**
 * Get monetisation boosts for a provider
 */
export async function getProviderMonetisationBoosts(providerId: number | null): Promise<{
  hasFeaturedListing: boolean;
  hasVerifiedBadge: boolean;
  featuredPriority: number;
}> {
  if (!providerId) {
    return {
      hasFeaturedListing: false,
      hasVerifiedBadge: false,
      featuredPriority: 0,
    };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      hasFeaturedListing: false,
      hasVerifiedBadge: false,
      featuredPriority: 0,
    };
  }

  const entitlements = await getProviderEntitlements(providerId);

  // Get featured listing priority
  let featuredPriority = 0;
  if (entitlements.featuredListing) {
    const { data: featuredListing } = await supabase
      .from("provider_featured_listings")
      .select("priority")
      .eq("provider_id", providerId)
      .eq("status", "active")
      .single();

    featuredPriority = featuredListing?.priority ?? 0;
  }

  return {
    hasFeaturedListing: entitlements.featuredListing,
    hasVerifiedBadge: entitlements.verifiedBadge,
    featuredPriority,
  };
}








