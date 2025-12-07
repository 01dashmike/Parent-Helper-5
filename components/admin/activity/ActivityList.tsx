"use client";

import { Button } from "@/components/ui/button";
import { ActivityItem, type ActivityLogEntry } from "./ActivityItem";

interface ActivityListProps {
  activities: ActivityLogEntry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function ActivityList({ activities, loading, hasMore, onLoadMore }: ActivityListProps) {
  if (activities.length === 0 && !loading) {
    return (
      <div className="rounded-lg border border-sage/20 bg-white p-12 text-center">
        <p className="text-slateSoft">No activity found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-list">
      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>

      {loading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading activities">
          <div className="animate-pulse bg-charcoal/10 rounded-xl h-16"></div>
          <div className="animate-pulse bg-charcoal/10 rounded-xl h-16"></div>
          <div className="animate-pulse bg-charcoal/10 rounded-xl h-16"></div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center">
          <Button onClick={onLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

