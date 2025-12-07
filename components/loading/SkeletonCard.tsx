"use client";

import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  /**
   * Variant of the card skeleton
   * - "default": Standard card with image and content
   * - "compact": Smaller card without image
   */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Skeleton component for card-like structures
 * Matches common card layouts with image, title, description, and tags
 */
export function SkeletonCard({ variant = "default", className }: SkeletonCardProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn("skeleton-card p-4", className)}
        aria-hidden="true"
        aria-busy="true"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-12 rounded-full shrink-0" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("skeleton-card overflow-hidden", className)}
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image skeleton */}
        <Skeleton className="h-40 w-full shrink-0 sm:h-28 sm:w-40 rounded-t-surface sm:rounded-l-surface sm:rounded-t-none" />
        
        {/* Content skeleton */}
        <div className="flex-1 p-3 space-y-2 min-w-0">
          {/* Title skeleton */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-12 rounded-full shrink-0" />
          </div>
          
          {/* Description skeleton */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          
          {/* Tags skeleton */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

