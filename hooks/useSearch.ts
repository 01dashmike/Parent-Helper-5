"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { SearchFilters } from "@/store/searchStore";

export interface SearchResult {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  town: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
  totalHint?: number;
}

export const SEARCH_PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDebounced(value);
      return;
    }

    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useSearch(filters: SearchFilters) {
  const limit = SEARCH_PAGE_SIZE;
  const offset = (filters.page - 1) * limit;
  const debouncedFilters = useDebouncedValue({ ...filters, limit, offset }, 300);

  const queryKey = useMemo(
    () => [
      "search",
      debouncedFilters.q,
      debouncedFilters.lat,
      debouncedFilters.lng,
      debouncedFilters.radiusKm,
      debouncedFilters.category,
      debouncedFilters.page,
    ],
    [
      debouncedFilters.q,
      debouncedFilters.lat,
      debouncedFilters.lng,
      debouncedFilters.radiusKm,
      debouncedFilters.category,
      debouncedFilters.page,
    ]
  );

  return useQuery<SearchResponse>({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: debouncedFilters.lat,
          lng: debouncedFilters.lng,
          radiusKm: debouncedFilters.radiusKm,
          q: debouncedFilters.q,
          category: debouncedFilters.category,
          limit,
          offset,
        }),
        signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch search results");
      }

      return (await response.json()) as SearchResponse;
    },
    staleTime: 1000 * 30,
  });
}
