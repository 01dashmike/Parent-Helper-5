"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useSearchStore } from "@/store/searchStore";
import { useIsMobile } from "@/hooks/useMediaQuery";

export function ResultsList() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const results = useSearchStore((state) => state.getFilteredResults());
  const highlightResult = useSearchStore((state) => state.highlightResult);
  const clearHighlight = useSearchStore((state) => state.clearHighlight);

  const animation = useMemo(
    () => ({
      initial: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
      animate: shouldReduceMotion ? {} : { opacity: 1, y: 0 },
      transition: {
        duration: shouldReduceMotion ? 0 : isMobile ? 0.25 : 0.4,
        ease: "easeOut" as const,
      },
    }),
    [shouldReduceMotion, isMobile]
  );

  return (
    <section
      aria-label="Search results"
      className="relative z-10 flex flex-col gap-4 overflow-y-auto px-4 pb-28 pt-6 md:h-screen md:px-8 md:pb-10"
    >
      {results.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-brand-teal shadow">No classes found.</p>
      ) : (
        results.map((result, index) => (
          <motion.article
            key={result.id}
            {...animation}
            transition={{ ...animation.transition, delay: shouldReduceMotion ? 0 : index * 0.05 }}
            className="group flex flex-col gap-4 rounded-3xl bg-white/95 p-4 shadow-sm ring-1 ring-brand-sage/50 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1"
            onMouseEnter={() => highlightResult(result.id)}
            onMouseLeave={() => clearHighlight()}
            onFocus={() => highlightResult(result.id)}
            onBlur={() => clearHighlight()}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-36 w-full overflow-hidden rounded-2xl sm:w-48">
                <Image
                  src={result.imageUrl}
                  alt={result.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 200px"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <header className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-brand-teal">{result.title}</h3>
                  <p className="text-sm text-brand-teal/70">{result.description}</p>
                </header>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-brand-teal/80">
                  <span className="rounded-full bg-brand-sage/70 px-3 py-1">
                    {result.distanceKm.toFixed(1)} km
                  </span>
                  <span className="rounded-full bg-brand-lavender/70 px-3 py-1">
                    {result.category}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <button
                    type="button"
                    className="rounded-full bg-brand-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))
      )}
    </section>
  );
}
