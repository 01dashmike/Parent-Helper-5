# Maps - Complete Guide

This project uses **Mapbox** for all mapping needs. We have both static and interactive map solutions, all React 19 compatible.

## Quick Start

```bash
# Already configured in .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoianRtY2hpbHRvbiIsImEiOiJjbWlvbGhwYnYwMzRnM2NzNWw1ajJ2bm0wIn0.9K3CeiBlIJgX5OsV1bEA-w

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Choose Your Map Type

### 🖼️ Static Maps (No Interaction)

**When to use:**
- Email templates
- Social media shares
- SEO-critical pages
- Fast initial page load
- No interaction needed

**Bundle size:** 0 KB (images only)

**Cost:** $0.10 per 1,000 requests

```tsx
import { MapboxStaticPreview } from "@/components/map";

<MapboxStaticPreview
  points={points}
  zoom={12}
  width={800}
  height={600}
/>
```

📖 [Full Static Maps Guide](./mapbox-static-maps.md)

---

### 🗺️ Interactive Maps (Full Features)

**When to use:**
- Search results
- Venue detail pages
- User needs to pan/zoom
- Multiple clickable markers

**Bundle size:** ~310 KB gzipped

**Cost:** $5 per 1,000 loads

#### Basic Interactive Map

```tsx
import { MapboxInteractive } from "@/components/map";

<MapboxInteractive
  points={points}
  zoom={13}
  onMarkerClick={(point) => console.log(point)}
/>
```

#### Clustered Map (50+ markers)

```tsx
import { MapboxClustered } from "@/components/map";

<MapboxClustered
  points={points}
  zoom={11}
  minClusterPoints={10}
/>
```

📖 [Full Interactive Maps Guide](./mapbox-interactive-maps.md)

---

## File Structure

```
components/
├── map/
│   ├── index.tsx                    # Main exports
│   ├── MapboxInteractive.tsx        # Basic interactive map
│   └── MapboxClustered.tsx          # Map with clustering
└── search/
    └── MapboxStaticPreview.tsx      # Static image map

lib/
├── mapbox-static.ts                 # Static map utilities
├── mapbox-static.example.ts         # Static examples
└── mapbox-interactive.example.tsx   # Interactive examples

docs/
├── MAPS_README.md                   # This file
├── mapbox-static-maps.md            # Static maps guide
└── mapbox-interactive-maps.md       # Interactive maps guide
```

## Common Patterns

### Pattern 1: Progressive Enhancement

Start with static, upgrade to interactive on demand:

```tsx
const [interactive, setInteractive] = useState(false);

{!interactive ? (
  <div onClick={() => setInteractive(true)}>
    <MapboxStaticPreview points={points} />
    <button>Open Interactive Map</button>
  </div>
) : (
  <MapboxClustered points={points} />
)}
```

### Pattern 2: Conditional Rendering

Use static for small screens, interactive for desktop:

```tsx
{isMobile ? (
  <MapboxStaticPreview points={points} />
) : (
  <MapboxInteractive points={points} />
)}
```

### Pattern 3: Auto-Choose Based on Count

```tsx
{points.length > 50 ? (
  <MapboxClustered points={points} />
) : (
  <MapboxInteractive points={points} />
)}
```

## Data Format

All map components use the same `MapPoint` type:

```typescript
type MapPoint = {
  id: string | number;      // Unique identifier
  lat: number;              // Latitude (-90 to 90)
  lng: number;              // Longitude (-180 to 180)
  name: string;             // Display name
  venue?: string;           // Optional venue name
  distance?: number | null; // Optional distance in km
};
```

## Performance Optimization

### 1. Lazy Load Interactive Maps

```tsx
import { lazy, Suspense } from "react";

const LazyMap = lazy(() => import("@/components/map/MapboxClustered"));

<Suspense fallback={<MapSkeleton />}>
  <LazyMap points={points} />
</Suspense>
```

### 2. Filter Data Before Rendering

```tsx
const nearbyPoints = useMemo(() => {
  return allPoints
    .filter(p => p.distance < 10) // Within 10km
    .slice(0, 100); // Max 100 markers
}, [allPoints]);
```

### 3. Use Static for Initial Render

```tsx
// SSR-friendly
{typeof window === 'undefined' ? (
  <MapboxStaticPreview points={points} />
) : (
  <MapboxInteractive points={points} />
)}
```

## Cost Optimization

### Strategy

1. **Static maps** for listings, emails, social shares
2. **Interactive maps** only on detail pages and search results
3. **Lazy load** interactive maps to reduce unnecessary loads
4. **Cache** static map URLs (they're stable)

### Example Cost Calculation

**Scenario:** 10,000 monthly visitors

- 5,000 view search results (interactive map)
- 3,000 view individual classes (static map)
- 2,000 receive emails (static map)

**Cost:**
- Interactive: 5,000 loads = **$25/month** (free tier covers 50k)
- Static: 5,000 requests = **$0.50/month**

**Total: $0** (within free tier!)

## Styling

All maps use Parent Helper brand colors:

- **Sage Green**: `#9BAE82` (primary markers)
- **Terracotta**: `#C97C5C` (accents)
- **Cream**: `#F5F3F0` (backgrounds)
- **Charcoal**: `#3D3D3D` (text)

### Customizing Colors

Edit the marker styles in component files:

```tsx
backgroundColor: "#9BAE82", // Your brand color
```

## Browser Support

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari 14+, Android Chrome)
- ❌ IE 11 (not supported)

## Troubleshooting

### Maps not showing?

1. Check token in `.env.local`
2. Restart dev server
3. Check browser console for errors
4. Verify coordinates are valid (-90 to 90 lat, -180 to 180 lng)

### Performance issues?

1. Use `MapboxClustered` for 50+ markers
2. Filter points before passing to map
3. Lazy load the map component
4. Use static maps where possible

### TypeScript errors?

```bash
npm install --save-dev @types/mapbox-gl
```

## Migration from React-Leaflet

We removed React-Leaflet due to React 19 incompatibility. The new Mapbox implementation is cleaner and more performant.

**Old (broken):**
```tsx
import { MapContainer, TileLayer, Marker } from "react-leaflet";

<MapContainer center={[lat, lng]} zoom={13}>
  <TileLayer url="..." />
  <Marker position={[lat, lng]} />
</MapContainer>
```

**New (works!):**
```tsx
import { MapboxInteractive } from "@/components/map";

<MapboxInteractive
  points={[{ id: 1, lat, lng, name: "Location" }]}
  zoom={13}
/>
```

## Resources

- [Mapbox Static Images API](https://docs.mapbox.com/api/maps/static-images/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl](https://visgl.github.io/react-map-gl/)
- [Mapbox Pricing](https://www.mapbox.com/pricing)

## Examples

See comprehensive examples in:
- `lib/mapbox-static.example.ts` - 8 static map examples
- `lib/mapbox-interactive.example.tsx` - 10 interactive map examples

## Questions?

Check the detailed guides:
- 📖 [Static Maps Guide](./mapbox-static-maps.md)
- 📖 [Interactive Maps Guide](./mapbox-interactive-maps.md)

---

**Ready to use!** 🗺️✨

All components are React 19 compatible and production-ready.



