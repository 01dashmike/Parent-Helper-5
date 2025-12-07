"use client";

import Image from "next/image";
import { useMemo } from "react";
import { generateMapboxStaticMultiple, generateMapboxStaticMarker } from "@/lib/mapbox-static";

interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
}

interface MapboxStaticPreviewProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Static map preview component using Mapbox Static Images API
 * React 19 compatible - no interactive map library required
 */
export default function MapboxStaticPreview({
  points,
  center,
  zoom = 13,
  width = 800,
  height = 600,
  className = "",
}: MapboxStaticPreviewProps) {
  const mapUrl = useMemo(() => {
    // No points and no center
    if ((!points || points.length === 0) && !center) {
      return null;
    }

    // Single center point with no markers
    if (center && (!points || points.length === 0)) {
      return generateMapboxStaticMarker(center[0], center[1], {
        zoom,
        width,
        height,
        retina: true,
      });
    }

    // Multiple points - show all with markers
    if (points && points.length > 0) {
      const locations = points
        .filter(p => 
          typeof p.lat === "number" && 
          typeof p.lng === "number" &&
          !isNaN(p.lat) && 
          !isNaN(p.lng) &&
          p.lat >= -90 && p.lat <= 90 &&
          p.lng >= -180 && p.lng <= 180
        )
        .map((p, idx) => ({
          lat: p.lat,
          lng: p.lng,
          label: points.length <= 10 ? (idx + 1).toString() : undefined,
        }));

      if (locations.length === 0) {
        return null;
      }

      return generateMapboxStaticMultiple(locations, {
        zoom,
        width,
        height,
        retina: true,
      });
    }

    return null;
  }, [points, center, zoom, width, height]);

  if (!mapUrl) {
    const hasToken = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MAPBOX_TOKEN;
    return (
      <div 
        className={`flex items-center justify-center bg-cream/50 border border-sage/20 rounded-xl ${className}`}
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
        role="status"
      >
        <div className="text-center px-4">
          {!hasToken ? (
            <>
              <p className="text-sm font-medium text-text-tertiary mb-1">Map unavailable</p>
              <p className="text-xs text-text-tertiary/70">Mapbox token not configured</p>
            </>
          ) : (
            <p className="text-sm text-text-tertiary">No map data available</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-sage/20 ${className}`}>
      <Image
        src={mapUrl}
        alt={`Map showing ${points.length} location${points.length !== 1 ? "s" : ""}`}
        width={width}
        height={height}
        className="w-full h-auto"
        priority={false}
        quality={90}
        unoptimized // Mapbox already optimizes the image
      />
      {points.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-sage/20">
          <p className="text-xs font-medium text-charcoal">
            {points.length} location{points.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}


