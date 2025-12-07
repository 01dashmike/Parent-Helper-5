"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CityClassCardSkeleton } from "./CityClassCardSkeleton";

/**
 * Skeleton loader for city page classes section
 * Displays multiple class card skeletons in a grid
 */
export const CityClassesSkeleton = memo(function CityClassesSkeleton(): React.ReactNode {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading classes">
      {/* Section header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Grid of class cards */}
      <div className="grid-responsive gap-section">
        {Array.from({ length: 6 }).map((_, index) => (
          <CityClassCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
});

CityClassesSkeleton.displayName = "CityClassesSkeleton";

