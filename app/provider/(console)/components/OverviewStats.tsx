"use client";

import { memo } from "react";
import type { DashboardData } from "../actions";

interface OverviewStatsProps {
  data: DashboardData["overview"];
}

export const OverviewStats = memo(function OverviewStats({ data }: OverviewStatsProps) {
  return (
    <section>
      <h2 className="text-title font-semibold text-charcoal">At a glance</h2>
      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
          <p className="text-small uppercase tracking-wide text-charcoal/80">Total classes</p>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">{data.totalClasses}</p>
          <p className="mt-1 text-small text-charcoal/70">
            {data.publishedClasses} published, {data.totalClasses - data.publishedClasses} drafts
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
          <p className="text-small uppercase tracking-wide text-charcoal/80">Venues</p>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">{data.totalVenues}</p>
          <p className="mt-1 text-small text-charcoal/70">
            Keep venue details accurate for better discovery.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-soft">
          <p className="text-small uppercase tracking-wide text-charcoal/80">Upcoming sessions</p>
          <p className="mt-2 text-display-2 font-semibold text-charcoal">
            {data.upcomingOccurrences.length}
          </p>
          <p className="mt-1 text-small text-charcoal/70">
            Next {data.upcomingOccurrences.length ? "week of" : "sessions appear here when scheduled."}
          </p>
        </article>
      </div>
    </section>
  );
});

