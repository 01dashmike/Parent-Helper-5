/**
 * Skeleton loading component for ResultCard
 * Matches the visual structure of ResultCard for smooth loading transitions
 */

"use client";

import { memo } from "react";
import { SkeletonCard } from "@/components/loading/SkeletonCard";

export const ResultCardSkeleton = memo(function ResultCardSkeleton(): React.ReactNode {
  return <SkeletonCard variant="default" />;
});

ResultCardSkeleton.displayName = "ResultCardSkeleton";

