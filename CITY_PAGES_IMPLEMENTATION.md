# Pre-rendered City Pages with SSR SEO - Implementation

This document outlines the complete implementation of pre-rendered local city pages with SSR SEO optimization.

## Overview

City pages are now available at `/{city}` (e.g., `/london`) with full SSR, SEO metadata, and edge caching. Each page displays featured and popular classes for the city, along with weather information and local photos.

## Database Structure

### Migration: `supabase/migrations/20250123_cities_table.sql`

**Table Created:**

**cities**
- `id` (uuid, primary key)
- `name` (text) - Display name (e.g., "London")
- `slug` (text, unique) - URL slug (e.g., "london")
- `lat` (decimal) - Latitude for geolocation
- `lon` (decimal) - Longitude for geolocation
- `hero_image_url` (text, nullable) - Hero image URL
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS Policies:**
- Public read access for city pages
- Service role can manage cities

## Route Structure

### `app/[city]/page.tsx`

**Features:**
- SSR with `generateMetadata()` for SEO
- Edge caching: 1 hour revalidation (`revalidate = 3600`)
- Route exclusion list to prevent conflicts with other routes
- `generateStaticParams()` for static generation of top 100 cities

**Route Matching:**
- Matches `/{city}` pattern
- Excludes known routes: search, blog, account, admin, etc.
- Returns 404 if city not found in database

## Components

### 1. `CityPageClient.tsx`
- Main client component
- Hero section with background image
- Featured classes section
- Popular classes section
- Weather widget integration
- Local photo chip

### 2. `CityHero.tsx`
- Above-the-fold hero section
- H1: "Best Family Classes in {city}"
- CTA buttons: "Search Classes" and "List Your Class"
- Responsive design

### 3. `ClassesGrid.tsx`
- Grid layout (2 columns on tablet, 3 on desktop)
- Class cards with:
  - Title
  - Description (truncated)
  - Category badge
  - Age range badge
  - Town badge
  - Link to class detail page

### 4. `LocalPhotoChip.tsx`
- Displays local photo indicator
- Uses Unsplash API (optional, requires `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`)
- Lazy loads after LCP
- Falls back to text-only if API unavailable

### 5. `CityPageSchema.tsx`
- JSON-LD structured data
- Schema.org City type
- Includes geo coordinates
- Lists classes as OfferCatalog

## SEO Features

### Metadata
- **Title**: "Best Family Classes in {city} | Parent Helper"
- **Description**: Dynamic description with city name
- **Canonical URL**: `/{city}`
- **Open Graph**: Full OG tags with hero image
- **Twitter Card**: Summary large image

### Structured Data
- Schema.org City markup
- GeoCoordinates for location
- OfferCatalog for classes
- Service schema for each class

### Edge Caching
- **Cache-Control**: `public, s-maxage=3600, stale-while-revalidate=86400`
- Configured in `next.config.mjs`
- 1 hour cache with 24-hour stale-while-revalidate

## Data Fetching

### Classes Query
1. **Popular Classes**:
   - Filtered by town (case-insensitive)
   - Ordered by popularity, then review_count
   - Limited to 12 results

2. **Featured Classes**:
   - Fetches active featured_listings
   - Filters by town
   - Ordered by featured_priority, then popularity
   - Limited to 12 results

### City Lookup
- Queries `cities` table by slug
- Case-insensitive matching
- Returns 404 if not found

## Weather Integration

Uses existing `WeatherCard` component:
- Fetches from Open-Meteo API (no API key needed)
- Displays condition and temperature
- Lazy loads after LCP
- Respects `WEATHER_WIDGET_ENABLED` feature flag

## Sitemap Integration

Updated `lib/sitemap.ts`:
- Fetches all cities from database
- Adds city URLs with priority 0.8
- Includes `lastmod` from `updated_at`
- Change frequency: weekly

## Edge Caching Configuration

**File**: `next.config.mjs`

```javascript
{
  source: "/:city",
  headers: [
    { 
      key: "Cache-Control", 
      value: "public, s-maxage=3600, stale-while-revalidate=86400" 
    },
  ],
}
```

**Behavior:**
- Edge cache: 1 hour (3600 seconds)
- Stale-while-revalidate: 24 hours
- Browser cache: Respects Next.js defaults

## Route Exclusions

The following routes are excluded from city matching:
- search, blog, account, admin, provider, providers
- api, auth, booking, class, classes, city
- onboarding, partners, privacy, resources, review
- r, studio, tools, topics, wellness
- sitemap.xml, robots.txt, _next, favicon.ico

## Testing

### Playwright Test: `tests/e2e/city-pages.spec.ts`

**Test Cases:**
1. **London page rendering**:
   - Verifies meta title contains "Best Family Classes in London"
   - Verifies H1 is present and visible
   - Verifies class cards are present (or empty state)
   - Verifies search link is present

2. **Open Graph metadata**:
   - Verifies OG title and description
   - Verifies canonical URL

3. **Weather widget**:
   - Checks if weather widget appears (optional, doesn't fail if disabled)

4. **404 handling**:
   - Verifies non-existent city shows 404

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   # Apply migration to Supabase
   # File: supabase/migrations/20250123_cities_table.sql
   ```

2. **Populate Cities Table**:
   ```sql
   INSERT INTO cities (name, slug, lat, lon, hero_image_url) VALUES
   ('London', 'london', 51.5074, -0.1278, 'https://example.com/london-hero.jpg'),
   ('Manchester', 'manchester', 53.4808, -2.2426, NULL),
   -- Add more cities as needed
   ```

3. **Optional: Unsplash API**:
   - Set `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` for local photos
   - Or leave unset for text-only photo chip

4. **Deploy**:
   - Push changes to repository
   - Edge caching will be automatically configured
   - Sitemap will include city pages

## Performance Optimizations

1. **SSR with Edge Caching**: Pages are server-rendered but cached at edge
2. **Lazy Loading**: Weather and photos load after LCP
3. **Image Optimization**: Next.js Image component with priority for hero
4. **Static Generation**: Top 100 cities pre-generated at build time
5. **Query Optimization**: Limited results (12 per section) for fast queries

## SEO Best Practices

- ✅ Unique title and description per city
- ✅ Canonical URLs
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured data (JSON-LD)
- ✅ Semantic HTML (H1, sections)
- ✅ Mobile-responsive design
- ✅ Fast page load (edge caching)
- ✅ Sitemap integration

## Notes

- The route `/{city}` coexists with `/city/[slug]` - both work
- Middleware currently redirects to `/city/...` - consider updating if you want to use `/{city}` exclusively
- Weather widget uses Open-Meteo (free, no API key)
- Local photos use Unsplash (optional, requires API key)
- Classes are filtered by town name (case-insensitive partial match)

## Future Enhancements

- Add city-specific blog posts
- Add local tips carousel
- Add local partners grid
- Add city-specific categories
- Add "Nearby Cities" suggestions
- Add city-specific FAQs
- Add user reviews for city

