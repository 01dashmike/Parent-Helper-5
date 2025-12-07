"use client";

/**
 * MarkerClusterGroup placeholder component
 * Leaflet has been temporarily removed due to React 19 incompatibility
 */

interface MarkerData {
  id: string | number;
  position: [number, number];
  popup?: string;
  ariaLabel?: string;
}

interface MarkerClusterGroupProps {
  markers: MarkerData[];
  maxClusterRadius?: number;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  animate?: boolean;
  animateAddingMarkers?: boolean;
  removeOutsideVisibleBounds?: boolean;
  chunkedLoading?: boolean;
  disableClusteringAtZoom?: number;
  minMarkersForClustering?: number;
}

/**
 * Placeholder component - map functionality temporarily disabled
 */
export default function MarkerClusterGroup(_props: MarkerClusterGroupProps): null {
  // Component doesn't render anything - map functionality disabled
  return null;
}
