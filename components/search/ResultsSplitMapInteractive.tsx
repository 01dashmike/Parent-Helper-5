"use client";

import { memo } from "react";
import MapboxClustered from "../map/MapboxClustered";

type MapPoint = {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
};

type Props = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (point: MapPoint) => void;
};

export type { MapPoint };

/**
 * Interactive map component for search results
 * Drop-in replacement for ResultsSplitMap with full interactivity
 * 
 * Usage:
 * Replace `import ResultsSplitMap from "./ResultsSplitMap"`
 * With `import ResultsSplitMap from "./ResultsSplitMapInteractive"`
 */
const ResultsSplitMapInteractive = memo(function ResultsSplitMapInteractive({ 
  points, 
  center, 
  zoom = 13,
  onMarkerClick,
}: Props): React.ReactNode {
  return (
    <div className="h-full w-full" style={{ minHeight: "300px" }}>
      <MapboxClustered
        points={points}
        center={center}
        zoom={zoom}
        onMarkerClick={onMarkerClick}
        className="w-full h-full"
        minClusterPoints={10}
      />
    </div>
  );
});

// Export MapPane as an alias for backward compatibility
export const MapPane = ResultsSplitMapInteractive;

export default ResultsSplitMapInteractive;






