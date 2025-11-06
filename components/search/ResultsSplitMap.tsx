"use client";

import { MapContainer, Marker, Popup, Tooltip, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "@/styles/markercluster-fix.css";
import L from "leaflet";
import { useEffect, useRef, memo } from "react";
import { useSearchParams } from "next/navigation";
import { useMapPreferences } from "@/hooks/useMapPreferences";
import { logMapInteraction } from "@/lib/analytics";
import {
  MARKER_CONFIG,
  MARKER_FILTERS,
  ANIMATION_CONFIG,
  CLUSTER_CONFIG,
  MAP_SETTINGS,
  BRAND_COLORS,
  TOOLTIP_CONFIG,
} from "@/lib/mapConfig";

// ========================================
// BRANDED MARKER ICONS
// ========================================
// Icons are configured using centralized values from lib/mapConfig.ts
// To customize: edit MARKER_CONFIG and MARKER_FILTERS in mapConfig.ts

const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Default pin
const pin = new L.Icon({
  iconUrl: MARKER_ICON_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [MARKER_CONFIG.defaultSize.width, MARKER_CONFIG.defaultSize.height],
  iconAnchor: [MARKER_CONFIG.defaultAnchor.x, MARKER_CONFIG.defaultAnchor.y],
  popupAnchor: [1, -34],
  shadowSize: [MARKER_CONFIG.defaultShadowSize.width, MARKER_CONFIG.defaultShadowSize.height],
  className: "",
});

// Active pin - when result card is hovered (cream glow)
const activePin = new L.Icon({
  iconUrl: MARKER_ICON_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [MARKER_CONFIG.hoverSize.width, MARKER_CONFIG.hoverSize.height],
  iconAnchor: [MARKER_CONFIG.hoverAnchor.x, MARKER_CONFIG.hoverAnchor.y],
  popupAnchor: [1, -38],
  shadowSize: [MARKER_CONFIG.hoverShadowSize.width, MARKER_CONFIG.hoverShadowSize.height],
  className: "active",
});

// Selected pin - when marker is clicked
const selectedPin = new L.Icon({
  iconUrl: MARKER_ICON_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [MARKER_CONFIG.selectedSize.width, MARKER_CONFIG.selectedSize.height],
  iconAnchor: [MARKER_CONFIG.selectedAnchor.x, MARKER_CONFIG.selectedAnchor.y],
  popupAnchor: [1, -40],
  shadowSize: [MARKER_CONFIG.selectedShadowSize.width, MARKER_CONFIG.selectedShadowSize.height],
  className: "selected",
});

interface Result {
  id: number;
  class_name: string;
  category: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}

interface MapProps {
  results: Result[];
  selectedId: number | null;
  hoveredId: number | null;
  activeResultId: number | null; // For hover synchronization
  onMarkerClick: (id: number) => void;
}

// Component to auto-fit map bounds and save preferences
function AutoFitBounds({ results }: { results: Result[] }) {
  const map = useMap();
  const { savePreferences } = useMapPreferences();
  const searchParams = useSearchParams();

  useEffect(() => {
    const valid = results.filter(
      (r) => typeof r.latitude === "number" && typeof r.longitude === "number"
    );

    if (valid.length > 0) {
      const bounds = L.latLngBounds(
        valid.map((r) => [r.latitude!, r.longitude!] as [number, number])
      );
      map.fitBounds(bounds, {
        padding: MAP_SETTINGS.boundsSettings.padding,
        maxZoom: MAP_SETTINGS.boundsSettings.maxZoom
      });
    }
  }, [results, map]);

  return null;
}

// Component to save map position and log analytics
function MapPreferencesSaver() {
  const { savePreferences } = useMapPreferences();
  const searchParams = useSearchParams();

  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      const bounds = e.target.getBounds();

      // Save preferences
      savePreferences({
        lat: center.lat,
        lng: center.lng,
        zoom,
        searchParams: searchParams?.toString(),
      });

      // Log analytics
      logMapInteraction({
        action: "pan",
        zoom,
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      });
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();

      logMapInteraction({
        action: "zoom",
        zoom,
        center: { lat: center.lat, lng: center.lng },
      });
    },
  });

  return null;
}

// Custom cluster icon creator - styled via styles/leaflet-custom.css
// react-leaflet-markercluster automatically applies marker-cluster-small/medium/large
function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount();

  // Library will auto-apply marker-cluster-small/medium/large based on count
  // Our CSS in leaflet-custom.css handles the branded sage green styling
  return L.divIcon({
    html: `<div><span>${count}</span></div>`,
    className: "marker-cluster",
    iconSize: L.point(40, 40, true),
  });
}

// Memoized map component to prevent unnecessary re-renders
const ResultsSplitMap = memo(function ResultsSplitMap({
  results,
  selectedId,
  hoveredId,
  activeResultId,
  onMarkerClick
}: MapProps) {
  const { preferences, isLoaded } = useMapPreferences();

  const valid = results.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number"
  );

  // Use saved preferences if available, otherwise use first result or default
  const center = isLoaded && preferences.center
    ? [preferences.center.lat, preferences.center.lng]
    : valid.length
      ? [valid[0].latitude!, valid[0].longitude!]
      : [MAP_SETTINGS.defaultCenter.lat, MAP_SETTINGS.defaultCenter.lng];

  const zoom = isLoaded && preferences.zoom
    ? preferences.zoom
    : MAP_SETTINGS.defaultZoom;

  // Track which marker was just clicked for pulse animation
  const pulseIdRef = useRef<number | null>(null);

  const handleMarkerClick = (id: number) => {
    pulseIdRef.current = id;
    onMarkerClick(id);

    // Log marker click
    logMapInteraction({
      action: "marker_click",
      zoom: zoom,
    });

    // Remove pulse effect after animation completes
    setTimeout(() => {
      if (pulseIdRef.current === id) {
        pulseIdRef.current = null;
      }
    }, ANIMATION_CONFIG.pulseDuration);
  };

  // Determine which icon to use for each marker with priority
  const getMarkerIcon = (id: number) => {
    if (selectedId === id) return selectedPin;
    if (activeResultId === id) return activePin; // Result card hovered
    if (hoveredId === id) return activePin; // Marker itself hovered
    return pin;
  };

  // Get z-index offset for bringing hovered markers to front
  const getZIndexOffset = (id: number) => {
    if (selectedId === id) return 2000;
    if (hoveredId === id || activeResultId === id) return 1000;
    return 0;
  };

  return (
    <div
      className="h-[60vh] overflow-hidden rounded-2xl border border-sage/20 bg-white shadow-sm"
      role="region"
      aria-label="Interactive map showing class locations"
    >
      <MapContainer
        center={center as [number, number]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={MAP_SETTINGS.scrollWheelZoom}
        aria-label="Map of baby and toddler class locations"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Save map position when user moves or zooms */}
        <MapPreferencesSaver />

        {/* Auto-fit bounds when results change */}
        <AutoFitBounds results={valid} />

        {/* Marker clustering with branded styling from leaflet-custom.css */}
        <MarkerClusterGroup
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={CLUSTER_CONFIG.maxClusterRadius}
          spiderfyOnMaxZoom={MAP_SETTINGS.spiderfyOnMaxZoom}
          showCoverageOnHover={MAP_SETTINGS.showCoverageOnHover}
          zoomToBoundsOnClick={MAP_SETTINGS.zoomToBoundsOnClick}
          animate={true}
          removeOutsideVisibleBounds={MAP_SETTINGS.removeOutsideVisibleBounds}
        >
          {valid.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude!, r.longitude!] as [number, number]}
              icon={getMarkerIcon(r.id)}
              zIndexOffset={getZIndexOffset(r.id)}
              eventHandlers={{
                click: () => handleMarkerClick(r.id),
              }}
              aria-label={`Location marker for ${r.class_name}`}
            >
              {/* Hover tooltip - shows on marker hover */}
              <Tooltip
                direction="top"
                offset={[0, -35]}
                opacity={1}
                permanent={false}
                className="map-marker-tooltip"
              >
                <div style={{ minWidth: '120px' }}>
                  <div style={{
                    fontWeight: 600,
                    color: '#3D3D3D',
                    fontSize: '13px',
                    lineHeight: '1.3',
                    marginBottom: '4px'
                  }}>
                    {r.class_name}
                  </div>
                  <div style={{
                    color: '#6B7280',
                    fontSize: '12px'
                  }}>
                    {r.category}
                  </div>
                </div>
              </Tooltip>

              {/* Click popup - premium styled */}
              <Popup
                closeButton={true}
                className="map-marker-popup"
                minWidth={220}
              >
                <div>
                  <h3 style={{
                    color: '#9BAE82',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    {r.class_name}
                  </h3>
                  <p style={{
                    color: 'rgba(61, 61, 61, 0.8)',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    {r.category}
                  </p>
                  {r.postcode && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: 'rgba(61, 61, 61, 0.7)'
                    }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{r.postcode}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
});

export default ResultsSplitMap;
