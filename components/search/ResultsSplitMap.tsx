"use client";

import { memo } from "react";
import MapboxStaticPreview from "./MapboxStaticPreview";

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
};

export type { MapPoint };

/**
 * Map component using Mapbox Static Images API
 * React 19 compatible - displays static map preview instead of interactive map
 */
const ResultsSplitMap = memo(function ResultsSplitMap({ 
  points, 
  center, 
  zoom = 13 
}: Props): React.ReactNode {
  return (
    <div className="h-full w-full" style={{ minHeight: "300px" }}>
      <MapboxStaticPreview
        points={points}
        center={center}
        zoom={zoom}
        width={800}
        height={600}
        className="w-full h-full object-cover"
      />
    </div>
  );
});

// Export MapPane as an alias for ResultsSplitMap for backward compatibility
export const MapPane = ResultsSplitMap;

export default ResultsSplitMap;
