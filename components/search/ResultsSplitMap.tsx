"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapPoint = {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
};

type Props = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
};

export type { MapPoint };

export default function ResultsSplitMap({ points, center, zoom = 11 }: Props) {
  const fallbackCenter: [number, number] = [51.5074, -0.1278];
  const initialCenter: [number, number] =
    center ?? (points.length ? [points[0].lat, points[0].lng] : fallbackCenter);

  return (
    <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {points.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]}>
          <Popup>
            <strong>{point.name}</strong>
            {point.venue ? <div>{point.venue}</div> : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
