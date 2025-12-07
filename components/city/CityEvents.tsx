"use client";

import { useState, useEffect } from "react";
import { isNearbyEventsEnabled } from "@/lib/env";
import NearbyEvents from "@/components/search/NearbyEvents";
import { safeFetch } from "@/lib/client/safeFetch";

export default function CityEvents({ cityName }: { cityName: string }) {
  const [coordinates, setCoordinates] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });

  useEffect(() => {
    // Try to get coordinates from classes in this city
    const fetchCityCoordinates = async () => {
      const params = new URLSearchParams({
        town: cityName.toLowerCase(),
        q: "",
      });

      const result = await safeFetch<{ results: Array<{ latitude: number | null; longitude: number | null }> }>(
        `/api/search?${params.toString()}`
      );

      if (!result.ok || !result.data) {
        return; // Silently fail - coordinates are optional
      }

      const results = result.data.results || [];

      // Find first result with coordinates
      const resultWithCoords = results.find(
        (r) => r.latitude != null && r.longitude != null
      );

      if (resultWithCoords) {
        setCoordinates({
          lat: resultWithCoords.latitude,
          lng: resultWithCoords.longitude,
        });
        return;
      }

      // If no results with coordinates, calculate average from all results
      const validResults = results.filter(
        (r): r is { latitude: number; longitude: number } =>
          r.latitude != null && r.longitude != null
      );

      if (validResults.length > 0) {
        const avgLat =
          validResults.reduce(
            (sum, r) => sum + r.latitude,
            0
          ) / validResults.length;
        const avgLng =
          validResults.reduce(
            (sum, r) => sum + r.longitude,
            0
          ) / validResults.length;

        setCoordinates({ lat: avgLat, lng: avgLng });
      }
    };

    if (cityName) {
      fetchCityCoordinates();
    }
  }, [cityName]);

  // Early return if feature is disabled - robust check prevents crashes
  if (!isNearbyEventsEnabled()) {
    return null;
  }

  // Only render if we have valid coordinates
  if (coordinates.lat == null || coordinates.lng == null) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <NearbyEvents
        latitude={coordinates.lat}
        longitude={coordinates.lng}
        radiusKm={15}
      />
    </div>
  );
}

