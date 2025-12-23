/**
 * Mapbox Interactive Maps - Usage Examples
 * 
 * This file demonstrates how to use the interactive map components.
 */

import { MapboxInteractive, MapboxClustered } from "@/components/map";
import type { MapPoint } from "@/components/map";

// =====================================================
// EXAMPLE 1: Basic Interactive Map
// =====================================================
// Perfect for: Single location detail pages

export function BasicInteractiveMap() {
  const location: MapPoint = {
    id: 1,
    lat: 51.5074,
    lng: -0.1278,
    name: "Baby Sensory London",
    venue: "Community Centre",
    distance: 1.2,
  };

  return (
    <MapboxInteractive
      points={[location]}
      center={[location.lat, location.lng]}
      zoom={14}
      className="w-full h-96 rounded-xl shadow-lg"
    />
  );
}

// =====================================================
// EXAMPLE 2: Multiple Locations with Callback
// =====================================================
// Perfect for: Search results, category pages

export function MultipleLocationsMap({ results }: { results: any[] }) {
  const points: MapPoint[] = results.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    name: r.title,
    venue: r.venue_name,
    distance: r.distance,
  }));

  const handleMarkerClick = (point: MapPoint) => {
    console.log("Clicked:", point.name);
    // Navigate to detail page, update URL, etc.
  };

  return (
    <MapboxInteractive
      points={points}
      zoom={12}
      onMarkerClick={handleMarkerClick}
      className="w-full h-[600px] rounded-xl"
    />
  );
}

// =====================================================
// EXAMPLE 3: Clustered Map for Large Datasets
// =====================================================
// Perfect for: Search results with 50+ locations

export function ClusteredSearchMap({ results }: { results: any[] }) {
  const points: MapPoint[] = results.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    name: r.title,
    venue: r.venue_name,
    distance: r.distance,
  }));

  return (
    <MapboxClustered
      points={points}
      zoom={11}
      minClusterPoints={10} // Start clustering at 10+ markers
      onMarkerClick={(point) => {
        // Handle click
        window.location.href = `/classes/${point.id}`;
      }}
      className="w-full h-full rounded-xl"
      style={{ minHeight: "500px" }}
    />
  );
}

// =====================================================
// EXAMPLE 4: Responsive Map Component
// =====================================================
// Perfect for: Adapting to different screen sizes

export function ResponsiveMap({ points }: { points: MapPoint[] }) {
  return (
    <div className="w-full">
      {/* Mobile: Shorter map */}
      <div className="md:hidden">
        <MapboxInteractive
          points={points}
          zoom={12}
          className="w-full h-64 rounded-lg"
        />
      </div>

      {/* Desktop: Taller map with clustering */}
      <div className="hidden md:block">
        <MapboxClustered
          points={points}
          zoom={11}
          className="w-full h-96 rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 5: Map in Split View (Search Results)
// =====================================================
// Perfect for: Side-by-side list and map view

export function SplitViewMap({ 
  results, 
  selectedId 
}: { 
  results: any[];
  selectedId?: string | number;
}) {
  const points: MapPoint[] = results.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    name: r.title,
    venue: r.venue_name,
    distance: r.distance,
  }));

  return (
    <div className="flex gap-4 h-screen">
      {/* List View */}
      <div className="w-1/2 overflow-y-auto">
        {results.map((result) => (
          <div key={result.id} className="p-4 border-b">
            <h3>{result.title}</h3>
            <p>{result.venue_name}</p>
          </div>
        ))}
      </div>

      {/* Map View */}
      <div className="w-1/2 sticky top-0 h-screen">
        <MapboxClustered
          points={points}
          zoom={12}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 6: Map with Custom Marker Click Handler
// =====================================================

export function MapWithCustomHandler({ 
  points,
  onLocationSelect 
}: { 
  points: MapPoint[];
  onLocationSelect: (id: string | number) => void;
}) {
  return (
    <MapboxInteractive
      points={points}
      onMarkerClick={(point) => {
        // Custom logic when marker is clicked
        onLocationSelect(point.id);
        
        // Could also trigger analytics
        console.log(`Marker clicked: ${point.name}`);
        
        // Or update URL without navigation
        window.history.pushState({}, "", `?selected=${point.id}`);
      }}
      className="w-full h-96"
    />
  );
}

// =====================================================
// EXAMPLE 7: Lazy-Loaded Map (Performance Optimization)
// =====================================================

import { lazy, Suspense } from "react";

const LazyMap = lazy(() => import("@/components/map/MapboxClustered"));

export function LazyLoadedMap({ points }: { points: MapPoint[] }) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-96 bg-cream/50 rounded-xl flex items-center justify-center">
          <p className="text-sm text-text-tertiary">Loading map...</p>
        </div>
      }
    >
      <LazyMap
        points={points}
        zoom={12}
        className="w-full h-96"
      />
    </Suspense>
  );
}

// =====================================================
// EXAMPLE 8: Switching Between Static and Interactive
// =====================================================
// Perfect for: Progressive enhancement

import { useState } from "react";
import { MapboxStaticPreview } from "@/components/map";

export function ProgressiveMap({ points }: { points: MapPoint[] }) {
  const [interactive, setInteractive] = useState(false);

  if (!interactive) {
    return (
      <div className="relative">
        <MapboxStaticPreview
          points={points}
          zoom={12}
          width={800}
          height={600}
          className="cursor-pointer"
        />
        <button
          onClick={() => setInteractive(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <span className="bg-white px-4 py-2 rounded-lg shadow-lg font-medium">
            Open Interactive Map
          </span>
        </button>
      </div>
    );
  }

  return (
    <MapboxClustered
      points={points}
      zoom={12}
      className="w-full h-96 rounded-xl"
    />
  );
}

// =====================================================
// EXAMPLE 9: Map in Modal/Dialog
// =====================================================

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function MapModal({ 
  open, 
  onClose, 
  point 
}: { 
  open: boolean;
  onClose: () => void;
  point: MapPoint;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>{point.name}</DialogTitle>
        <div className="mt-4">
          <MapboxInteractive
            points={[point]}
            center={[point.lat, point.lng]}
            zoom={15}
            className="w-full h-96 rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// EXAMPLE 10: Full Page Map
// =====================================================

export function FullPageMap({ points }: { points: MapPoint[] }) {
  return (
    <div className="fixed inset-0">
      <MapboxClustered
        points={points}
        zoom={11}
        className="w-full h-full"
      />
      
      {/* Overlay controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <h2 className="font-semibold mb-2">Locations</h2>
        <p className="text-sm text-text-tertiary">
          {points.length} classes found
        </p>
      </div>
    </div>
  );
}






