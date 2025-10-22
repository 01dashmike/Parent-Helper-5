"use client";

import { create } from "zustand";
import { onFilterChange } from "@/analytics/events";
import { SearchResult, mockResults } from "@/data/mockResults";

type AgeRange = [number, number] | null;

export type SearchFilters = {
  distance: number;
  categories: string[];
  ageRange: AgeRange;
  isOnline: boolean | null;
};

type UserLocation = {
  lat: number;
  lng: number;
} | null;

type SearchState = {
  filters: SearchFilters;
  userLocation: UserLocation;
  results: SearchResult[];
  highlightedId: string | null;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setUserLocation: (location: UserLocation) => void;
  setResults: (results: SearchResult[]) => void;
  highlightResult: (id: string | null) => void;
  clearHighlight: () => void;
  getFilteredResults: () => SearchResult[];
};

const initialFilters: SearchFilters = {
  distance: 5,
  categories: [],
  ageRange: null,
  isOnline: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: initialFilters,
  userLocation: null,
  results: mockResults,
  highlightedId: null,
  setFilters: (filters) =>
    set((state) => {
      const nextFilters = { ...state.filters, ...filters };
      onFilterChange(nextFilters);
      return { filters: nextFilters };
    }),
  setUserLocation: (location) => set({ userLocation: location }),
  setResults: (results) => set({ results }),
  highlightResult: (id) => set({ highlightedId: id }),
  clearHighlight: () => set({ highlightedId: null }),
  getFilteredResults: () => {
    const { filters, results } = get();
    return results.filter((result) => {
      const withinDistance = result.distanceKm <= filters.distance + 0.0001;
      const matchesCategory =
        filters.categories.length === 0 || filters.categories.includes(result.category);
      const matchesOnline =
        filters.isOnline === null
          ? true
          : filters.isOnline
            ? result.category.toLowerCase().includes("online")
            : !result.category.toLowerCase().includes("online");

      let matchesAge = true;
      if (filters.ageRange) {
        const [min] = filters.ageRange;
        matchesAge = min <= 12; // placeholder matching
      }
      return withinDistance && matchesCategory && matchesOnline && matchesAge;
    });
  },
}));
