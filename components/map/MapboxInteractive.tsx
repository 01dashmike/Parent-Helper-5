"use client";

import { useRef, useCallback, useState } from "react";
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  GeolocateControl,
  ScaleControl,
  MapRef,
  type ViewState 
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

interface MapboxInteractiveProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (point: MapPoint) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Interactive Mapbox GL map component
 * React 19 compatible - uses react-map-gl v7
 * 
 * Features:
 * - Pan and zoom
 * - Clickable markers with popups
 * - Navigation controls
 * - Geolocation
 * - Scale indicator
 */
export default function MapboxInteractive({
  points,
  center,
  zoom = 13,
  onMarkerClick,
  className = "",
  style = {},
}: MapboxInteractiveProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  
  // Calculate initial center from points or use provided center
  const initialCenter = center || (points.length > 0 
    ? [points[0].lng, points[0].lat] 
    : [-0.1278, 51.5074]); // Default to London

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialCenter[0],
    latitude: initialCenter[1],
    zoom,
  });

  const handleMarkerClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    onMarkerClick?.(point);
    
    // Smoothly pan to marker
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: Math.max(viewState.zoom || zoom, 14),
        duration: 1000,
      });
    }
  }, [onMarkerClick, viewState.zoom, zoom]);

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
      >
        {/* Navigation Controls (zoom +/-) */}
        <NavigationControl position="top-right" />
        
        {/* Geolocation Control (find my location) */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />
        
        {/* Scale Control */}
        <ScaleControl position="bottom-left" />

        {/* Markers */}
        {points.map((point) => (
          <Marker
            key={point.id}
            longitude={point.lng}
            latitude={point.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(point);
            }}
          >
            <div 
              className="cursor-pointer transform transition-transform hover:scale-110"
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: "#9BAE82", // Brand sage green
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
        ))}

        {/* Popup for selected marker */}
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.lng}
            latitude={selectedPoint.lat}
            anchor="bottom"
            onClose={handleClosePopup}
            closeButton={true}
            closeOnClick={false}
            offset={25}
            className="mapbox-popup"
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
          </p>
        </div>
      )}
    </div>
  );
}



