"use client";

import { memo, useMemo } from "react";
import GrowthScoreCard from "@/components/provider/GrowthScoreCard";
import ImproveScoreChecklist from "@/components/provider/ImproveScoreChecklist";
import { EmptyState } from "@/components/ui/emptystate";
import type { DashboardData } from "../actions";

interface GrowthScoreClientProps {
  data: DashboardData["growthScore"] | null;
}

const GrowthScoreClient = memo(function GrowthScoreClient({ data }: GrowthScoreClientProps) {
  // Memoize the breakdown calculation
  const breakdown = useMemo(() => {
    if (!data) return null;
    return {
      bookingGrowth: 50, // Would be calculated from previous week comparison
      conversionRate: data.metrics.views && data.metrics.views > 0
        ? ((data.metrics.bookings || 0) / data.metrics.views) * 100
        : 0,
      profileCompleteness: data.metrics.profile_completion || 0,
      reviewAverage: ((data.metrics.reviews_score || 0) / 5) * 100,
    };
  }, [data]);

  if (!data) {
    return (
      <EmptyState
        title="No growth score data available yet"
        description="Your growth score will appear here once you have activity data."
        iconVariant="inbox"
        size="sm"
      />
    );
  }

  if (!breakdown) return null;

  return (
    <div className="space-y-6">
      <GrowthScoreCard
        currentScore={data.growthScore}
        previousScore={data.previousScore}
        breakdown={breakdown}
        nextBestAction={data.nextBestAction?.title}
      />
      <ImproveScoreChecklist
        profileCompletion={data.metrics.profile_completion || 0}
        reviewCount={data.metrics.reviews_score || 0}
        recentReviews={data.metrics.recentReviews || 0}
        hasImages={data.metrics.hasPhotos || false}
        hasDescription={(data.metrics.profile_completion || 0) > 50}
        conversionRate={data.metrics.conversionRate || 0}
        reviewResponseRate={data.metrics.reviewResponseRate || 0}
        totalReviews={data.metrics.totalReviews || 0}
        reviewsWithResponses={data.metrics.reviewsWithResponses || 0}
      />
    </div>
  );
});

export default GrowthScoreClient;
