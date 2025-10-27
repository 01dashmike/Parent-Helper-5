"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import type { SearchResult } from "@/hooks/useSearch";
import { useSearchStore } from "@/store/searchStore";

interface ResultsListProps {
  results: SearchResult[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export default function ResultsList({
  results,
  isLoading,
  isFetching,
  page,
  onPageChange,
}: ResultsListProps) {
  const shouldReduceMotion = useReducedMotion();
  const { activeId, setActiveId } = useSearchStore((state) => ({
    activeId: state.activeId,
    setActiveId: state.setActiveId,
  }));

  const handleChangePage = (direction: "previous" | "next") => {
    onPageChange(direction === "previous" ? Math.max(1, page - 1) : page + 1);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-brand-teal">Search results</h1>
        <p className="text-sm text-brand-textMuted">
          {isFetching ? "Updating results…" : `${results.length} activities found`}
        </p>
      </header>

      <div className="space-y-3">
        {isLoading ? (
          <SkeletonList />
        ) : results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-sage/70 bg-white/70 p-8 text-center text-sm text-brand-textMuted">
            We couldn’t find any classes that match your filters. Try widening your radius or
            choosing another category.
          </div>
        ) : (
          results.map((result, index) => (
            <motion.article
              key={result.id ?? index}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
              onMouseEnter={() => setActiveId(result.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(result.id)}
              onBlur={() => setActiveId(null)}
              className={`flex flex-col gap-4 rounded-3xl border border-transparent bg-white/85 p-4 shadow-sm transition duration-300 sm:flex-row sm:items-center ${
                activeId === result.id
                  ? "border-brand-teal/60 shadow-lg"
                  : "hover:border-brand-teal/30 hover:shadow-md"
              }`}
            >
              <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-sage/50 to-brand-lavender/50 sm:h-24 sm:w-36">
                <Image
                  src="/images/placeholder.jpg"
                  alt={result.name}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 640px) 100vw, 160px"
                  priority={index < 2}
                />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-brand-teal">{result.name}</h2>
                  <p className="text-sm leading-relaxed text-brand-textMuted line-clamp-2">
                    {result.description ?? "A welcoming session designed for local families."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-brand-textMuted">
                  {result.category ? (
                    <span className="rounded-full bg-brand-sage/60 px-3 py-1 text-brand-teal">
                      {result.category}
                    </span>
                  ) : null}
                  {result.town ? <span>{result.town}</span> : null}
                  {typeof result.distance_km === "number" ? (
                    <span>{formatDistance(result.distance_km)}</span>
                  ) : null}
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="inline-flex items-center justify-center rounded-full bg-brand-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                View details
              </motion.button>
            </motion.article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-brand-sage/60 bg-white/70 p-3 text-sm text-brand-textMuted">
        <span>Page {page}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChangePage("previous")}
            disabled={page === 1}
            className="rounded-full bg-brand-sage/60 px-4 py-2 font-medium text-brand-teal transition hover:bg-brand-sage disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => handleChangePage("next")}
            className="rounded-full bg-brand-teal px-4 py-2 font-medium text-white transition hover:bg-brand-coral"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-3xl bg-gradient-to-r from-brand-sage/40 via-white to-brand-sage/40"
        />
      ))}
    </div>
  );
}

function formatDistance(distance: number) {
  if (Number.isNaN(distance)) return "";
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }
  return `${distance.toFixed(1)} km away`;
}
