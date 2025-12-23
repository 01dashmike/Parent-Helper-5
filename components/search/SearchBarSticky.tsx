"use client";

import { useState, useEffect, useId, memo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useExperiment } from "@/hooks/useExperiment";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Loader2, MapPin } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

function deriveAgeValue(params: ReadonlyURLSearchParams | null): string {
  // Check for age param first (used by SearchPageClient)
  const ageParam = params?.get("age");
  if (ageParam) return ageParam;
  
  // Fallback to minAge/maxAge for backward compatibility
  const min = params?.get("minAge");
  const max = params?.get("maxAge");
  if (!min || !max) return "";
  return `${min}-${max}`;
}

const SearchBarSticky = memo(function SearchBarSticky(): React.ReactNode {
  const router = useRouter();
  const params = useSearchParams();
  const searchVariant = useExperiment("search_layout");
  const townId = useId();
  const activityId = useId();
  const ageId = useId();

  // Initialize state from URL params - use 'town' consistently
  // Initialize with empty strings to prevent hydration mismatches, then sync in useEffect
  const [town, setTown] = useState("");
  const [q, setQ] = useState("");
  const [age, setAge] = useState("");
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  
  // Location detection state
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Categories state for activity dropdown
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Sync state from URL when URL changes (browser back/forward)
  // This also handles initial sync to prevent hydration mismatches
  useEffect(() => {
    const urlTown = params?.get("town") ?? params?.get("loc") ?? "";
    const urlQ = params?.get("q") ?? "";
    const urlAge = deriveAgeValue(params);
    
    setTown(urlTown);
    setQ(urlQ);
    setAge(urlAge);
  }, [params]);

  // Default categories as fallback
  const DEFAULT_CATEGORIES = [
    "Sensory",
    "Music",
    "Dance",
    "Yoga",
    "STEM",
    "Outdoors",
    "Arts",
    "Storytime",
    "Sports",
    "Swimming",
    "Gymnastics",
    "Baby Signing",
    "Playgroup",
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          } else {
            // Use default categories if API returns empty
            setCategories(DEFAULT_CATEGORIES);
          }
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Handle location detection
  const handleDetectLocation = useCallback(async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    setIsDetectingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      );
      const coords = position.coords;

      // Reverse geocode to get city/town name
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
        );
        if (response.ok) {
          const data = await response.json();
          const city = data.city || data.locality || data.principalSubdivision;
          if (city) {
            setTown(city);
            setIsLocationFocused(false);
            return;
          }
        }
      } catch {
        // Fallback to coordinates if reverse geocoding fails
      }

      // Use coordinates as fallback
      const coordString = `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
      setTown(coordString);
      setIsLocationFocused(false);
    } catch {
      // Handle user denial or other errors gracefully
    } finally {
      setTimeout(() => setIsDetectingLocation(false), 800);
    }
  }, []);

  // Update URL when filters change (debounced to avoid excessive updates)
  useEffect(() => {
    const currentTown = params?.get("town") ?? params?.get("loc") ?? "";
    const currentQ = params?.get("q") ?? "";
    const currentAge = deriveAgeValue(params);

    // Check if state matches URL to avoid unnecessary updates
    if (town === currentTown && q === currentQ && age === currentAge) {
      setIsApplyingFilters(false);
      return;
    }

    // Show loading state when filters are changing
    setIsApplyingFilters(true);

    const id = setTimeout(() => {
      const next = new URLSearchParams(params?.toString() ?? "");
      
      // Use 'town' param consistently, remove 'loc' if present
      if (town) {
        next.set("town", town);
        next.delete("loc"); // Remove old 'loc' param
      } else {
        next.delete("town");
        next.delete("loc");
      }
      
      if (q) {
        next.set("q", q);
      } else {
        next.delete("q");
      }
      
      // Use 'age' param consistently, remove minAge/maxAge if present
      if (age) {
        next.set("age", age);
        next.delete("minAge");
        next.delete("maxAge");
      } else {
        next.delete("age");
        next.delete("minAge");
        next.delete("maxAge");
      }
      
      router.replace(`/search?${next.toString()}`, { scroll: false });
      // Keep loading state until URL actually changes (handled by params effect)
    }, 350);
    
    return () => {
      clearTimeout(id);
      setIsApplyingFilters(false);
    };
  }, [town, q, age, params, router]);

  // Variant B: Compact layout with icons
  const isVariantB = searchVariant === "B";

  return (
    <div className={`sticky top-16 z-30 border-b border-sage/20 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/70 ${isVariantB ? "shadow-sm" : ""}`}>
      <form 
        action="/search"
        method="get"
        className={`mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:gap-3 md:flex-row md:items-center md:gap-2 ${isVariantB ? "md:py-2" : ""}`}
        role="search"
        aria-label="Search for baby and toddler classes"
        onSubmit={(e) => {
          e.preventDefault();
          router.refresh();
        }}
      >
        <VisuallyHidden as="label" htmlFor={townId}>
          Location: Enter town or postcode
        </VisuallyHidden>
        <div className="relative flex-1 min-w-0">
          <input
            id={townId}
            name="town"
            className="ph-input w-full pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            placeholder={isVariantB ? "Location" : "Enter town or postcode"}
            value={town}
            onChange={(e) => setTown(e.target.value)}
            onFocus={() => setIsLocationFocused(true)}
            onBlur={() => {
              // Delay hiding to allow button click
              setTimeout(() => setIsLocationFocused(false), 200);
            }}
            type="text"
            autoComplete="postal-code"
            tabIndex={0}
          />
          {/* Location detection button - always visible as icon */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-sage hover:text-sage-dark hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 motion-safe:transition-colors disabled:opacity-50"
            aria-label={isDetectingLocation ? "Detecting your location..." : "Use my current location"}
          >
            {isDetectingLocation ? (
              <Loader2 size={iconSize.sm} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <MapPin size={iconSize.sm} aria-hidden="true" />
            )}
          </button>
          {/* Location prompt dropdown */}
          {isLocationFocused && !town && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-sage/20 shadow-lg p-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-charcoal hover:bg-sage/10 hover:text-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 motion-safe:transition-colors disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 size={iconSize.sm} className="motion-safe:animate-spin text-sage" aria-hidden="true" />
                    <span>Detecting your location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={iconSize.sm} className="text-sage" aria-hidden="true" />
                    <span>Use my current location</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        <VisuallyHidden as="label" htmlFor={activityId}>
          Activity: Select class type
        </VisuallyHidden>
        <select
          id={activityId}
          name="q"
          className={`ph-input flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${isVariantB ? "w-full md:w-40" : "w-full md:w-48"}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          disabled={isCategoriesLoading}
          tabIndex={0}
        >
          <option value="">{isVariantB ? "Activity type" : "All activities"}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <VisuallyHidden as="label" htmlFor={ageId}>
          Filter by child&apos;s age range
        </VisuallyHidden>
        <select 
          id={ageId}
          name="age"
          className={`ph-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${isVariantB ? "w-full md:w-40" : "w-full md:w-48"}`} 
          value={age} 
          onChange={(e) => setAge(e.target.value)}
          tabIndex={0}
        >
          <option value="">All Ages</option>
          <option value="0-12">0–12 months</option>
          <option value="12-24">1–2 years</option>
          <option value="24-36">2–3 years</option>
          <option value="36-60">3–5 years</option>
        </select>
        <button 
          className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-small font-medium bg-sage text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 w-full md:w-auto shadow-soft" 
          type="submit"
          aria-label="Refresh search results"
          aria-busy={isApplyingFilters}
          tabIndex={0}
        >
          {isApplyingFilters && (
            <span role="status" aria-live="polite" aria-label="Applying filters" className="inline-flex items-center">
              <Loader2 size={iconSize.sm} className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <VisuallyHidden>Applying filters</VisuallyHidden>
            </span>
          )}
          {isVariantB ? "Search" : "Explore"}
        </button>
      </form>
    </div>
  );
});

SearchBarSticky.displayName = "SearchBarSticky";

export default SearchBarSticky;
