# Mapbox Interactive Maps

Full-featured interactive maps powered by **Mapbox GL JS** and **react-map-gl v7**. Fully compatible with React 19.

## Overview

We now have **two map solutions**:

1. **Static Maps** (`MapboxStaticPreview`) - Fast, SEO-friendly, no interaction
2. **Interactive Maps** (`MapboxInteractive`, `MapboxClustered`) - Full pan/zoom/click functionality

## Installation

Dependencies are already added to `package.json`:

```json
{
  "dependencies": {
    "mapbox-gl": "^3.8.0",
    "react-map-gl": "^7.1.7"
  },
  "devDependencies": {
    "@types/mapbox-gl": "^3.4.0"
  }
}
```

Install with:

```bash
npm install
```

## Components

### 1. MapboxInteractive

Basic interactive map with pan, zoom, and clickable markers.

**Best for:**
- Single location pages
- Venue detail pages
- Small number of markers (< 50)

**Features:**
- ✅ Pan and zoom
- ✅ Clickable markers with popups
- ✅ Navigation controls (+/- buttons)
- ✅ Geolocation (find my location)
- ✅ Scale indicator
- ✅ Smooth animations

**Usage:**

```tsx
import { MapboxInteractive } from "@/components/map";

function VenueMap({ venue }) {
  const point = {
    id: venue.id,
    lat: venue.latitude,
    lng: venue.longitude,
    name: venue.name,
    venue: venue.address,
    distance: null,
  };

  return (
    <MapboxInteractive
      points={[point]}
      center={[point.lat, point.lng]}
      zoom={14}
      onMarkerClick={(point) => console.log("Clicked:", point)}
      className="w-full h-96 rounded-xl shadow-lg"
    />
  );
}
```

### 2. MapboxClustered

Advanced map with automatic marker clustering for large datasets.

**Best for:**
- Search results pages
- Category browse pages
- Large number of markers (50+)

**Features:**
- ✅ All features from MapboxInteractive
- ✅ **Automatic clustering** when markers are close together
- ✅ Click clusters to zoom and expand
- ✅ Performance optimized for 1000+ markers
- ✅ Smooth cluster animations

**Usage:**

```tsx
import { MapboxClustered } from "@/components/map";

function SearchResultsMap({ results }) {
  const points = results.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    name: r.title,
    venue: r.venue_name,
    distance: r.distance,
  }));

  return (
    <MapboxClustered
      points={points}
      zoom={11}
      minClusterPoints={10}
      onMarkerClick={(point) => {
        // Navigate to detail page
        window.location.href = `/classes/${point.id}`;
      }}
      className="w-full h-full"
    />
  );
}
```

### 3. MapboxStaticPreview (for comparison)

Static image, no interaction needed.

**Best for:**
- Email templates
- Social media shares
- Quick page loads
- SEO-critical pages

```tsx
import { MapboxStaticPreview } from "@/components/map";

<MapboxStaticPreview
  points={points}
  zoom={12}
  width={800}
  height={600}
/>
```

## Props Reference

### Common Props (both components)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `points` | `MapPoint[]` | **Required** | Array of locations to display |
| `center` | `[lat, lng]` | Auto-calculated | Initial map center |
| `zoom` | `number` | `13` | Initial zoom level (0-22) |
| `onMarkerClick` | `(point: MapPoint) => void` | - | Callback when marker clicked |
| `className` | `string` | `""` | CSS classes for container |
| `style` | `CSSProperties` | `{}` | Inline styles for container |

### MapboxClustered Only

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minClusterPoints` | `number` | `5` | Minimum markers to enable clustering |

### MapPoint Type

```typescript
type MapPoint = {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  venue?: string;
  distance?: number | null;
};
```

## Styling

### Custom Marker Colors

Edit the marker style in the component files:

```tsx
// Change from sage green (#9BAE82) to terracotta (#C97C5C)
style={{
  backgroundColor: "#C97C5C", // Your custom color
  // ... rest of styles
}}
```

### Custom Cluster Colors

In `MapboxClustered.tsx`, modify the `clusterLayer` paint property:

```tsx
"circle-color": [
  "step",
  ["get", "point_count"],
  "#C97C5C", // Small clusters - your color
  10,
  "#B86B4D", // Medium clusters
  25,
  "#A45A3E", // Large clusters
],
```

### Custom Popup Styles

Add CSS to override default popup styles:

```css
/* In your global CSS or component */
.mapboxgl-popup-content {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mapboxgl-popup-tip {
  border-top-color: white;
}
```

## Performance Tips

### 1. Lazy Load Maps

For pages where maps aren't immediately visible:

```tsx
import { lazy, Suspense } from "react";

const LazyMap = lazy(() => import("@/components/map/MapboxClustered"));

function MyPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <LazyMap points={points} />
    </Suspense>
  );
}
```

### 2. Use Static Maps for Initial Load

Progressive enhancement - start with static, upgrade to interactive:

```tsx
const [interactive, setInteractive] = useState(false);

{!interactive ? (
  <MapboxStaticPreview 
    points={points}
    onClick={() => setInteractive(true)}
  />
) : (
  <MapboxClustered points={points} />
)}
```

### 3. Filter Points Before Passing

Don't pass thousands of markers if user can't see them:

```tsx
const visiblePoints = useMemo(() => {
  return allPoints
    .filter(p => p.distance < maxDistance)
    .slice(0, 100); // Limit to 100 closest
}, [allPoints, maxDistance]);

<MapboxClustered points={visiblePoints} />
```

### 4. Use Clustering for 50+ Markers

```tsx
// Automatically switch based on count
{points.length > 50 ? (
  <MapboxClustered points={points} />
) : (
  <MapboxInteractive points={points} />
)}
```

## Map Styles

Change the Mapbox style:

```tsx
// In MapboxInteractive.tsx or MapboxClustered.tsx
mapStyle="mapbox://styles/mapbox/light-v11"  // Light theme
mapStyle="mapbox://styles/mapbox/dark-v11"   // Dark theme
mapStyle="mapbox://styles/mapbox/outdoors-v12" // Outdoors
mapStyle="mapbox://styles/mapbox/satellite-v9" // Satellite
```

Available styles:
- `streets-v12` (default)
- `light-v11`
- `dark-v11`
- `outdoors-v12`
- `satellite-v9`
- `satellite-streets-v12`

Or use your custom style: `mapbox://styles/YOUR_USERNAME/YOUR_STYLE_ID`

## Event Handling

### Click Handler

```tsx
<MapboxInteractive
  points={points}
  onMarkerClick={(point) => {
    // Log to analytics
    track("map_marker_clicked", {
      point_id: point.id,
      point_name: point.name,
    });
    
    // Navigate
    router.push(`/classes/${point.id}`);
  }}
/>
```

### Hover Effects

Markers already have hover scale animation. To add custom hover:

```tsx
// In the marker div
onMouseEnter={() => setHoveredId(point.id)}
onMouseLeave={() => setHoveredId(null)}
className={hoveredId === point.id ? "scale-125" : "scale-100"}
```

## Advanced Features

### Fit Bounds to All Markers

```tsx
import { useRef, useEffect } from "react";
import type { MapRef } from "react-map-gl";

const mapRef = useRef<MapRef>(null);

useEffect(() => {
  if (!mapRef.current || points.length === 0) return;

  const bounds = points.reduce((bounds, point) => {
    return bounds.extend([point.lng, point.lat]);
  }, new mapboxgl.LngLatBounds(
    [points[0].lng, points[0].lat],
    [points[0].lng, points[0].lat]
  ));

  mapRef.current.fitBounds(bounds, {
    padding: 50,
    duration: 1000,
  });
}, [points]);
```

### Draw Routes Between Points

Mapbox GL JS supports routing. See [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/).

### Add Heatmap Layer

```tsx
import { Layer, Source } from "react-map-gl";

<Source
  id="heatmap"
  type="geojson"
  data={geojsonData}
>
  <Layer
    id="heatmap-layer"
    type="heatmap"
    paint={{
      "heatmap-weight": 1,
      "heatmap-intensity": 1,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(0,0,255,0)",
        0.5, "rgb(255,255,0)",
        1, "rgb(255,0,0)"
      ],
      "heatmap-radius": 30,
    }}
  />
</Source>
```

## Troubleshooting

### Maps not rendering

1. **Check token**:
   ```bash
   echo $NEXT_PUBLIC_MAPBOX_TOKEN
   ```

2. **Restart dev server** after adding token:
   ```bash
   npm run dev
   ```

3. **Check browser console** for errors

### CSS not loading

Import the CSS in your component or `globals.css`:

```tsx
import "mapbox-gl/dist/mapbox-gl.css";
```

### TypeScript errors

Make sure types are installed:

```bash
npm install --save-dev @types/mapbox-gl
```

### "Token is required" error

Token must be in `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

Restart server after adding.

### Markers not showing

Check that coordinates are valid:

```tsx
const validPoints = points.filter(p => 
  p.lat >= -90 && p.lat <= 90 &&
  p.lng >= -180 && p.lng <= 180
);
```

### Slow performance with many markers

1. Use `MapboxClustered` instead of `MapboxInteractive`
2. Reduce `points` array before passing
3. Increase `minClusterPoints` prop
4. Lazy load the map component

## Pricing

### Mapbox GL JS (Interactive Maps)

- **Free tier**: 50,000 map loads/month
- **Pay-as-you-go**: $5 per 1,000 loads after free tier

### Comparison with Static Maps

- Static: $0.10 per 1,000 requests = **10x cheaper**
- Interactive: $5 per 1,000 loads

**Strategy**: Use static maps where possible, interactive where needed.

## Bundle Size

- `mapbox-gl`: ~280 KB gzipped
- `react-map-gl`: ~30 KB gzipped

**Total**: ~310 KB added to your bundle

**Mitigation**: Use lazy loading to split this into a separate chunk.

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Android Chrome (latest)
- ❌ IE 11 (not supported)

## Migration Guide

### From React-Leaflet to Mapbox

**Before (React-Leaflet - broken):**

```tsx
import { MapContainer, TileLayer, Marker } from "react-leaflet";

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="..." />
  <Marker position={[lat, lng]} />
</MapContainer>
```

**After (Mapbox GL JS - works!):**

```tsx
import { MapboxInteractive } from "@/components/map";

<MapboxInteractive
  points={[{ id: 1, lat, lng, name: "Location" }]}
  center={[lat, lng]}
  zoom={13}
/>
```

Much cleaner and React 19 compatible! ✨

## Resources

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [react-map-gl Docs](https://visgl.github.io/react-map-gl/)
- [Mapbox Styles](https://docs.mapbox.com/api/maps/styles/)
- [Mapbox Examples](https://docs.mapbox.com/mapbox-gl-js/example/)

## Next Steps

1. Install dependencies: `npm install`
2. Import a map component
3. Pass your data as `MapPoint[]`
4. Customize styles and behavior
5. Deploy! 🚀






