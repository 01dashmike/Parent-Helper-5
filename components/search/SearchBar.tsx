"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SearchBarProps = {
  onSearch: (query: string) => void;
  initialQuery?: string;
};

export default function SearchBar({ onSearch, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();

  // Get location from URL params
  useEffect(() => {
    const lat = safeSearchParams.get("lat");
    const lng = safeSearchParams.get("lng");
    if (lat && lng) {
      setLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  }, [safeSearchParams]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Update URL with location
        const params = new URLSearchParams(safeSearchParams.toString());
        params.set("lat", latitude.toString());
        params.set("lng", longitude.toString());
        router.push(`/search?${params.toString()}`, { scroll: false });
      },
      (error) => {
        setLocationError("Unable to get location");
        console.error("Geolocation error:", error);
      }
    );
  }, [router, safeSearchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    
    // Update URL
    const params = new URLSearchParams(safeSearchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for classes..."
          className="flex-1 rounded-lg border border-sage/30 px-4 py-3 text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
        />
        <button
          type="button"
          onClick={requestLocation}
          className="rounded-lg border border-sage/30 bg-white px-4 py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors"
          title={location ? "Location set" : "Use my location"}
        >
          {location ? "📍" : "📍"}
        </button>
        <button
          type="submit"
          className="rounded-lg bg-sage px-6 py-3 text-sm font-medium text-white hover:bg-forest transition-colors"
        >
          Search
        </button>
      </div>
      {locationError && (
        <p className="mt-2 text-sm text-red-600">{locationError}</p>
      )}
      {location && (
        <p className="mt-2 text-xs text-slateSoft">Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
      )}
    </form>
  );
}

