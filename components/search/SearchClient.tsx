"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "./SearchBar";
import FiltersBar from "./FiltersBar";
import SearchResultsGrid, { type SearchClassResult } from "./SearchResultsGrid";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  const [results, setResults] = useState<SearchClassResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: safeSearchParams.get("q") ?? "",
    age: safeSearchParams.get("age") ?? "",
    category: safeSearchParams.get("category") ?? "",
    day: safeSearchParams.get("day") ?? "",
    timeOfDay: safeSearchParams.get("timeOfDay") ?? "",
    lat: safeSearchParams.get("lat") ?? "",
    lng: safeSearchParams.get("lng") ?? "",
    radiusKm: safeSearchParams.get("radiusKm") ?? "5",
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: typeof filters) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchFilters.q) params.set("q", searchFilters.q);
        if (searchFilters.age) params.set("age", searchFilters.age);
        if (searchFilters.category) params.set("category", searchFilters.category);
        if (searchFilters.day) params.set("day", searchFilters.day);
        if (searchFilters.timeOfDay) params.set("timeOfDay", searchFilters.timeOfDay);
        if (searchFilters.lat) params.set("lat", searchFilters.lat);
        if (searchFilters.lng) params.set("lng", searchFilters.lng);
        params.set("radiusKm", searchFilters.radiusKm);

        const response = await fetch(`/api/search/classes?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Auto-location on mount
  useEffect(() => {
    if (!filters.lat && !filters.lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          }));
        },
        () => {
          // Silently fail if location denied
        }
      );
    }
  }, []);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, q: query }));
  };

  const handleFilterChange = () => {
    // Filters are updated via URL, which triggers useEffect
    const newFilters = {
      q: searchParams?.get("q") ?? "",
      age: searchParams?.get("age") ?? "",
      category: searchParams?.get("category") ?? "",
      day: searchParams?.get("day") ?? "",
      timeOfDay: searchParams?.get("timeOfDay") ?? "",
      lat: searchParams?.get("lat") ?? "",
      lng: searchParams?.get("lng") ?? "",
      radiusKm: searchParams?.get("radiusKm") ?? "5",
    };
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-cream/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialQuery={filters.q} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FiltersBar onFilterChange={handleFilterChange} />
        </div>

        {/* Results */}
        <div>
          <SearchResultsGrid results={results} loading={loading} />
        </div>
      </div>
    </div>
  );
}

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}

