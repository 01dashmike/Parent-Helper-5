"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import type { IconOptions, LatLngExpression, PointExpression } from "leaflet";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { useSearchStore } from "@/store/searchStore";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

const DEFAULT_POSITION: LatLngExpression = [51.0632, -1.308];

export function MapPanel() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const [mapReady, setMapReady] = useState(false);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const results = useSearchStore((state) => state.getFilteredResults());
  const highlightedId = useSearchStore((state) => state.highlightedId);

  useEffect(() => {
    setMapReady(true);
    import("leaflet").then((mod) => {
      setLeaflet(mod);
    });
  }, []);

  const { baseIcon, highlightIcon } = useMemo(() => {
    if (!mapReady || !leaflet) {
      return {
        baseIcon: undefined,
        highlightIcon: undefined,
      };
    }

    const iconOptions: IconOptions = {
      iconUrl: "/icons/marker-teal.svg",
      iconSize: [28, 36] as PointExpression,
      iconAnchor: [14, 36] as PointExpression,
    };

    return {
      baseIcon: leaflet.icon(iconOptions),
      highlightIcon: leaflet.icon({ ...iconOptions, iconSize: [34, 44] as PointExpression }),
    };
  }, [mapReady, leaflet]);

  const animation = {
    initial: { y: "100%" } as TargetAndTransition,
    animate: {
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" },
    } satisfies TargetAndTransition,
    exit: {
      y: "100%",
      transition: { duration: shouldReduceMotion ? 0 : 0.2, ease: "easeIn" },
    } satisfies TargetAndTransition,
  };

  const mapContent = mapReady ? (
    <MapContainer
      center={(results[0] && [results[0].lat, results[0].lng]) || DEFAULT_POSITION}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full rounded-3xl"
    >
      <TileLayer
        attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {results.map((result) => (
        <Marker
          key={result.id}
          position={[result.lat, result.lng]}
          icon={highlightedId === result.id && highlightIcon ? highlightIcon : baseIcon}
        >
          <Popup>
            <div className="space-y-2 text-brand-teal">
              <h3 className="text-sm font-semibold">{result.title}</h3>
              <a
                href="#"
                className="inline-flex text-xs font-medium text-brand-coral hover:text-brand-teal"
              >
                View details
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  ) : (
    <div className="flex h-full items-center justify-center rounded-3xl bg-brand-sage/40 text-brand-teal">
      Loading map…
    </div>
  );

  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center px-4 pb-6">
        <button
          type="button"
          onClick={() => setShowMobileMap((prev) => !prev)}
          className="pointer-events-auto rounded-full bg-brand-coral px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          {showMobileMap ? "Hide Map" : "Show Map"}
        </button>
        <AnimatePresence>
          {showMobileMap && <AnimateMobileMap animation={animation}>{mapContent}</AnimateMobileMap>}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="sticky top-0 hidden h-screen w-full max-w-sm flex-shrink-0 px-4 py-6 md:block">
      <div className="h-full overflow-hidden rounded-3xl bg-brand-cream shadow">{mapContent}</div>
    </div>
  );
}

type AnimateProps = {
  animation: {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    exit: TargetAndTransition;
  };
  children: React.ReactNode;
};

function AnimateMobileMap({ animation, children }: AnimateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      exit={animation.exit}
      className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto w-full max-w-4xl"
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
    >
      <div className="mb-3 flex justify-center">
        <div className="h-1.5 w-12 rounded-full bg-brand-teal/50" />
      </div>
      <div className="h-[55vh] overflow-hidden rounded-3xl bg-brand-cream shadow-lg">
        {children}
      </div>
    </motion.div>
  );
}
