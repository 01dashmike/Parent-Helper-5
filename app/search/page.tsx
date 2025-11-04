import { Suspense } from "react";
import CategoryRail from "@/components/search/CategoryRail";
import QuickFilters from "@/components/search/QuickFilters";
import ResultsSplit from "@/components/search/ResultsSplit";
import SearchBarSticky from "@/components/search/SearchBarSticky";

export const metadata = {
  title: "Search classes | Parent Helper",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="bg-cream text-charcoal min-h-screen">
      <Suspense fallback={<div className="h-20 border-b border-sage/20" />}>
        <SearchBarSticky />
      </Suspense>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Suspense fallback={<div className="h-12 rounded-full bg-white/60" />}>
          <CategoryRail />
        </Suspense>
        <div className="rounded-2xl border border-sage/20 bg-white/70 p-4">
          <Suspense fallback={<div className="h-10 rounded-full bg-white/40" />}>
            <QuickFilters />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-[60vh] rounded-2xl border border-sage/20 bg-white/60" />}>
          <ResultsSplit />
        </Suspense>
      </div>
    </div>
  );
}
