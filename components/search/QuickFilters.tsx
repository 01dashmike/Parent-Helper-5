"use client";

import { useState, useEffect, memo, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Loader2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { announceFiltersApplied } from "@/lib/a11y/announce";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const QuickFilters = memo(function QuickFilters(): React.ReactNode {
  const params = useSearchParams();
  const router = useRouter();
  const dayId = useId();
  const fromTimeId = useId();
  const toTimeId = useId();
  const radiusId = useId();

  // Initialize state from URL params
  // Initialize with safe defaults to prevent hydration mismatches, then sync in useEffect
  const [day, setDay] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [isFiltering, setIsFiltering] = useState(false);

  // Sync state from URL when URL changes (browser back/forward)
  // This also handles initial sync to prevent hydration mismatches
  useEffect(() => {
    setDay(params?.get("day") ?? "");
    setFromTime(params?.get("fromTime") ?? "");
    setToTime(params?.get("toTime") ?? "");
    const radius = params?.get("radiusKm");
    if (radius) {
      const num = Number(radius);
      if (!isNaN(num) && num >= 1 && num <= 40) {
        setRadiusKm(num);
      } else {
        setRadiusKm(20);
      }
    } else {
      setRadiusKm(20);
    }
  }, [params]);

  // Update URL when filters change (debounced to avoid excessive updates)
  useEffect(() => {
    const currentDay = params?.get("day") ?? "";
    const currentFromTime = params?.get("fromTime") ?? "";
    const currentToTime = params?.get("toTime") ?? "";
    const currentRadius = params?.get("radiusKm");
    const currentRadiusNum = currentRadius ? Number(currentRadius) : 20;

    // Check if state matches URL to avoid unnecessary updates
    if (
      day === currentDay &&
      fromTime === currentFromTime &&
      toTime === currentToTime &&
      radiusKm === currentRadiusNum
    ) {
      return;
    }

    setIsFiltering(true);
    const id = setTimeout(() => {
      const next = new URLSearchParams(params?.toString() ?? "");
      
      if (day) next.set("day", day);
      else next.delete("day");
      
      if (fromTime) next.set("fromTime", fromTime);
      else next.delete("fromTime");
      
      if (toTime) next.set("toTime", toTime);
      else next.delete("toTime");
      
      if (radiusKm !== 20) {
        next.set("radiusKm", String(radiusKm));
      } else {
        next.delete("radiusKm");
      }
      
      router.replace(`/search?${next.toString()}`, { scroll: false });
      
      // Count active filters for announcement
      const activeFilters = [day, fromTime, toTime, radiusKm !== 20 ? radiusKm : null].filter(Boolean).length;
      announceFiltersApplied(activeFilters);
      
      // Hide loader after navigation completes
      setTimeout(() => {
        setIsFiltering(false);
      }, 500);
    }, 300);
    
    return () => clearTimeout(id);
  }, [day, fromTime, toTime, radiusKm, params, router]);

  return (
    <fieldset 
      className="grid grid-cols-1 gap-card sm:grid-cols-2 md:grid-cols-4"
      aria-label="Quick filters for class search"
      aria-busy={isFiltering ? "true" : "false"}
    >
      <VisuallyHidden as="legend">Refine your class search</VisuallyHidden>
      {isFiltering && (
        <div className="flex items-center gap-2 col-span-full" role="status" aria-live="polite" aria-label="Applying filters">
          <Loader2 size={iconSize.sm} className="motion-safe:animate-spin motion-reduce:animate-none text-sage" aria-hidden="true" />
          <span className="text-small text-text-tertiary">Applying filters...</span>
        </div>
      )}
      
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <label htmlFor={dayId} className="input-label text-slateSoft opacity-70 sm:opacity-100">Day</label>
        <select 
          id={dayId}
          value={day} 
          onChange={(e) => setDay(e.target.value)} 
          className="input input-md w-full"
          aria-label="Filter by day of the week"
        >
          <option value="">Any</option>
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <label htmlFor={fromTimeId} className="input-label text-slateSoft opacity-70 sm:opacity-100">From</label>
        <input 
          id={fromTimeId}
          type="time" 
          value={fromTime} 
          onChange={(e) => setFromTime(e.target.value)} 
          className="input input-md w-full"
          aria-label="Filter by start time"
        />
      </div>
      
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <label htmlFor={toTimeId} className="input-label text-slateSoft opacity-70 sm:opacity-100">To</label>
        <input 
          id={toTimeId}
          type="time" 
          value={toTime} 
          onChange={(e) => setToTime(e.target.value)} 
          className="input input-md w-full"
          aria-label="Filter by end time"
        />
      </div>
      
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor={radiusId} className="input-label text-slateSoft opacity-70 sm:opacity-100">
          <VisuallyHidden>Search radius filter</VisuallyHidden>
          <span aria-hidden="true">Distance</span>
        </label>
        <div className="flex items-center gap-2 flex-1">
          <input
            id={radiusId}
            type="range"
            min={1}
            max={40}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            aria-label={`Search radius: ${radiusKm} kilometres`}
            aria-valuemin={1}
            aria-valuemax={40}
            aria-valuenow={radiusKm}
            aria-valuetext={`${radiusKm} kilometres`}
            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          />
          <span className="w-12 text-small shrink-0" aria-live="polite" aria-label={`${radiusKm} kilometres`}>
            <span aria-hidden="true">{radiusKm}km</span>
          </span>
        </div>
      </div>
    </fieldset>
  );
});

QuickFilters.displayName = "QuickFilters";

export default QuickFilters;
