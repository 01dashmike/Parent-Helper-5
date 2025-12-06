"use client";

import { useState, useRef, useCallback, useMemo, useEffect, memo, lazy, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ClassResult } from "./SearchPageClient";
import type { MapPoint } from "./ResultsSplitMap";

// Lazy load heavy map component for code splitting
const MapPane = lazy(() => import("./ResultsSplitMap").then(m => ({ default: m.MapPane })));
import { logClassViewed } from "@/lib/analytics/client";
import { logSearch } from "@/lib/logging";
import { track } from "@/lib/analytics/index";
import { trackFunnelStepStarted } from "@/lib/analytics/funnels";
import { safeImage } from "@/lib/images";
import { safeFetch } from "@/lib/client/safeFetch";
import { EmptyState } from "@/components/ui/emptystate";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { CardContainer } from "@/components/cards";
import { List, ListItem } from "@/components/lists";

const isFeaturedActive = (flags?: ClassResult["featured"]): boolean => {
  if (!flags) return false;
  if (!flags.budgetOk) return false;
  if (!flags.windowActive) return false;
  return Boolean(flags.isBoosted || flags.listingStatus === "active");
};

interface ResultCardProps {
  result: ClassResult;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: number | string | null) => void;
  onSelect: (id: number | string) => void;
  cardRef: (el: HTMLElement | null) => void;
}

const ResultCard = memo(function ResultCard({
  result,
  isSelected,
  isHovered: _isHovered,
  onHover,
  onSelect,
  cardRef,
}: ResultCardProps) {
  // Guard: return null if result is invalid
  if (!result || !result.id || !result.title) {
    return null;
  }

  // Construct alt text with class name and provider name if available
  // Note: Provider name may not be available in all result types
  const imageAlt = result.title || "Class image";
  const { src, alt } = safeImage({
    src: result.primaryImage || undefined,
    alt: imageAlt,
  });

  const featured = result.featured;
  const showBoosted =
    Boolean(featured?.isBoosted) && featured?.budgetOk && featured?.windowActive;
  const showFeatured = showBoosted || isFeaturedActive(featured);
  const badgeLabel = showBoosted ? "Promoted" : "Featured";
  const badgeDescription = showBoosted
    ? "Promoted listing with boosted placement"
    : "Featured listing";

  // Distance and next session from search results
  type SearchResultWithExtras = typeof result & { distanceKm?: number; nextSession?: { start_time?: string | null } | null };
  const resultWithExtras = result as SearchResultWithExtras;
  const distanceKm = resultWithExtras.distanceKm;
  const nextSession = resultWithExtras.nextSession?.start_time;
  const distanceText = distanceKm !== undefined ? `${distanceKm.toFixed(1)} km away` : null;

  return (
    <CardContainer
      as={motion.article}
      ref={cardRef}
      interactive
      selected={isSelected}
      ariaLabel={`${result.title}${result.town ? ` in ${result.town}` : ""}${distanceText ? `, ${distanceText}` : ""}. Press Enter to view details`}
      onMouseEnter={() => result?.id != null && onHover(result.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => result?.id != null && onSelect(result.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: motionTokens.medium, ease: motionTokens.easeOut }}
      whileHover={{ 
        y: -4,
        transition: { duration: motionTokens.fast }
      }}
      whileTap={{ scale: 0.98 }}
      className="overflow-hidden motion-reduce:transition-none motion-reduce:animate-none forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]"
    >
      <div className="flex flex-col sm:flex-row">
        <motion.div 
          className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-xl bg-cream/60 sm:h-28 sm:w-40 sm:rounded-l-xl sm:rounded-t-none forced-colors:bg-[Canvas]"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: motionTokens.medium }}
        >
          <Image
            src={src}
            alt={alt || `${result.title}${result.town ? ` in ${result.town}` : ""} class image`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 160px, 160px"
            className="object-cover object-center"
            loading="lazy"
            quality={85}
          />
        </motion.div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-body font-semibold text-charcoal sm:text-title break-words flex-1 min-w-0">{result.title}</h3>
            {showFeatured && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`inline-flex items-center rounded-full px-2 py-1 text-small font-semibold ${showBoosted
                  ? "bg-amber-100 text-amber-700"
                  : "bg-sage/15 text-forest forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]"
                  }`}
                aria-label={badgeDescription}
              >
                {badgeLabel}
              </motion.span>
            )}
          </div>
          {result.description && (
            <p className="line-clamp-2 text-small text-text-tertiary break-words" lang="en">{result.description}</p>
          )}
          <div className="mt-sm flex flex-wrap items-center gap-2 text-small text-text-tertiary">
            {result.category && (
              <span className="rounded-full bg-sage/15 px-2 py-1 text-forest forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]" aria-label={`Category: ${result.category}`}>
                {result.category}
              </span>
            )}
            {result.town && (
              <span className="rounded-full bg-cream px-2 py-1 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]" aria-label={`Town: ${result.town}`}>
                {result.town}
              </span>
            )}
            {result.age_range && (
              <span className="rounded-full bg-cream px-2 py-1 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]" aria-label={`Age range: ${result.age_range}`}>
                <span aria-hidden="true">Ages {result.age_range}</span>
                <VisuallyHidden>Age range: {result.age_range}</VisuallyHidden>
              </span>
            )}
            {distanceText && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700" aria-label={`Distance: ${distanceText}`}>
                {distanceText}
              </span>
            )}
            {nextSession && (
              <span className="rounded-full bg-cream px-2 py-1" aria-label={`Next session: ${nextSession}`}>
                Next: {nextSession}
              </span>
            )}
            {featured?.planSlug && showFeatured && (
              <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700" aria-label="Plan type">
                {featured.planSlug === "bookings"
                  ? "Bookings Plan"
                  : featured.planSlug === "promote"
                    ? "Promote Plan"
                    : "Featured"}
              </span>
            )}
          </div>
        </div>
      </div>
    </CardContainer>
  );
});

ResultCard.displayName = "ResultCard";

interface ResultsSplitProps {
  results?: ClassResult[];
  onResetFilters?: () => void;
  loading?: boolean;
}

export default function ResultsSplit({ results = [], onResetFilters }: ResultsSplitProps): React.ReactNode {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);
  const searchParams = useSearchParams();

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const parentRef = useRef<HTMLDivElement>(null);

  const handleHover = useCallback((id: number | string | null): void => {
    setHoveredId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: callback should remain stable, setHoveredId is stable from useState
  }, []);

  const organisedResults = useMemo(() => {
    if (!results) return [];
    if (!Array.isArray(results)) return [];
    if (results.length === 0) return [];
    // Filter out any null/undefined items
    return results.filter((r): r is ClassResult => r != null && r.id != null);
  }, [results]);

  const resultLookup = useMemo(() => {
    const map = new Map<number | string, ClassResult>();
    organisedResults.forEach((item) => map.set(item.id, item));
    return map;
  }, [organisedResults]);

  // Virtualizer for search results
  const virtualizer = useVirtualizer({
    count: organisedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated height of each result card
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
  });

  const trackClassView = useCallback((record: ClassResult): void => {
    logClassViewed({
      classId: record.id,
      title: record.title,
      category: record.category ?? undefined,
      location: record.town ?? undefined,
      isFeatured: isFeaturedActive(record.featured),
      searchScore: record.searchScore ?? null,
    });
    
    // Track class view via new abstraction
    track("class_viewed", {
      classId: record.id,
      title: record.title,
      category: record.category ?? null,
      location: record.town ?? null,
      isFeatured: isFeaturedActive(record.featured),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Reason: callback should remain stable, logClassViewed is a stable function
  }, []);

  const router = useRouter();

  const handleSelect = useCallback(
    (id: number | string): void => {
      setSelectedId(id);
      const record = resultLookup.get(id);
      if (record) {
        trackClassView(record);
        
        // Track search → click conversion
        trackFunnelStepStarted({
          funnelName: "search_conversion",
          funnelStep: "class_clicked",
          metadata: {
            classId: record.id,
            query: searchParams?.get("q") || undefined,
            town: searchParams?.get("town") || undefined,
            category: record.category || undefined,
            isFeatured: isFeaturedActive(record.featured),
          },
        });
        
        // Log search result click
        const query = searchParams?.get("q") || undefined;
        const town = searchParams?.get("town") || undefined;
        const category = searchParams?.get("category") || undefined;
        const age = searchParams?.get("age") || undefined;
        const resultPosition = organisedResults.findIndex((r) => r.id === id) + 1;
        
        logSearch({
          action: "result_clicked",
          searchQuery: query,
          town,
          category,
          age,
          classId: typeof record.id === "number" ? record.id : undefined,
          resultPosition: resultPosition > 0 ? resultPosition : undefined,
          isFeatured: isFeaturedActive(record.featured),
          metadata: {
            title: record.title,
            category: record.category || undefined,
            town: record.town || undefined,
          },
        }).catch(() => {
          // Silently fail - logging should never break the app
        });
        
        // Navigate to class detail page
        router.push(`/class/${id}`);
      }
    },
    [resultLookup, trackClassView, router, searchParams, organisedResults],
  );

  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  
  // Extract query and town early for use in empty state
  const query = searchParams?.get("q") || "";
  const town = searchParams?.get("town") || "";

  // Fetch transformed map points from server
  useEffect(() => {
    if (organisedResults.length === 0) {
      setMapPoints([]);
      return;
    }

    const controller = new AbortController();
    const fetchMapPoints = async () => {
      const result = await safeFetch<{
        data: { mapPoints?: MapPoint[] };
      }>("/api/search/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: organisedResults,
          transform: "mapPoints",
        }),
        signal: controller.signal,
      });

      if (result.ok && result.data?.data?.mapPoints) {
        setMapPoints(result.data.data.mapPoints);
      }
    };

    fetchMapPoints();
    return () => controller.abort();
  }, [organisedResults]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!mapPoints || mapPoints.length === 0) {
      return [51.5074, -0.1278]; // Fallback to London
    }
    const firstPoint = mapPoints[0];
    if (!firstPoint) {
      return [51.5074, -0.1278]; // Fallback to London
    }
    // Validate coordinates are safe
    if (
      typeof firstPoint.lat === "number" &&
      typeof firstPoint.lng === "number" &&
      !isNaN(firstPoint.lat) &&
      !isNaN(firstPoint.lng) &&
      firstPoint.lat >= -90 &&
      firstPoint.lat <= 90 &&
      firstPoint.lng >= -180 &&
      firstPoint.lng <= 180
    ) {
      return [firstPoint.lat, firstPoint.lng];
    }
    return [51.5074, -0.1278]; // Fallback to London
  }, [mapPoints]);

  useEffect(() => {
    if (selectedId != null) {
      const key = String(selectedId);
      const el = cardRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedId]);

  if (!organisedResults.length) {
    return (
      <div className="grid grid-cols-1 gap-section lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <EmptyState
          title="No classes found"
          description={
            query
              ? `We couldn't find anything matching "${query}"${town ? ` in ${town}` : " in your area"}.`
              : town
                ? `We couldn't find any classes${town ? ` in ${town}` : ""}. Try adjusting your filters or exploring different categories.`
                : "We couldn't find any classes matching your search. Try adjusting your filters or explore our categories."
          }
          iconVariant="search"
          actionLabel={onResetFilters ? "Clear Filters" : "Explore Categories"}
          actionOnClick={onResetFilters || undefined}
          actionHref={!onResetFilters ? "/search" : undefined}
          size="default"
        />
        <div className="h-[60vh] rounded-xl border border-sage/20 bg-cream/50 flex items-center justify-center forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]" role="status">
          <div className="text-center">
            <h3 className="text-small font-semibold text-charcoal">No locations to display</h3>
            <p className="mt-xs text-small text-charcoal/50">No class locations are available for this search.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Results count announcement */}
      {organisedResults.length > 0 && (
        <div aria-live="polite" aria-atomic="true" className="lg:col-span-2">
          <p className="text-small text-text-tertiary">
            {organisedResults.length} {organisedResults.length === 1 ? "class" : "classes"} found{query ? ` for "${query}"` : ""}{town ? ` near ${town}` : ""}
          </p>
        </div>
      )}
      <div
        ref={parentRef}
        className="min-w-0 overflow-auto"
        style={{ height: "calc(100vh - 200px)", maxHeight: "800px" }}
      >
        <List
          aria-label={`${organisedResults.length} search result${organisedResults.length !== 1 ? "s" : ""} for baby and toddler classes`}
          aria-busy="false"
          interactive
          className="relative space-y-4"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const result = organisedResults[virtualItem.index];
            if (!result || !result.id) return null;
            return (
              <ListItem
                key={virtualItem.key}
                interactive
                selected={selectedId === result.id}
                onClick={() => result?.id != null && handleSelect(result.id)}
                aria-label={`${result.title}${result.town ? ` in ${result.town}` : ""}. Press Enter to view details`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className=""
              >
                <ResultCard
                  result={result}
                  isSelected={selectedId === result.id}
                  isHovered={hoveredId === result.id}
                  onHover={handleHover}
                  onSelect={handleSelect}
                  cardRef={(el) => {
                    cardRefs.current[String(result.id)] = el;
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </div>
      {mapPoints.length > 0 ? (
        <Suspense fallback={
          <div className="h-[60vh] rounded-xl border border-sage/20 bg-cream/50 flex items-center justify-center">
            <p className="text-small text-charcoal/50">Loading map...</p>
          </div>
        }>
          <MapPane key={`map-${mapPoints.length}-${mapCenter[0]}-${mapCenter[1]}`} points={mapPoints} center={mapCenter} zoom={11} />
        </Suspense>
      ) : (
        <div className="h-[60vh] rounded-xl border border-sage/20 bg-cream/50 flex items-center justify-center forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder]">
          <p className="text-small text-charcoal/50">No locations to display</p>
        </div>
      )}
    </div>
  );
}
