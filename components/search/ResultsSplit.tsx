"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { safeImage } from "@/lib/images";
import { logClassViewed } from "@/lib/analytics";
import type { ClassResult } from "./SearchPageClient";
import type { MapPoint } from "./ResultsSplitMap";

const MapPane = dynamic(() => import("./ResultsSplitMap"), {
  ssr: false,
  loading: () => <div className="h-[50vh] rounded-2xl bg-cream animate-pulse" />,
});

const isFeaturedActive = (flags?: ClassResult["featured"]) => {
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
  onHover,
  onSelect,
  cardRef,
}: ResultCardProps) {
  const { src, alt } = safeImage({
    src: undefined,
    alt: result.title,
  });

  const featured = result.featured;
  const showBoosted =
    Boolean(featured?.isBoosted) && featured?.budgetOk && featured?.windowActive;
  const showFeatured = showBoosted || isFeaturedActive(featured);
  const badgeLabel = showBoosted ? "Promoted" : "Featured";
  const badgeDescription = showBoosted
    ? "Promoted listing with boosted placement"
    : "Featured listing";

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => onHover(result.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(result.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(result.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${result.title} in ${result.town ?? "your area"}`}
      aria-pressed={isSelected}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/50 ${isSelected
        ? "border-sage/60 ring-2 ring-sage/30"
        : "border-sage/20 hover:border-sage/40"
        }`}
    >
      <div className="flex">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-2xl bg-cream/60">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 160px, 160px"
            className="object-cover object-center transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-charcoal">{result.title}</h3>
            {showFeatured && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${showBoosted
                  ? "bg-amber-100 text-amber-700"
                  : "bg-sage/15 text-sage"
                  }`}
                aria-label={badgeDescription}
              >
                {badgeLabel}
              </span>
            )}
          </div>
          {result.description && (
            <p className="line-clamp-2 text-sm text-charcoal/70">{result.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-charcoal/70">
            {result.category && (
              <span className="rounded-full bg-sage/15 px-2 py-1 text-sage" aria-label={`Category: ${result.category}`}>
                {result.category}
              </span>
            )}
            {result.town && (
              <span className="rounded-full bg-cream px-2 py-1" aria-label={`Town: ${result.town}`}>
                {result.town}
              </span>
            )}
            {result.age_range && (
              <span className="rounded-full bg-cream px-2 py-1" aria-label={`Age range: ${result.age_range}`}>
                Ages {result.age_range}
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
    </article>
  );
});

ResultCard.displayName = "ResultCard";

export default function ResultsSplit({ results }: { results: ClassResult[] }) {
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleHover = useCallback((id: number | string | null) => {
    setHoveredId(id);
  }, []);

  const organisedResults = useMemo(() => results ?? [], [results]);

  const resultLookup = useMemo(() => {
    const map = new Map<number | string, ClassResult>();
    organisedResults.forEach((item) => map.set(item.id, item));
    return map;
  }, [organisedResults]);

  const trackClassView = useCallback((record: ClassResult) => {
    logClassViewed({
      classId: record.id,
      title: record.title,
      category: record.category ?? undefined,
      location: record.town ?? undefined,
      isFeatured: isFeaturedActive(record.featured),
      searchScore: record.searchScore ?? null,
    });
  }, []);

  const handleSelect = useCallback(
    (id: number | string) => {
      setSelectedId(id);
      const record = resultLookup.get(id);
      if (record) {
        trackClassView(record);
      }
    },
    [resultLookup, trackClassView],
  );

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
      <div className="rounded-2xl border border-sage/20 bg-white p-6 text-center text-charcoal/70">
        <p className="font-medium">No classes found yet.</p>
        <p className="mt-2 text-sm">
          Try another search term or widen your town to discover more providers.
        </p>
      </div>
    );
  }

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!Array.isArray(organisedResults)) return [];

    return organisedResults
      .filter((result) => typeof result.latitude === "number" && typeof result.longitude === "number")
      .map((result) => ({
        id: result.id,
        lat: result.latitude as number,
        lng: result.longitude as number,
        name: result.title,
        venue: result.town ?? undefined,
      }));
  }, [organisedResults]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapPoints.length) {
      return [mapPoints[0].lat, mapPoints[0].lng];
    }
    return [51.5074, -0.1278];
  }, [mapPoints]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div
        className="space-y-3"
        role="list"
        aria-label="Search results for baby and toddler classes"
      >
        {organisedResults.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            isSelected={selectedId === result.id}
            isHovered={hoveredId === result.id}
            onHover={handleHover}
            onSelect={handleSelect}
            cardRef={(el) => {
              cardRefs.current[String(result.id)] = el;
            }}
          />
        ))}
      </div>
      <MapPane points={mapPoints} center={mapCenter} zoom={11} />
    </div>
  );
}
