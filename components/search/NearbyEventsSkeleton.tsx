"use client";

import { memo } from "react";
import { Skeleton } from "@/components/loading/Skeleton";
import { List, ListItem } from "@/components/lists";

/**
 * Skeleton loader for NearbyEvents component
 * Matches the structure of event cards
 */
export const NearbyEventsSkeleton = memo(function NearbyEventsSkeleton(): React.ReactNode {
  return (
    <section className="mt-8 space-y-4" aria-busy="true" aria-label="Loading nearby events">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <List 
        aria-label="Loading nearby events"
        className="space-y-3"
        aria-busy="true"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItem
            key={i}
            className="overflow-hidden rounded-2xl border border-sage/20 bg-white shadow-card"
            aria-hidden="true"
          >
            <article className="w-full">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Title */}
                  <Skeleton className="h-6 w-3/4" />
                  
                  {/* Description */}
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  
                  {/* Metadata (date, venue, online badge) */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                
                {/* Action button */}
                <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
              </div>
            </div>
            </article>
          </ListItem>
        ))}
      </List>
    </section>
  );
});

NearbyEventsSkeleton.displayName = "NearbyEventsSkeleton";

