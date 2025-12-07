"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for city page class cards
 * Matches the structure of class cards displayed on city pages
 */
export const CityClassCardSkeleton = memo(function CityClassCardSkeleton(): React.ReactNode {
  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="skeleton-card overflow-hidden"
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image skeleton */}
        <Skeleton className="h-40 w-full shrink-0 sm:h-32 sm:w-48 rounded-t-xl sm:rounded-l-xl sm:rounded-t-none" />
        
        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-3 min-w-0">
          {/* Title and badge */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          
          {/* Metadata (age, location, price) */}
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Tags/Categories */}
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </motion.article>
  );
});

CityClassCardSkeleton.displayName = "CityClassCardSkeleton";

