/**
 * Mapbox Static Images API Utility
 * 
 * Generates static map preview images without requiring interactive map libraries.
 * Compatible with React 19 - no dependency conflicts.
 * 
 * @see https://docs.mapbox.com/api/maps/static-images/
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_USERNAME = "jtmchilton"; // Your Mapbox username
const DEFAULT_STYLE = "streets-v12"; // Mapbox default street style

interface MapboxStaticOptions {
  /** Center longitude */
  lng: number;
  /** Center latitude */
  lat: number;
  /** Zoom level (0-22) */
  zoom?: number;
  /** Image width in pixels (1-1280) */
  width?: number;
  /** Image height in pixels (1-1280) */
  height?: number;
  /** Retina display (@2x) */
  retina?: boolean;
  /** Mapbox style ID */
  style?: string;
  /** Bearing/rotation (0-359 degrees) */
  bearing?: number;
  /** Pitch/tilt (0-60 degrees) */
  pitch?: number;
  /** Markers to overlay on the map */
  markers?: MapboxMarker[];
  /** Attribution display */
  attribution?: boolean;
  /** Logo display */
  logo?: boolean;
}

interface MapboxMarker {
  lng: number;
  lat: number;
  /** Marker color (hex without #, or Mapbox color name) */
  color?: string;
  /** Marker label (0-99 or a-z) */
  label?: string;
  /** Marker size: small, large */
  size?: "small" | "large";
}

/**
 * Generate a Mapbox Static Images API URL
 * 
 * @example
 * ```tsx
 * const mapUrl = generateMapboxStaticUrl({
 *   lat: 51.5074,
 *   lng: -0.1278,
 *   zoom: 13,
 *   width: 600,
 *   height: 400,
 *   markers: [{ lat: 51.5074, lng: -0.1278, color: "9BAE82" }]
 * });
 * 
 * <img src={mapUrl} alt="Map preview" />
 * ```
 */
export function generateMapboxStaticUrl(options: MapboxStaticOptions): string {
  const {
    lng,
    lat,
    zoom = 13,
    width = 600,
    height = 400,
    retina = false,
    style = DEFAULT_STYLE,
    bearing = 0,
    pitch = 0,
    markers = [],
    attribution = true,
    logo = true,
  } = options;

  if (!MAPBOX_TOKEN) {
    console.warn("[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN is not set in environment variables. Maps will not be available.");
    return "";
  }

  // Validate dimensions
  const validWidth = Math.min(Math.max(1, width), 1280);
  const validHeight = Math.min(Math.max(1, height), 1280);

  // Build overlay string for markers
  let overlay = "";
  if (markers.length > 0) {
    const markerStrings = markers.map((marker) => {
      const parts: string[] = [];
      
      // Pin style
      parts.push("pin");
      
      // Size (optional)
      if (marker.size) {
        parts.push(`-${marker.size}`);
      } else {
        parts.push("-s"); // Default to small
      }
      
      // Label (optional)
      if (marker.label) {
        parts.push(`-${marker.label}`);
      }
      
      // Color (optional, default to brand sage green)
      const color = marker.color || "9BAE82";
      parts.push(`+${color}`);
      
      // Coordinates
      parts.push(`(${marker.lng},${marker.lat})`);
      
      return parts.join("");
    });
    
    overlay = markerStrings.join(",");
  }

  // Build the URL
  const overlayPart = overlay ? `${overlay}/` : "";
  const retinaStr = retina ? "@2x" : "";
  
  // Static Images API format:
  // https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}/{width}x{height}{@2x}
  const url = new URL(
    `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${style}/static/${overlayPart}${lng},${lat},${zoom},${bearing},${pitch}/${validWidth}x${validHeight}${retinaStr}`
  );

  // Add query parameters
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  url.searchParams.set("attribution", attribution ? "true" : "false");
  url.searchParams.set("logo", logo ? "true" : "false");

  return url.toString();
}

/**
 * Generate a static map URL with a single marker at the center
 */
export function generateMapboxStaticMarker(
  lat: number,
  lng: number,
  options?: Partial<Omit<MapboxStaticOptions, "lat" | "lng" | "markers">>
): string {
  return generateMapboxStaticUrl({
    lat,
    lng,
    markers: [{ lat, lng, color: "9BAE82", size: "large" }],
    ...options,
  });
}

/**
 * Generate a static map URL showing multiple locations with auto-fit bounds
 * Note: For auto-fit, you'll need to calculate bounds on the client side
 * or use the Mapbox GL JS library. This is a simple center-based approach.
 */
export function generateMapboxStaticMultiple(
  locations: Array<{ lat: number; lng: number; label?: string }>,
  options?: Partial<Omit<MapboxStaticOptions, "markers">>
): string {
  if (locations.length === 0) {
    console.warn("No locations provided for map");
    return "";
  }

  // Calculate center point (simple average)
  const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
  const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

  // Create markers from locations
  const markers: MapboxMarker[] = locations.map((loc, idx) => ({
    lat: loc.lat,
    lng: loc.lng,
    color: "9BAE82", // Brand sage green
    label: loc.label || (idx < 10 ? idx.toString() : undefined),
    size: "small",
  }));

  // Auto-adjust zoom based on number of locations (rough estimate)
  let autoZoom = 13;
  if (locations.length > 20) autoZoom = 11;
  else if (locations.length > 10) autoZoom = 12;
  else if (locations.length > 5) autoZoom = 12;

  return generateMapboxStaticUrl({
    lat: avgLat,
    lng: avgLng,
    zoom: autoZoom,
    markers,
    ...options,
  });
}

/**
 * Mapbox style presets
 */
export const MapboxStyles = {
  streets: "streets-v12",
  outdoors: "outdoors-v12",
  light: "light-v11",
  dark: "dark-v11",
  satellite: "satellite-v9",
  satelliteStreets: "satellite-streets-v12",
} as const;

export type MapboxStyleId = typeof MapboxStyles[keyof typeof MapboxStyles];


