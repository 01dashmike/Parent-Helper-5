"use client";

import { CompleteFamilyProfileCard } from "./CompleteFamilyProfileCard";
import { SavedSearchesBlock } from "./SavedSearchesBlock";
import { EarnRewardsBanner } from "./EarnRewardsBanner";
import type { SearchFilters } from "@/lib/types/search";

type SavedSearch = {
  id: string;
  query: string;
  town: string | null;
  filters: SearchFilters | null;
  created_at: string;
};

type GrowthLoopCardsProps = {
  childCount: number;
  savedSearches: SavedSearch[];
  referralCode: string | null;
  referralsSent: number;
};

export function GrowthLoopCards({
  childCount,
  referralCode,
  referralsSent,
  savedSearches,
}: GrowthLoopCardsProps) {
  // Only render if at least one card should be shown
  const showFamilyCard = childCount === 0;
  const showSearches = savedSearches && savedSearches.length > 0;
  const showRewards = referralsSent === 0 && referralCode !== null;

  if (!showFamilyCard && !showSearches && !showRewards) {
    return null;
  }

  return (
    <div className="section-container">
      <div className="section-block">
        <div className="grid-responsive gap-card">
        {showFamilyCard && (
          <div className="md:col-span-1">
            <CompleteFamilyProfileCard childCount={childCount} />
          </div>
        )}
        
        {showSearches && (
          <div className={showFamilyCard ? "md:col-span-1" : "md:col-span-2"}>
            <SavedSearchesBlock searches={savedSearches} />
          </div>
        )}
        
        {showRewards && (
          <div className={showFamilyCard && showSearches ? "md:col-span-1 lg:col-span-3" : "md:col-span-2"}>
            <EarnRewardsBanner referralCode={referralCode} referralsSent={referralsSent} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

