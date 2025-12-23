/**
 * Map Components - Export Hub
 * 
 * Choose the right map component for your use case:
 * 
 * - MapboxStaticPreview: Fast loading, SEO friendly, no interaction
 * - MapboxInteractive: Full interaction, pan/zoom, best for detail pages
 * - MapboxClustered: Best for search results with many markers (auto-clustering)
 */

export { default as MapboxStaticPreview } from "../search/MapboxStaticPreview";
export { default as MapboxInteractive } from "./MapboxInteractive";
export { default as MapboxClustered } from "./MapboxClustered";

// Re-export utilities
export { 
  generateMapboxStaticUrl, 
  generateMapboxStaticMarker, 
  generateMapboxStaticMultiple,
  MapboxStyles,
  type MapboxStyleId,
} from "@/lib/mapbox-static";

// Common types
export type MapPoint = {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
};






