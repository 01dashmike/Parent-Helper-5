"use client";

import { SkeletonCard } from "./SkeletonCard";
import { cn } from "@/lib/utils";

interface SkeletonListProps {
  /**
   * Number of skeleton items to render
   */
  count?: number;
  /**
   * Variant of the card skeleton
   */
  variant?: "default" | "compact";
  /**
   * Grid layout classes
   */
  gridClassName?: string;
  /**
   * Container className
   */
  className?: string;
}

/**
 * Skeleton component for lists of cards
 * Renders multiple SkeletonCard components in a grid
 */
export function SkeletonList({
  count = 3,
  variant = "default",
  gridClassName,
  className,
}: SkeletonListProps) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", gridClassName, className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} variant={variant} />
      ))}
    </div>
  );
}

