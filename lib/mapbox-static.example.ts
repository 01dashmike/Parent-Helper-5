/**
 * Mapbox Static Images API - Usage Examples
 * 
 * This file demonstrates how to use the Mapbox static map utilities
 * throughout your application.
 */

import { 
  generateMapboxStaticUrl, 
  generateMapboxStaticMarker, 
  generateMapboxStaticMultiple,
  MapboxStyles 
} from "./mapbox-static";

// =====================================================
// EXAMPLE 1: Single Location with Marker
// =====================================================
// Perfect for: Class detail pages, venue pages

export function singleLocationExample() {
  const url = generateMapboxStaticMarker(
    51.5074, // latitude (London)
    -0.1278, // longitude
    {
      zoom: 14,
      width: 600,
      height: 400,
      retina: true, // High DPI displays
    }
  );
  
  // Use in JSX:
  // <img src={url} alt="Class location" />
  return url;
}

// =====================================================
// EXAMPLE 2: Multiple Locations (Search Results)
// =====================================================
// Perfect for: Search results page, category pages

export function multipleLocationsExample() {
  const locations = [
    { lat: 51.5074, lng: -0.1278, label: "1" },
    { lat: 51.5155, lng: -0.0922, label: "2" },
    { lat: 51.4975, lng: -0.1357, label: "3" },
  ];
  
  const url = generateMapboxStaticMultiple(locations, {
    width: 800,
    height: 600,
    zoom: 12,
    retina: true,
  });
  
  return url;
}

// =====================================================
// EXAMPLE 3: Custom Styled Map
// =====================================================
// Perfect for: Different sections with different themes

export function customStyledMapExample() {
  const url = generateMapboxStaticUrl({
    lat: 51.5074,
    lng: -0.1278,
    zoom: 13,
    width: 600,
    height: 400,
    style: MapboxStyles.light, // Light theme
    retina: true,
    markers: [
      {
        lat: 51.5074,
        lng: -0.1278,
        color: "C97C5C", // Terracotta brand color
        size: "large",
        label: "A",
      },
    ],
  });
  
  return url;
}

// =====================================================
// EXAMPLE 4: Map with Custom Bearing and Pitch
// =====================================================
// Perfect for: Highlighting specific areas or directions

export function customViewExample() {
  const url = generateMapboxStaticUrl({
    lat: 51.5074,
    lng: -0.1278,
    zoom: 15,
    width: 800,
    height: 600,
    bearing: 45, // Rotate map 45 degrees
    pitch: 30, // Tilt map for 3D effect
    style: MapboxStyles.satelliteStreets,
    markers: [],
  });
  
  return url;
}

// =====================================================
// EXAMPLE 5: Minimal Map (No Attribution/Logo)
// =====================================================
// Perfect for: Small thumbnails, email embeds

export function minimalMapExample() {
  const url = generateMapboxStaticUrl({
    lat: 51.5074,
    lng: -0.1278,
    zoom: 13,
    width: 300,
    height: 200,
    attribution: false,
    logo: false,
    markers: [
      {
        lat: 51.5074,
        lng: -0.1278,
        color: "9BAE82", // Sage green
        size: "small",
      },
    ],
  });
  
  return url;
}

// =====================================================
// EXAMPLE 6: Dynamic Map for Email
// =====================================================
// Perfect for: Booking confirmations, newsletters

export function emailMapExample(
  className: string,
  venueName: string,
  lat: number,
  lng: number
) {
  const url = generateMapboxStaticMarker(lat, lng, {
    zoom: 14,
    width: 600,
    height: 300,
    retina: true,
    style: MapboxStyles.streets,
  });
  
  // Email-safe HTML
  return `
    <div style="margin: 20px 0;">
      <h3 style="margin-bottom: 10px;">${className} at ${venueName}</h3>
      <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank">
        <img 
          src="${url}" 
          alt="Map to ${venueName}" 
          style="max-width: 100%; border-radius: 8px; border: 1px solid #9BAE82;"
        />
      </a>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">
        Click map to open in Google Maps
      </p>
    </div>
  `;
}

// =====================================================
// EXAMPLE 7: Responsive Map for Next.js Image
// =====================================================
// Perfect for: Any modern React/Next.js component

export function nextImageMapExample() {
  // In your component:
  /*
  import Image from "next/image";
  import { generateMapboxStaticMarker } from "@/lib/mapbox-static";
  
  function MyComponent() {
    const mapUrl = generateMapboxStaticMarker(51.5074, -0.1278, {
      width: 800,
      height: 600,
      retina: true,
    });
    
    return (
      <Image
        src={mapUrl}
        alt="Location map"
        width={800}
        height={600}
        quality={90}
        unoptimized // Mapbox already optimizes
      />
    );
  }
  */
}

// =====================================================
// EXAMPLE 8: Map with All Available Styles
// =====================================================

export function allStylesExample(lat: number, lng: number) {
  return {
    streets: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.streets }),
    outdoors: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.outdoors }),
    light: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.light }),
    dark: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.dark }),
    satellite: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.satellite }),
    satelliteStreets: generateMapboxStaticMarker(lat, lng, { style: MapboxStyles.satelliteStreets }),
  };
}



