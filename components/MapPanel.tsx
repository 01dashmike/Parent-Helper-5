"use client";

import "leaflet/dist/leaflet.css";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { SearchResult } from "@/hooks/useSearch";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSearchStore } from "@/store/searchStore";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface MapPanelProps {
  results: SearchResult[];
}

const DEFAULT_CENTER: [number, number] = [51.0629, -1.3131]; // Winchester

export default function MapPanel({ results }: MapPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const { activeId, setActiveId, lat, lng } = useSearchStore((state) => ({
    activeId: state.activeId,
    setActiveId: state.setActiveId,
    lat: state.lat,
    lng: state.lng,
  }));
  const [isSheetOpen, setIsSheetOpen] = useState(!isMobile);
  const [leafletModule, setLeafletModule] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    setIsSheetOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (leafletModule || typeof window === "undefined") return;

    void import("leaflet").then((module) => {
      setLeafletModule(module);
    });
  }, [leafletModule]);

  const positions = useMemo(
    () =>
      results
        .filter(
          (result) => typeof result.latitude === "number" && typeof result.longitude === "number"
        )
        .map((result) => ({
          id: result.id,
          position: [Number(result.latitude), Number(result.longitude)] as [number, number],
          title: result.name,
          description: result.description,
          town: result.town,
          distance: result.distance_km,
        })),
    [results]
  );

  const center = useMemo<[number, number]>(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      return [lat, lng];
    }
    return positions[0]?.position ?? DEFAULT_CENTER;
  }, [lat, lng, positions]);

  const baseIcon = useMemo(() => {
    if (!leafletModule) return null;
    return leafletModule.icon({
      iconUrl: "/icons/marker-teal.svg",
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      className: "map-marker",
    });
  }, [leafletModule]);

  const activeIcon = useMemo(() => {
    if (!leafletModule) return null;
    return leafletModule.icon({
      iconUrl: "/icons/marker-teal.svg",
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      className: shouldReduceMotion
        ? "map-marker map-marker--active"
        : "map-marker map-marker--pulse",
    });
  }, [leafletModule, shouldReduceMotion]);

  const markerIconFor = (isActive: boolean) =>
    isActive ? (activeIcon ?? undefined) : (baseIcon ?? undefined);

  const mapElement = (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={!isMobile}
      className="h-full w-full rounded-3xl"
      style={{ minHeight: isMobile ? 320 : 480 }}
    >
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {positions.map((item) => (
        <Marker
          key={item.id}
          position={item.position}
          icon={markerIconFor(activeId === item.id)}
          eventHandlers={{
            click: () => setActiveId(item.id),
            mouseover: () => setActiveId(item.id),
            mouseout: () => setActiveId(null),
          }}
        >
          <Popup>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-brand-teal">{item.title}</h3>
              {item.town ? <p className="text-xs text-brand-textMuted">{item.town}</p> : null}
              {typeof item.distance === "number" ? (
                <p className="text-xs text-brand-textMuted">{formatDistance(item.distance)}</p>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );

  if (isMobile) {
    return (
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => setIsSheetOpen((open) => !open)}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="fixed bottom-24 right-6 z-40 rounded-full bg-brand-coral px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          {isSheetOpen ? "Hide map" : "Show map"}
        </motion.button>

        <AnimatePresence>
          {isSheetOpen ? (
            <motion.div
              key="map-sheet"
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
              className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl bg-white/95 p-4 shadow-2xl backdrop-blur"
            >
              <div className="mx-auto h-[360px] max-w-6xl overflow-hidden rounded-3xl border border-brand-sage/60">
                {mapElement}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[480px] overflow-hidden rounded-3xl border border-brand-sage/60 bg-white/80 shadow-sm">
      {leafletModule ? (
        mapElement
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-brand-textMuted">
          Loading map…
        </div>
      )}
    </div>
  );
}

function formatDistance(distance: number) {
  if (Number.isNaN(distance)) return "";
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }
  return `${distance.toFixed(1)} km away`;
}
