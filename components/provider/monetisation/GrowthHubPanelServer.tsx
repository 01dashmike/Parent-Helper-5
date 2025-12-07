'use server';

import { getProviderEntitlements } from "@/lib/monetisation/entitlements";
import GrowthHubPanelClient from "./GrowthHubPanelClient";

type GrowthHubPanelServerProps = {
  providerId: number;
  currentRanking?: number;
  estimatedMissedViews?: number;
};

/**
 * Server component that fetches provider entitlements
 * Passes data to client component for display
 */
export default async function GrowthHubPanelServer({
  providerId,
  currentRanking = 0,
  estimatedMissedViews = 0,
}: GrowthHubPanelServerProps) {
  let entitlements = {
    featuredListing: false,
    verifiedBadge: false,
    premiumAnalytics: false,
  };

  try {
    const result = await getProviderEntitlements(providerId);
    entitlements = {
      featuredListing: result.featuredListing,
      verifiedBadge: result.verifiedBadge,
      premiumAnalytics: result.premiumAnalytics,
    };
  } catch (error) {
    // Silently handle error - panel should still render with default entitlements
    console.error("[GrowthHubPanelServer] Error fetching entitlements:", error);
  }

  return (
    <GrowthHubPanelClient
      providerId={providerId}
      currentRanking={currentRanking}
      estimatedMissedViews={estimatedMissedViews}
      entitlements={entitlements}
    />
  );
}




