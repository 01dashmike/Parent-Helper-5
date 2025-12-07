"use client";

import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { motionTokens } from "@/lib/motion/tokens";
import ResultsSplit from "./ResultsSplit";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

// Lazy load heavy components for code splitting
const NearbyEvents = lazy(() => import("./NearbyEvents").then(m => ({ default: m.default })));
import { ResultCardSkeleton } from "./ResultCardSkeleton";
import { SaveSearchButton } from "./SaveSearchButton";
import { SaveSearchFAB } from "./SaveSearchFAB";
import { isNearbyEventsEnabled } from "@/lib/env";
import { logSearchPerformed } from "@/lib/analytics/client";
import { track } from "@/lib/analytics/index";
import { SearchResultsResponseSchema, ClassResultSchema, type ClassResult as SchemaClassResult } from "@/lib/schemas/api-responses";
import { validateArrayResponse } from "@/lib/validation/api-validation";
import { safeFetch } from "@/lib/client/safeFetch";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { announceSearchResults } from "@/lib/a11y/announce";
import { ErrorState } from "@/components/ui/errorstate";
import { EmptyState } from "@/components/ui/emptystate";

function buildItemListSchema(results: ClassResult[], query: string, town: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk";
  
  const items = results.slice(0, 20).map((result, index) => {
    const itemUrl = `${baseUrl}/class/${result.id}`;
    const image = result.primaryImage
      ? result.primaryImage.startsWith("http")
        ? result.primaryImage
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${result.primaryImage}`
      : undefined;
    
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: result.title,
        description: result.description || undefined,
        image,
        url: itemUrl,
        provider: {
          "@type": "Organization",
          name: result.venueName || "Class Provider",
        },
        offers: result.priceLabel
          ? {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: result.priceLabel,
            availability: "https://schema.org/InStock",
          }
          : undefined,
        audience: {
          "@type": "Audience",
          audienceType: result.ageRangeLabel || "Babies and Toddlers",
        },
      },
    };
  });

  const listName = query
    ? `"${query}" Classes for Babies & Toddlers`
    : town
      ? `Baby & Toddler Classes in ${town}`
      : "Baby & Toddler Classes Near You";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    description: `Search results for ${query ? `"${query}"` : "baby and toddler classes"}${town ? ` in ${town}` : ""}`,
    numberOfItems: results.length,
    itemListElement: items,
  };
}

export type ClassResult = {
  id: number | string;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  town: string | null;
  age_range: string | null;
  slug?: string | null;
  venueName?: string | null;
  primaryImage?: string | null;
  scheduleSummary?: string | null;
  ageRangeLabel?: string | null;
  priceLabel?: string | null;
  featured?: {
    isBoosted: boolean;
    hasPlan: boolean;
    planSlug: string | null;
    budgetOk: boolean;
    windowActive: boolean;
    listingStatus: string | null;
  } | null;
  searchScore?: number | null;
};

export default function SearchPageClient(): React.ReactNode {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const safeParams = params ?? new URLSearchParams();
  const searchQueryString = safeParams.toString();

  const query = safeParams.get("q") ?? "";
  const town = safeParams.get("town") ?? "";
  const age = safeParams.get("age") ?? "";

  const [results, setResults] = useState<ClassResult[]>([]);
  // Start with loading=true if there are search params (user came with a query)
  const [loading, setLoading] = useState(() => searchQueryString.length > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      // Build query string from current params, ensuring all params are included
      const url = `/api/search${searchQueryString ? `?${searchQueryString}` : ""}`;
      const result = await safeFetch<{ results: ClassResult[] }>(url, { 
        signal: controller.signal 
      });

      if (!result.ok) {
        // Handle abort gracefully
        if (result.error === "Request was cancelled") {
          return; // Don't set error for cancelled requests
        }
        setError(result.error || "We couldn't load classes right now. Please try again.");
        setLoading(false);
        return;
      }

      // Validate API response
      const validation = validateArrayResponse(
        ClassResultSchema,
        result.data?.results ?? [],
        { logErrors: true }
      );

      // Transform validated data to match local ClassResult type
      const payload: ClassResult[] = (validation.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        category: item.category ?? null,
        town: item.town ?? null,
        age_range: item.age_range ?? null,
        slug: item.slug ?? null,
        venueName: item.venueName ?? null,
        primaryImage: item.primaryImage ?? null,
        scheduleSummary: item.scheduleSummary ?? null,
        ageRangeLabel: item.ageRangeLabel ?? null,
        priceLabel: item.priceLabel ?? null,
        featured: item.featured
          ? {
              isBoosted: item.featured.isBoosted ?? false,
              hasPlan: item.featured.hasPlan ?? false,
              planSlug: item.featured.planSlug ?? null,
              budgetOk: item.featured.budgetOk ?? false,
              windowActive: item.featured.windowActive ?? false,
              listingStatus: item.featured.listingStatus ?? null,
            }
          : null,
        searchScore: item.searchScore ?? null,
      }));
      
      // Log warnings if validation had issues
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn("[SearchPageClient] Validation warnings:", validation.warnings);
      }
      
      setResults(payload);

      // Announce search results to screen readers
      announceSearchResults(payload.length, query || undefined, town || undefined);

      // Transform data on server to reduce client-side computation
      const transformResult = await safeFetch<{
        data: {
          featuredCount?: number;
          eventsLocation?: { lat: number | null; lng: number | null };
        };
      }>("/api/search/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: payload, transform: "all" }),
        signal: controller.signal,
      });

      const featuredCount =
        transformResult.ok && transformResult.data?.data?.featuredCount
          ? transformResult.data.data.featuredCount
          : 0;

      // Log search with current values (derived from URL params)
      logSearchPerformed({
        query,
        location: town,
        ageRange: age,
        resultCount: payload.length,
        featuredCount,
      });

      // Track search interaction via new abstraction
      track("search_performed", {
        query: query || null,
        location: town || null,
        ageRange: age || null,
        resultCount: payload.length,
        featuredCount,
      });

      setLoading(false);
    };

    fetchResults();
    return () => controller.abort();
  }, [searchQueryString, query, town, age]);

  const headline = useMemo(() => {
    if (town && query) return `"${query}" classes in ${town}`;
    if (town) return `Classes in ${town}`;
    if (query) return `"${query}" classes near you`;
    return "Classes near you";
  }, [query, town]);

  // Store transformed data from server
  const [transformedData, setTransformedData] = useState<{
    featuredCount: number;
    eventsLocation: { lat: number | null; lng: number | null };
  }>({
    featuredCount: 0,
    eventsLocation: { lat: null, lng: null },
  });

  // Fetch transformed data when results change
  useEffect(() => {
    if (results.length === 0) {
      setTransformedData({
        featuredCount: 0,
        eventsLocation: { lat: null, lng: null },
      });
      return;
    }

    const controller = new AbortController();
    const fetchTransforms = async () => {
      const result = await safeFetch<{
        data: {
          featuredCount?: number;
          eventsLocation?: { lat: number | null; lng: number | null };
        };
      }>("/api/search/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, transform: "all" }),
        signal: controller.signal,
      });

      if (result.ok && result.data?.data) {
        setTransformedData({
          featuredCount: result.data.data.featuredCount ?? 0,
          eventsLocation:
            result.data.data.eventsLocation ?? { lat: null, lng: null },
        });
      }
    };

    fetchTransforms();
    return () => controller.abort();
  }, [results]);

  const { eventsLocation } = transformedData;

  const handleResetFilters = useCallback(() => {
    // Start from current params to preserve unrelated query parameters
    const next = new URLSearchParams(searchQueryString);
    next.delete("category");
    next.delete("day");
    next.delete("fromTime");
    next.delete("toTime");
    next.delete("radiusKm");

    const queryString = next.toString();
    router.push(`/search${queryString ? `?${queryString}` : ""}`);
  }, [router, searchQueryString]);

  // Inject structured data when results are available
  useEffect(() => {
    if (results.length === 0 || loading) return;

    // Remove existing structured data script
    const existingScript = document.getElementById("search-structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    // Build and inject ItemList schema
    const schema = buildItemListSchema(results, query, town);
    const script = document.createElement("script");
    script.id = "search-structured-data";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById("search-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [results, query, town, loading]);

  return (
    <ErrorBoundaryWrapper>
      <main role="main" className="min-h-screen bg-cream text-charcoal forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]">
        <div className="section-container">
          <div className="section-block">
            <noscript>
              <div className="mb-4 rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-small text-charcoal">
                <p className="font-medium mb-1">JavaScript is disabled</p>
                <p>Some features like live search results and instant filters require JavaScript. Basic search functionality will still work.</p>
              </div>
            </noscript>
            <div className="flex flex-col gap-6">
        {/* Screen reader announcements for search results */}
        <VisuallyHidden
          as="div"
          aria-live="polite"
          aria-atomic="true"
          key={`${loading}-${results.length}-${error ? "error" : "ok"}`}
        >
          {loading ? (
            <span>Loading results...</span>
          ) : error ? (
            <span>Error loading results</span>
          ) : results.length > 0 ? (
            <span>
              {results.length} {results.length === 1 ? "result" : "results"} found{query ? ` for "${query}"` : ""}{town ? ` near ${town}` : ""}
            </span>
          ) : (
            <span role="status" aria-live="polite">No results found</span>
          )}
        </VisuallyHidden>

        {/* Visible results count announcement */}
        {!loading && !error && results.length > 0 && (
          <div aria-live="polite" aria-atomic="true">
            <p className="text-small text-text-tertiary">
              {results.length} {results.length === 1 ? "class" : "classes"} found{query ? ` for "${query}"` : ""}{town ? ` near ${town}` : ""}
            </p>
          </div>
        )}

            <header className="space-y-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold uppercase tracking-wide text-forest">
                    Search Parent Helper
                  </p>
                  <h1 id="page-title" className="text-display-2 font-semibold text-charcoal break-words" lang="en">{headline}</h1>
                  <p className="section-description sm:max-w-2xl">
                    Browse trusted baby and toddler classes from our community partners. Adjust the town or
                    keywords above to discover new sessions.
                  </p>
                </div>
            <div className="mt-2 sm:mt-6 sm:shrink-0">
              <noscript>
                <p className="text-small text-charcoal/60 mb-2">Save search requires JavaScript</p>
              </noscript>
              <SaveSearchButton />
              </div>
            </div>
          </header>

        {loading && (
          <section
            className="grid grid-cols-1 gap-section lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            aria-busy="true"
          >
            <section className="space-y-3" aria-label="Loading search results" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <ResultCardSkeleton key={`skeleton-${index}`} />
              ))}
            </section>
            <div 
              className="h-[60vh] rounded-xl border border-sage/20 bg-cream/50 flex items-center justify-center" 
              aria-label="Loading map" 
              role="img" 
              aria-busy="true"
            >
              <div className="text-small text-charcoal/50">Loading map...</div>
            </div>
          </section>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: motionTokens.medium }}
            >
              <ErrorState
                title="Unable to load classes"
                message={error}
                onRetry={() => {
                  setError(null);
                  // Trigger refetch by updating a dependency
                  const next = new URLSearchParams(searchQueryString);
                  next.set("_retry", Date.now().toString());
                  router.push(`/search?${next.toString()}`);
                }}
                retryLabel="Try again"
                isDynamic={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!loading && !error && (
            <motion.div
              key="results"
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: motionTokens.medium }}
            >
              <ResultsSplit results={results} onResetFilters={handleResetFilters} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && !!isNearbyEventsEnabled() && eventsLocation.lat != null && eventsLocation.lng != null && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2, duration: motionTokens.medium }}
          >
            <Suspense fallback={null}>
              <NearbyEvents
                latitude={eventsLocation.lat}
                longitude={eventsLocation.lng}
                radiusKm={10}
              />
            </Suspense>
          </motion.div>
        )}
            </div>
          </div>
        </div>

        {/* Floating Save Search Button */}
        <SaveSearchFAB />
      </main>
    </ErrorBoundaryWrapper>
  );
}

