"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { logSearch, logClassInteraction } from "@/lib/analytics";

const MapPane = dynamic(() => import("./ResultsSplitMap"), {
  ssr: false,
  loading: () => <div className="h-[50vh] rounded-2xl bg-cream animate-pulse" />,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Memoized ResultCard component to prevent unnecessary re-renders
interface ResultCardProps {
  result: any;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  cardRef: (el: HTMLElement | null) => void;
}

const ResultCard = memo(function ResultCard({
  result,
  isSelected,
  isHovered,
  onHover,
  onSelect,
  cardRef,
}: ResultCardProps) {
  const r = result;
  
  return (
    <article
      ref={cardRef}
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(r.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(r.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${r.class_name} in ${r.postcode || "your area"}`}
      aria-pressed={isSelected}
      className={`
        overflow-hidden rounded-2xl border bg-white shadow-sm 
        cursor-pointer transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-sage/50
        ${
          isSelected
            ? "border-sage/60 ring-2 ring-sage/30"
            : "border-sage/20 hover:border-sage/40"
        }
      `}
    >
      <div className="flex">
        <div className="h-28 w-40 shrink-0 relative">
          <Image
            src={r.image_url || "/images/categories/arts.jpg"}
            alt={`${r.class_name} - ${r.category} class for babies and toddlers`}
            fill
            sizes="160px"
            className="object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 p-3">
          <h3 className="text-lg font-semibold text-charcoal">{r.class_name}</h3>
          <p className="text-sm text-slateSoft line-clamp-2">{r.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span 
              className="rounded-full bg-sage/15 px-2 py-1 text-charcoal"
              aria-label={`Category: ${r.category}`}
            >
              {r.category}
            </span>
            {(r.day_of_week !== null && r.start_time && r.end_time) && (
              <span 
                className="rounded-full bg-terracotta/10 px-2 py-1 text-terracotta"
                aria-label={`Schedule: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][r.day_of_week]} ${r.start_time} to ${r.end_time}`}
              >
                {typeof r.day_of_week === "number"
                  ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r.day_of_week]
                  : ""}{" "}
                {r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}
              </span>
            )}
            {r.postcode && (
              <span 
                className="rounded-full bg-cream px-2 py-1 text-charcoal/70"
                aria-label={`Location: ${r.postcode}`}
              >
                {r.postcode}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

export default function ResultsSplit() {
  const params = useSearchParams();
  const query = params?.toString() ?? "";
  
  // Optimized SWR configuration for better caching and performance
  const { data, isLoading } = useSWR(`/api/search?${query}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // Dedupe requests within 30 seconds
    keepPreviousData: true, // Keep previous data while fetching new data
  });

  const results = data?.results ?? [];

  // Log search analytics when results change
  useEffect(() => {
    if (!isLoading && results.length >= 0) {
      const params = new URLSearchParams(query);
      logSearch({
        query: params.get("q") || undefined,
        location: params.get("loc") || undefined,
        category: params.get("category") || undefined,
        ageRange: params.get("minAge") && params.get("maxAge")
          ? `${params.get("minAge")}-${params.get("maxAge")}`
          : undefined,
        dayOfWeek: params.get("day") || undefined,
        resultCount: results.length,
      });
    }
  }, [query, results.length, isLoading]);

  // State for synchronized interaction between map and results
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  
  // Refs for scrolling result cards into view
  const cardRefs = useRef<{ [key: number]: HTMLElement | null }>({});

  // Memoized callbacks to prevent unnecessary re-renders
  const handleHover = useCallback((id: number | null) => {
    setHoveredId(id);
  }, []);

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    
    // Log class interaction
    const selectedClass = results.find((r: any) => r.id === id);
    if (selectedClass) {
      logClassInteraction({
        action: "click",
        classId: selectedClass.id,
        category: selectedClass.category,
        location: selectedClass.postcode,
      });
    }
  }, [results]);

  // Scroll selected card into view when marker is clicked
  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div 
        className="space-y-3"
        role="list"
        aria-label="Search results for baby and toddler classes"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="h-32 rounded-2xl border border-sage/20 bg-white/60 animate-pulse"
                role="status"
                aria-label="Loading class information"
              />
            ))
          : results.length
          ? results.map((r: any) => (
              <ResultCard
                key={r.id}
                result={r}
                isSelected={selectedId === r.id}
                isHovered={hoveredId === r.id}
                onHover={handleHover}
                onSelect={handleSelect}
                cardRef={(el) => (cardRefs.current[r.id] = el)}
              />
            ))
          : (
              <div 
                className="rounded-2xl border border-sage/20 bg-white p-6 text-center text-slateSoft"
                role="status"
              >
                <p>No classes match your filters yet.</p>
                <p className="mt-2 text-sm">Try adjusting the day or distance to see more results.</p>
              </div>
            )}
      </div>
      <MapPane 
        results={results} 
        selectedId={selectedId}
        hoveredId={hoveredId}
        activeResultId={hoveredId}
        onMarkerClick={handleSelect}
      />
    </div>
  );
}
