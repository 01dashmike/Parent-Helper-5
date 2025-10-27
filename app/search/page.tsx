"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Filter, MapPinned } from "lucide-react";

import FiltersSidebar from "@/components/FiltersSidebar";
import MapPanel from "@/components/MapPanel";
import ResultsList from "@/components/ResultsList";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  useSearch,
  SEARCH_PAGE_SIZE,
  type SearchResponse,
  type SearchResult,
} from "@/hooks/useSearch";
import { useSearchStore } from "@/store/searchStore";

export const dynamic = "force-dynamic";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const q = useSearchStore((state) => state.q);
  const lat = useSearchStore((state) => state.lat);
  const lng = useSearchStore((state) => state.lng);
  const radiusKm = useSearchStore((state) => state.radiusKm);
  const category = useSearchStore((state) => state.category);
  const page = useSearchStore((state) => state.page);
  const setQuery = useSearchStore((state) => state.setQuery);
  const setPage = useSearchStore((state) => state.setPage);
  const hydrate = useSearchStore((state) => state.hydrate);

  const filters = useMemo(
    () => ({
      q,
      lat,
      lng,
      radiusKm,
      category,
      page,
    }),
    [q, lat, lng, radiusKm, category, page]
  );

  const keyword = q;
  const [localQuery, setLocalQuery] = useState(keyword);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  useEffect(() => {
    setLocalQuery(keyword);
  }, [keyword]);

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusParam = searchParams.get("radiusKm");
    const categoryParam = searchParams.get("category") ?? "";
    const pageParam = searchParams.get("page");

    hydrate({
      q: qParam,
      lat: latParam !== null ? parseNumber(latParam) : null,
      lng: lngParam !== null ? parseNumber(lngParam) : null,
      radiusKm: radiusParam !== null ? Math.max(1, Number(radiusParam)) : undefined,
      category: categoryParam,
      page: pageParam !== null ? Math.max(1, Number(pageParam)) : undefined,
    });
  }, [hydrate, searchParams]);

  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (typeof lat === "number") params.set("lat", lat.toString());
    if (typeof lng === "number") params.set("lng", lng.toString());
    if (radiusKm !== 5) params.set("radiusKm", radiusKm.toString());
    if (category) params.set("category", category);
    if (page !== 1) params.set("page", page.toString());

    const formatted = params.toString();
    if (formatted !== searchParamsString) {
      router.replace(`/search${formatted ? `?${formatted}` : ""}`, { scroll: false });
    }
  }, [q, lat, lng, radiusKm, category, page, router, searchParamsString]);

  const searchQuery = useSearch(filters);
  const results: SearchResult[] = (searchQuery.data as SearchResponse | undefined)?.results ?? [];
  const { isLoading, isFetching } = searchQuery;

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = ((formData.get("q") as string) ?? localQuery).trim();
    setLocalQuery(value);
    setQuery(value);
    setPage(1);
  };

  const showingRange = useMemo(() => {
    if (results.length === 0) {
      return "0";
    }
    const start = (page - 1) * SEARCH_PAGE_SIZE + 1;
    const end = start + results.length - 1;
    return `${start}-${end}`;
  }, [page, results.length]);

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-textMuted">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Parent Helper Search
            </p>
            <h1 className="text-2xl font-semibold text-brand-teal sm:text-3xl">
              Find classes near you
            </h1>
            <p className="text-sm text-brand-textMuted">
              Showing {showingRange} of {results.length} activities. Update your filters to discover
              more.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-textMuted">
            <MapPinned className="h-4 w-4 text-brand-teal" aria-hidden="true" />
            <span>Live map sync</span>
          </div>
        </div>

        <form
          onSubmit={handleKeywordSubmit}
          className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-2"
        >
          <label htmlFor="search-keyword" className="sr-only">
            Search keyword
          </label>
          <motion.input
            id="search-keyword"
            name="q"
            value={localQuery}
            onChange={(event) => setLocalQuery(event.target.value)}
            whileFocus={shouldReduceMotion ? undefined : { scale: 1.01 }}
            className="w-full rounded-full border border-brand-sage/70 bg-white px-5 py-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            placeholder="Search by name or description"
          />
          <motion.button
            type="submit"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="inline-flex items-center justify-center rounded-full bg-brand-coral px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Search
          </motion.button>
        </form>

        {isMobile ? (
          <motion.button
            type="button"
            onClick={() => setFiltersModalOpen(true)}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-brand-teal px-5 py-3 text-sm font-semibold text-brand-teal transition-colors duration-300 hover:bg-brand-teal hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Open filters
          </motion.button>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,360px)]">
        {!isMobile ? (
          <aside className="lg:col-span-1">
            <FiltersSidebar />
          </aside>
        ) : null}
        <section className="lg:col-span-1">
          <ResultsList
            results={results}
            isLoading={isLoading}
            isFetching={isFetching}
            page={page}
            onPageChange={setPage}
          />
        </section>
        <div className="lg:col-span-1">
          <MapPanel results={results} />
        </div>
      </div>

      <AnimatePresence>
        {filtersModalOpen ? (
          <motion.div
            key="filters-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-brand-cream/80 backdrop-blur"
            onClick={() => setFiltersModalOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-teal">Filters</h2>
                <button
                  type="button"
                  onClick={() => setFiltersModalOpen(false)}
                  className="rounded-full border border-brand-sage/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-textMuted hover:border-brand-teal hover:text-brand-teal"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto pr-1">
                <FiltersSidebar onClose={() => setFiltersModalOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isMobile ? (
        <p className="px-1 text-center text-xs text-brand-textMuted">
          Filters apply immediately when you tap “Apply”. Map results update in real time.
        </p>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-brand-textMuted">
          Loading search experience…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
