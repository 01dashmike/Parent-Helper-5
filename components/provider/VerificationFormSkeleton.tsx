"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for VerificationForm component
 * Matches the structure of document upload sections
 */
export function VerificationFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading verification form">
      {/* Overall Status Card */}
      <div className="skeleton-card p-6" aria-hidden="true">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Document Upload Sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card p-6" aria-hidden="true">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

