# Mapbox Static Maps

This project uses **Mapbox Static Images API** to display map previews without requiring interactive map libraries. This approach is fully compatible with React 19 and has no dependency conflicts.

## Overview

- **No React-Leaflet**: We removed React-Leaflet due to React 19 incompatibility
- **Static Images**: Maps are now static images generated via Mapbox API
- **Zero Bundle Size**: No map libraries shipped to the client
- **Fast Loading**: Pre-rendered images load instantly
- **Cost Effective**: Static API requests are cheaper than interactive maps

## Setup

### 1. Environment Variable

Your Mapbox token is already configured in `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoianRtY2hpbHRvbiIsImEiOiJjbWlvbGhwYnYwMzRnM2NzNWw1ajJ2bm0wIn0.9K3CeiBlIJgX5OsV1bEA-w
```

### 2. Files Created

- **`lib/mapbox-static.ts`** - Core utility functions for generating Mapbox URLs
- **`lib/mapbox-static.example.ts`** - Usage examples for different scenarios
- **`components/search/MapboxStaticPreview.tsx`** - React component for displaying maps
- **`components/search/ResultsSplitMap.tsx`** - Updated to use static maps

## Usage

### Basic Example: Single Location

```tsx
import { generateMapboxStaticMarker } from "@/lib/mapbox-static";

function VenueMap({ lat, lng }: { lat: number; lng: number }) {
  const mapUrl = generateMapboxStaticMarker(lat, lng, {
    zoom: 14,
    width: 600,
    height: 400,
    retina: true,
  });

  return <img src={mapUrl} alt="Venue location" />;
}
```

### Multiple Locations (Search Results)

```tsx
import { generateMapboxStaticMultiple } from "@/lib/mapbox-static";

function SearchResultsMap({ results }: { results: ClassResult[] }) {
  const locations = results.map((r, idx) => ({
    lat: r.latitude,
    lng: r.longitude,
    label: (idx + 1).toString(),
  }));

  const mapUrl = generateMapboxStaticMultiple(locations, {
    width: 800,
    height: 600,
    zoom: 12,
  });

  return <img src={mapUrl} alt={`Map showing ${results.length} locations`} />;
}
```

### Using the React Component

```tsx
import MapboxStaticPreview from "@/components/search/MapboxStaticPreview";

function MyComponent({ points }: { points: MapPoint[] }) {
  return (
    <MapboxStaticPreview
      points={points}
      zoom={13}
      width={800}
      height={600}
      className="rounded-xl shadow-lg"
    />
  );
}
```

## API Reference

### `generateMapboxStaticUrl(options)`

Most flexible function - full control over all parameters.

**Options:**
- `lat: number` - Center latitude
- `lng: number` - Center longitude
- `zoom?: number` - Zoom level (0-22), default 13
- `width?: number` - Image width (1-1280px), default 600
- `height?: number` - Image height (1-1280px), default 400
- `retina?: boolean` - @2x for high DPI displays, default false
- `style?: string` - Mapbox style ID, default "streets-v12"
- `bearing?: number` - Map rotation (0-359°), default 0
- `pitch?: number` - Map tilt (0-60°), default 0
- `markers?: MapboxMarker[]` - Array of markers to display
- `attribution?: boolean` - Show attribution, default true
- `logo?: boolean` - Show Mapbox logo, default true

### `generateMapboxStaticMarker(lat, lng, options)`

Quick function for a single location with a marker.

```tsx
const url = generateMapboxStaticMarker(51.5074, -0.1278, {
  zoom: 14,
  width: 600,
  height: 400,
});
```

### `generateMapboxStaticMultiple(locations, options)`

Show multiple locations with numbered markers. Auto-calculates center point.

```tsx
const url = generateMapboxStaticMultiple(
  [
    { lat: 51.5074, lng: -0.1278, label: "1" },
    { lat: 51.5155, lng: -0.0922, label: "2" },
  ],
  { zoom: 12 }
);
```

## Map Styles

Use the `MapboxStyles` constant for predefined styles:

```tsx
import { MapboxStyles } from "@/lib/mapbox-static";

const url = generateMapboxStaticUrl({
  lat: 51.5074,
  lng: -0.1278,
  style: MapboxStyles.light, // or .dark, .satellite, etc.
  // ... other options
});
```

Available styles:
- `streets` (default)
- `outdoors`
- `light`
- `dark`
- `satellite`
- `satelliteStreets`

## Brand Colors

Default markers use Parent Helper's sage green: `#9BAE82`

Custom marker colors:

```tsx
markers: [
  { lat: 51.5074, lng: -0.1278, color: "C97C5C" }, // Terracotta
  { lat: 51.5155, lng: -0.0922, color: "9BAE82" }, // Sage green
]
```

## Pricing

Mapbox Static Images API pricing (as of 2024):
- **Free tier**: 50,000 requests/month
- **Pay-as-you-go**: $0.10 per 1,000 requests after free tier

Static maps are ~10x cheaper than interactive maps.

## Performance

Static images have several advantages:
- **No JavaScript bundle**: Interactive maps can be 200-500KB
- **Instant load**: Images cached by CDN
- **SEO friendly**: Search engines can see the map
- **Works without JS**: Progressive enhancement

## Limitations

Static maps don't support:
- ❌ Panning and zooming
- ❌ Interactive markers/popups
- ❌ Real-time updates
- ❌ Custom overlays

If you need these features, consider:
1. **Mapbox GL JS** (React 19 compatible)
2. **React-Map-GL** (wrapper for Mapbox GL JS)
3. **Google Maps** (requires different token)

## Future Enhancements

To add interactive maps later (when needed):

```bash
npm install mapbox-gl react-map-gl
```

The `MapPoint` type and component structure are already compatible - just swap the implementation.

## Troubleshooting

### Maps not showing

1. Check token is in `.env.local`:
   ```bash
   echo $NEXT_PUBLIC_MAPBOX_TOKEN
   ```

2. Restart dev server after adding token:
   ```bash
   npm run dev
   ```

3. Check browser console for errors

### Invalid coordinates

Ensure coordinates are valid:
- Latitude: -90 to 90
- Longitude: -180 to 180

### Image quality

For Retina displays, use `retina: true`:

```tsx
generateMapboxStaticMarker(lat, lng, { retina: true });
```

This generates @2x images for crisp display on high-DPI screens.

## Resources

- [Mapbox Static Images API Docs](https://docs.mapbox.com/api/maps/static-images/)
- [Mapbox Styles](https://docs.mapbox.com/api/maps/styles/)
- [Mapbox Pricing](https://www.mapbox.com/pricing)

## Migration Notes

### Before (React-Leaflet)

```tsx
import { MapContainer, Marker } from "react-leaflet";

<MapContainer center={[lat, lng]} zoom={13}>
  <Marker position={[lat, lng]} />
</MapContainer>
```

### After (Mapbox Static)

```tsx
import { generateMapboxStaticMarker } from "@/lib/mapbox-static";

const mapUrl = generateMapboxStaticMarker(lat, lng, { zoom: 13 });
<img src={mapUrl} alt="Map" />
```

Much simpler, faster, and React 19 compatible! ✨






