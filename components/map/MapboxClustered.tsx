"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  GeolocateControl,
  ScaleControl,
  MapRef,
  Source,
  Layer,
  type ViewState,
  type CircleLayer,
  type SymbolLayer,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface MapPoint {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
}

interface MapboxClusteredProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (point: MapPoint) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Minimum points to enable clustering */
  minClusterPoints?: number;
}

/**
 * Interactive Mapbox map with marker clustering
 * React 19 compatible - uses Mapbox GL JS built-in clustering
 * 
 * Features:
 * - Automatic marker clustering
 * - Click clusters to zoom in
 * - Click markers for details
 * - Smooth animations
 * - Performance optimized for 1000+ markers
 */
export default function MapboxClustered({
  points,
  center,
  zoom = 13,
  onMarkerClick,
  className = "",
  style = {},
  minClusterPoints = 5,
}: MapboxClusteredProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [cursor, setCursor] = useState<string>("auto");
  
  // Calculate initial center
  const initialCenter = center || (points.length > 0 
    ? [points[0].lng, points[0].lat] 
    : [-0.1278, 51.5074]);

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom,
  });

  // Convert points to GeoJSON format
  const geojsonData = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        properties: {
          id: point.id,
          name: point.name,
          venue: point.venue,
          distance: point.distance,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.lng, point.lat],
        },
      })),
    };
  }, [points]);

  // Should we enable clustering?
  const enableClustering = points.length >= minClusterPoints;

  // Cluster layer style
  const clusterLayer: CircleLayer = {
    id: "clusters",
    type: "circle",
    source: "points",
    filter: ["has", "point_count"],
    paint: {
      // Brand sage green color palette
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#A8B8A8", // Light sage for small clusters
        10,
        "#9BAE82", // Medium sage
        25,
        "#7C8F67", // Dark sage for large clusters
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        20, // 20px for small clusters
        10,
        25, // 25px for medium
        25,
        30, // 30px for large
      ],
      "circle-stroke-width": 3,
      "circle-stroke-color": "#fff",
    },
  };

  // Cluster count layer
  const clusterCountLayer: SymbolLayer = {
    id: "cluster-count",
    type: "symbol",
    source: "points",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 14,
    },
    paint: {
      "text-color": "#ffffff",
    },
  };

  // Unclustered point layer
  const unclusteredPointLayer: CircleLayer = {
    id: "unclustered-point",
    type: "circle",
    source: "points",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#9BAE82", // Brand sage green
      "circle-radius": 8,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
    },
  };

  const handleClusterClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const clusterId = feature.properties.cluster_id;
    const source = mapRef.current?.getSource("points");

    if (source && "getClusterExpansionZoom" in source) {
      (source as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;

        mapRef.current?.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 500,
        });
      });
    }
  }, []);

  const handlePointClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const pointData = points.find(
      (p) => p.id.toString() === feature.properties.id.toString()
    );

    if (pointData) {
      setSelectedPoint(pointData);
      onMarkerClick?.(pointData);
    }
  }, [points, onMarkerClick]);

  const handleMouseEnter = useCallback(() => {
    setCursor("pointer");
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCursor("auto");
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div 
        className={`flex items-center justify-center bg-cream/50 border border-sage/20 rounded-xl ${className}`}
        style={{ minHeight: "400px", ...style }}
      >
        <p className="text-sm text-text-tertiary">Map token not configured</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: "400px", ...style }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%", borderRadius: "12px" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={true}
        cooperativeGestures={false}
        cursor={cursor}
        interactiveLayerIds={enableClustering ? ["clusters", "unclustered-point"] : []}
        onClick={(event) => {
          const features = event.features;
          if (!features || features.length === 0) return;

          const feature = features[0];
          if (feature.layer.id === "clusters") {
            handleClusterClick(event);
          } else if (feature.layer.id === "unclustered-point") {
            handlePointClick(event);
          }
        }}
        onMouseEnter={(event) => {
          const features = event.features;
          if (features && features.length > 0) {
            handleMouseEnter();
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" trackUserLocation showUserHeading />
        <ScaleControl position="bottom-left" />

        {enableClustering ? (
          // Clustered markers
          <Source
            id="points"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        ) : (
          // Non-clustered markers (few points)
          points.map((point) => (
            <Marker
              key={point.id}
              longitude={point.lng}
              latitude={point.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedPoint(point);
                onMarkerClick?.(point);
              }}
            >
              <div 
                className="cursor-pointer transform transition-transform hover:scale-110"
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: "#9BAE82",
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                <div 
                  style={{
                    transform: "rotate(45deg)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  📍
                </div>
              </div>
            </Marker>
          ))
        )}

        {/* Popup */}
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.lng}
            latitude={selectedPoint.lat}
            anchor="bottom"
            onClose={handleClosePopup}
            closeButton={true}
            closeOnClick={false}
            offset={25}
          >
            <div className="p-2">
              <h3 className="font-semibold text-charcoal mb-1">
                {selectedPoint.name}
              </h3>
              {selectedPoint.venue && (
                <p className="text-sm text-text-tertiary mb-1">
                  {selectedPoint.venue}
                </p>
              )}
              {selectedPoint.distance != null && (
                <p className="text-xs text-text-tertiary">
                  {selectedPoint.distance.toFixed(1)} km away
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Location count badge */}
      {points.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-sage/20 pointer-events-none">
          <p className="text-sm font-medium text-charcoal">
            {points.length} location{points.length !== 1 ? "s" : ""}
            {enableClustering && <span className="text-xs ml-1">(clustered)</span>}
          </p>
        </div>
      )}
    </div>
  );
}



