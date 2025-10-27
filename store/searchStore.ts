"use client";

import { create } from "zustand";

export interface SearchFilters {
  q: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  category: string;
  page: number;
}

interface SearchState extends SearchFilters {
  activeId: number | null;
  setQuery: (q: string) => void;
  setLocation: (lat: number | null, lng: number | null) => void;
  setRadius: (radiusKm: number) => void;
  setCategory: (category: string) => void;
  setPage: (page: number) => void;
  setActiveId: (id: number | null) => void;
  hydrate: (initial: Partial<SearchFilters>) => void;
}

const DEFAULT_STATE: SearchState = {
  q: "",
  lat: null,
  lng: null,
  radiusKm: 5,
  category: "",
  page: 1,
  activeId: null,
  setQuery: () => undefined,
  setLocation: () => undefined,
  setRadius: () => undefined,
  setCategory: () => undefined,
  setPage: () => undefined,
  setActiveId: () => undefined,
  hydrate: () => undefined,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...DEFAULT_STATE,
  setQuery: (q) =>
    set((state) => ({
      q,
      page: q !== state.q ? 1 : state.page,
    })),
  setLocation: (lat, lng) =>
    set(() => ({
      lat,
      lng,
      page: 1,
    })),
  setRadius: (radiusKm) =>
    set(() => ({
      radiusKm,
      page: 1,
    })),
  setCategory: (category) =>
    set(() => ({
      category,
      page: 1,
    })),
  setPage: (page) =>
    set(() => ({
      page: Math.max(1, page),
    })),
  setActiveId: (id) =>
    set(() => ({
      activeId: id,
    })),
  hydrate: (initial) =>
    set((state) => ({
      ...state,
      ...initial,
      page: initial.page ? Math.max(1, initial.page) : state.page,
    })),
}));
