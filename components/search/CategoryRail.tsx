"use client";

import { useMemo, useCallback, memo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { Button } from "@/components/ui/button";
import { FilterToggleButton } from "./Filters/FilterToggleButton";

const CATS = [
  { key: "Sensory", label: "Sensory", icon: "🧸" },
  { key: "Music", label: "Music", icon: "🎵" },
  { key: "Dance", label: "Dance", icon: "💃" },
  { key: "Yoga", label: "Yoga", icon: "🧘" },
  { key: "STEM", label: "STEM", icon: "🔬" },
  { key: "Outdoors", label: "Outdoors", icon: "🌲" },
  { key: "Arts", label: "Arts", icon: "🎨" },
  { key: "Storytime", label: "Story", icon: "📚" },
  { key: "Sports", label: "Sports", icon: "⚽" },
] as const;

const CategoryRail = memo(function CategoryRail(): React.ReactNode {
  const params = useSearchParams();
  const router = useRouter();
  const active = params?.get("category") ?? "";
  const [isFiltering, setIsFiltering] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      active ||
      params?.get("day") ||
      params?.get("fromTime") ||
      params?.get("toTime") ||
      (params?.get("radiusKm") && params?.get("radiusKm") !== "20")
    );
  }, [active, params]);

  // Detect when filters are being applied (URL is changing)
  // Extract URL params to separate variables for dependency array
  const dayParam = params?.get("day");
  const fromTimeParam = params?.get("fromTime");
  const toTimeParam = params?.get("toTime");
  const radiusKmParam = params?.get("radiusKm");
  
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 500); // Show loader for 500ms after filter change
    return () => clearTimeout(timer);
  }, [active, dayParam, fromTimeParam, toTimeParam, radiusKmParam]);

  const setCategory = useCallback((key: string): void => {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (active === key) next.delete("category");
    else next.set("category", key);
    router.push(`/search?${next.toString()}`);
  }, [active, params, router]);

  const clearAllFilters = useCallback((): void => {
    const next = new URLSearchParams();
    // Preserve search query and town if they exist
    const query = params?.get("q");
    const town = params?.get("town");
    if (query) next.set("q", query);
    if (town) next.set("town", town);
    router.push(`/search?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <nav 
        className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        role="navigation"
        aria-label="Filter classes by category"
        aria-busy={isFiltering ? "true" : "false"}
      >
        {isFiltering && (
          <div className="flex items-center gap-2 px-2" role="status" aria-live="polite" aria-label="Applying filters">
            <Loader2 size={iconSize.sm} className="motion-safe:animate-spin motion-reduce:animate-none text-sage" aria-hidden="true" />
            <span className="sr-only">Applying filters</span>
          </div>
        )}
        {CATS.map((cat, index) => {
          const isActive = cat.key === active;
          return (
            <FilterToggleButton
              key={cat.key}
              isActive={isActive}
              label={`${cat.label} classes`}
              icon={cat.icon}
              onClick={() => setCategory(cat.key)}
              index={index}
              ariaLabel={`${isActive ? "Remove" : "Filter by"} ${cat.label} classes`}
            />
          );
        })}
      </nav>
      {hasActiveFilters && (
        <Button
          type="button"
          onClick={clearAllFilters}
          size="sm"
          variant="outline"
          className="shrink-0 rounded-xl sm:self-center"
          aria-label="Clear all filters"
        >
          Clear all
        </Button>
      )}
    </div>
  );
});

CategoryRail.displayName = "CategoryRail";

export default CategoryRail;
