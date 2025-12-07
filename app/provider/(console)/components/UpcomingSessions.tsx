"use client";

import { memo } from "react";
import type { DashboardData } from "../actions";
import { EmptyState } from "@/components/ui/emptystate";

interface UpcomingSessionsProps {
  occurrences: DashboardData["overview"]["upcomingOccurrences"];
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const UpcomingSessions = memo(function UpcomingSessions({ occurrences }: UpcomingSessionsProps) {
  if (occurrences.length === 0) {
    return (
      <div className="mt-3 sm:mt-4">
        <EmptyState
          title="No upcoming sessions"
          description="Plan ahead by adding upcoming sessions. Once scheduled, they will appear here for a quick snapshot."
          iconVariant="calendar"
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
      {occurrences.map((occurrence) => (
        <div
          key={occurrence.id}
          className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-charcoal break-words">
              {occurrence.classes?.title ?? "Untitled class"}
            </p>
            <p className="text-small text-charcoal/60">
              {occurrence.venues?.name ?? "No venue"}
            </p>
          </div>
          <div className="text-small text-charcoal/80">
            <p>{dateFormatter.format(new Date(occurrence.starts_at))}</p>
            {occurrence.ends_at ? (
              <p className="text-small text-charcoal/60">
                Ends {dateFormatter.format(new Date(occurrence.ends_at))}
              </p>
            ) : null}
          </div>
          <span className="inline-flex w-fit rounded-full bg-sage/15 px-2 py-1 text-small font-medium uppercase tracking-wide text-forest sm:px-3">
            {occurrence.status}
          </span>
        </div>
      ))}
    </div>
  );
});

