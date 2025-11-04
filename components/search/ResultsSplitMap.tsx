"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const pin = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
});

interface Result {
  id: number;
  class_name: string;
  category: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
}

export default function ResultsSplitMap({ results }: { results: Result[] }) {
  const valid = results.filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number");
  const center = valid.length ? [valid[0].latitude!, valid[0].longitude!] : [51.2109, -1.4821];

  return (
    <div className="h-[60vh] overflow-hidden rounded-2xl border border-sage/20">
      <MapContainer center={center as [number, number]} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.map((r) => (
          <Marker key={r.id} position={[r.latitude!, r.longitude!] as [number, number]} icon={pin}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{r.class_name}</div>
                <div className="text-slateSoft">{r.category}</div>
                {r.postcode && <div className="mt-1 text-xs text-charcoal/70">{r.postcode}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
