"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS, MAP_SETTINGS } from "@/lib/mapConfig";

interface MapPreferences {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  lastSearchParams?: string;
}

/**
 * useMapPreferences Hook
 * 
 * Saves and restores map view state to localStorage.
 * Remembers the user's last map position, zoom level, and search filters
 * so they return to the same view when they reload the page.
 * 
 * Usage:
 * const { preferences, savePreferences } = useMapPreferences();
 * 
 * // When map moves or zooms:
 * savePreferences({ lat, lng, zoom, searchParams });
 */
export function useMapPreferences() {
  const [preferences, setPreferences] = useState<MapPreferences>({
    center: MAP_SETTINGS.defaultCenter,
    zoom: MAP_SETTINGS.defaultZoom,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.mapPreferences);
      if (stored) {
        const parsed = JSON.parse(stored) as MapPreferences;
        setPreferences(parsed);
      }
    } catch (error) {
      console.warn("Failed to load map preferences:", error);
      // Keep default preferences if parsing fails
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (newPreferences: {
      lat: number;
      lng: number;
      zoom: number;
      searchParams?: string;
    }) => {
      try {
        const updated: MapPreferences = {
          center: {
            lat: newPreferences.lat,
            lng: newPreferences.lng,
          },
          zoom: newPreferences.zoom,
          lastSearchParams: newPreferences.searchParams,
        };

        setPreferences(updated);
        localStorage.setItem(
          STORAGE_KEYS.mapPreferences,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.warn("Failed to save map preferences:", error);
      }
    },
    []
  );

  // Clear preferences (useful for testing or reset functionality)
  const clearPreferences = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.mapPreferences);
      setPreferences({
        center: MAP_SETTINGS.defaultCenter,
        zoom: MAP_SETTINGS.defaultZoom,
      });
    } catch (error) {
      console.warn("Failed to clear map preferences:", error);
    }
  }, []);

  return {
    preferences,
    savePreferences,
    clearPreferences,
    isLoaded, // Use this to prevent flash of wrong position
  };
}


