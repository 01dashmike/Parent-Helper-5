"use client";

import { useState, useEffect, useId } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { MapPin } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { logCtaClick } from "@/lib/analytics/client";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

type SearchFieldsProps = {
  initialLocation?: string | null;
  variant?: "A" | "B";
};

export default function SearchFields({ initialLocation, variant }: SearchFieldsProps): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname() ?? "/search";
  const params = useSearchParams();
  const townId = useId();
  const keywordId = useId();
  const ageId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [town, setTown] = useState(initialLocation || "");
  const [query, setQuery] = useState("");
  const [age, setAge] = useState("");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!params) return;
    const paramTown = params.get("town");
    if (paramTown) {
      setTown(paramTown);
    } else if (initialLocation) {
      // Only set initialLocation if no town param exists
      setTown(initialLocation);
    }
    setQuery(params.get("q") ?? "");
    
    // Normalize age format: convert "0-12 months" to "0-12", etc.
    const ageParam = params.get("age") ?? "";
    if (ageParam) {
      // Remove " months" or " years" suffix if present
      const normalized = ageParam.replace(/\s*(months?|years?)/gi, "").trim();
      setAge(normalized);
    } else {
      setAge("");
    }
  }, [params, initialLocation]);

  const handleDetectLocation = async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    setDetecting(true);
    try {
      // Request user consent for geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }),
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
            // Update URL to trigger search for nearest classes
            const newParams = new URLSearchParams(params?.toString() ?? "");
            newParams.set("town", city);
            if (query.trim()) newParams.set("q", query.trim());
            if (age) newParams.set("age", age);
            router.push(`/search?${newParams.toString()}`);
            return;
          }
        }
      } catch {
        // Fallback to coordinates if reverse geocoding fails
      }

      // Use coordinates as fallback
      const coordString = `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
      setTown(coordString);
      const newParams = new URLSearchParams(params?.toString() ?? "");
      newParams.set("town", coordString);
      if (query.trim()) newParams.set("q", query.trim());
      if (age) newParams.set("age", age);
      router.push(`/search?${newParams.toString()}`);
    } catch {
      // Handle user denial or other errors gracefully
      // Silently handle geolocation errors
    } finally {
      setTimeout(() => setDetecting(false), 800);
    }
  };

  const handleFocus = (): void => {
    setIsFocused(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLFormElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    
    // Log CTA click if variant is provided
    if (variant) {
      logCtaClick({
        variant,
        ctaType: "search",
        location: town || initialLocation || undefined,
      });
    }
    
    const newParams = new URLSearchParams(params?.toString() ?? "");
    if (query.trim()) newParams.set("q", query.trim());
    if (town.trim()) newParams.set("town", town.trim());
    if (age) newParams.set("age", age);

    const route = newParams.toString() ? `/search?${newParams.toString()}` : pathname;
    router.push(route);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-busy={detecting}
      className={`mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between space-y-2 rounded-full border border-cream bg-white/95 px-4 py-2 text-small shadow-lg transition-slow motion-reduce:animate-none backdrop-blur-md hover:shadow-xl hover:ring-sage/20 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[ButtonBorder] md:flex-nowrap md:space-y-0 md:space-x-2 ${
        isFocused ? "shadow-xl ring-1 ring-sage/30" : ""
      }`}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4, duration: motionTokens.slow, ease: motionTokens.easeOut }}
    >
      <div className="relative flex flex-1 items-center">
        <button
          type="button"
          className="absolute left-3 inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium gap-1 text-forest md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          onClick={handleDetectLocation}
          disabled={detecting}
          aria-disabled={detecting}
          aria-label={detecting ? "Detecting location" : "Use my current location"}
          tabIndex={0}
        >
          {detecting ? (
            <>
              <LoadingSpinner size="sm" label="Detecting location" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin size={iconSize.sm} aria-hidden="true" focusable="false" />
              <span>Use my location</span>
            </>
          )}
        </button>

        <MapPin size={iconSize.md} className="absolute left-3 hidden text-forest md:block" aria-hidden="true" focusable="false" />

        <VisuallyHidden as="label" htmlFor={townId}>
          Enter town or postcode
        </VisuallyHidden>
        <input
          id={townId}
          name="town"
          value={town}
          onChange={(event) => setTown(event.target.value)}
          type="text"
          placeholder="Enter town or postcode"
          aria-label="Enter town or postcode"
          className="input input-md rounded-full pl-10 pr-4 text-charcoal placeholder:text-slateSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          tabIndex={0}
        />

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting}
          aria-disabled={detecting}
          className="hidden inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium gap-1 whitespace-nowrap text-forest hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:inline-flex"
          aria-label={detecting ? "Detecting location" : "Use my current location"}
          tabIndex={0}
        >
          {detecting ? (
            <>
              <LoadingSpinner size="sm" label="Detecting location" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <MapPin size={iconSize.sm} aria-hidden="true" focusable="false" />
              <span>Use my location</span>
            </>
          )}
        </button>
      </div>

      <VisuallyHidden as="label" htmlFor={keywordId}>
        Search activity
      </VisuallyHidden>
      <input
        id={keywordId}
        name="keyword"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        type="text"
        placeholder="Search activity (e.g. 'music', 'yoga')"
        aria-label="Search activity (e.g. 'music', 'yoga')"
        className="input input-md rounded-full flex-1 text-charcoal placeholder:text-slateSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        tabIndex={0}
      />

      <VisuallyHidden as="label" htmlFor={ageId}>
        Filter by age range
      </VisuallyHidden>
      <select
        id={ageId}
        name="age"
        value={age}
        onChange={(event) => setAge(event.target.value)}
        aria-label="Filter by age range"
        className="input input-md rounded-full border-sage/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        tabIndex={0}
      >
        <option value="">All ages</option>
        <option value="0-12">0–12 months</option>
        <option value="12-24">1–2 years</option>
        <option value="24-36">2–3 years</option>
        <option value="36-60">3–5 years</option>
      </select>

      <button
        type="submit"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium whitespace-nowrap bg-sage text-white shadow-sm transition-standard motion-reduce:animate-none hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 forced-colors:bg-[ButtonFace] forced-colors:text-[ButtonText] forced-colors:border-[ButtonBorder]"
        aria-label="Search for classes"
        tabIndex={0}
      >
        Explore classes
      </button>
    </motion.form>
  );
}
