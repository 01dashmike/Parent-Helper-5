# Structured Data (JSON-LD) Implementation

## Overview

Advanced structured data (JSON-LD) has been added to key pages to improve SEO and enable rich results in search engines.

## Implementation Summary

### 1. Class Page (`app/class/[id]/page.tsx`)

**Schemas Added:**
- ✅ **Event Schema** (enhanced)
  - Added: `image`, `aggregateRating`, `url`
  - Includes: name, description, dates, location, organizer, offers (price), ratings
  - Status: eventStatus based on occurrence status

- ✅ **Course Schema** (new)
  - Added for educational classes
  - Includes: name, description, image, provider, aggregateRating, offers, courseCode, audience

- ✅ **LocalBusiness Schema** (conditional - when provider + venue available)
  - Represents the provider as a local business
  - Includes: name, description, image, address, aggregateRating, priceRange

**Fields Included:**
- ✅ Name: `title` or `name`
- ✅ Description: `summary` or `description`
- ✅ Image: All class images (Supabase URLs)
- ✅ Rating: Provider's `avg_rating` and `review_count` (if available)
- ✅ Price: Parsed from price string, includes currency (GBP)
- ✅ Location: Full venue address (street, city, county, postcode, country)

### 2. Search Results Page (`components/search/SearchPageClient.tsx`)

**Schema Added:**
- ✅ **ItemList Schema** (new)
  - Dynamically injected via `useEffect` when results load
  - Includes up to 20 search results as list items
  - Each item is a Course with name, description, image, provider, offers, audience

**Fields Included:**
- ✅ List name: Based on query and town parameters
- ✅ Number of items: Total result count
- ✅ Item elements: Course schema for each result with position, name, description, image, provider, price

### 3. Blog Article Page (`app/blog/[slug]/page.tsx`)

**Schema Added:**
- ✅ **Article Schema** (enhanced)
  - Uses existing `schema_json` from database if available
  - Otherwise builds comprehensive Article schema
  - Includes: headline, description, image, dates, author, publisher, url, articleSection, wordCount, timeRequired, mentions (sources)

**Fields Included:**
- ✅ Name: `seo_title` or `title`
- ✅ Description: `seo_description` or `excerpt`
- ✅ Image: Hero image URL
- ✅ Author: Parent Helper (Person)
- ✅ Publisher: Parent Helper (Organization)
- ✅ Dates: `created_at` and `updated_at`
- ✅ Reading time: `timeRequired` from `reading_time_minutes`
- ✅ Sources: Mentioned as `Thing` objects with `sameAs` URLs

### 4. Provider Page (`app/provider/[slug]/page.tsx`)

**Status:** ⚠️ **Not Found**
- No public provider profile page exists
- Provider information is shown on class pages via LocalBusiness schema
- If provider public pages are added in the future, add LocalBusiness schema there

## Technical Implementation

### Hydration Safety
All structured data scripts use `suppressHydrationWarning` to prevent React hydration errors:
```tsx
<script
  type="application/ld+json"
  suppressHydrationWarning
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

### Client-Side Injection (Search Page)
For the search page (client component), structured data is injected via `useEffect`:
- Script element is created and appended to `<head>`
- Cleaned up on unmount or when results change
- Prevents hydration issues by not being in initial render

### Multi-Schema Approach
Class pages include multiple schemas:
- Event (for scheduling)
- Course (for educational content)
- LocalBusiness (for provider/venue)

This provides maximum SEO coverage for different search intents.

## SEO Impact

### Expected Improvements

1. **Rich Results**
   - Event listings with dates, prices, ratings
   - Course listings with provider info
   - Article snippets with author and publish date
   - Search result lists with structured data

2. **Knowledge Graph**
   - LocalBusiness entries help Google understand provider locations
   - Course schema helps with educational search results
   - Author/Publisher info helps establish brand authority

3. **Search Features**
   - Star ratings in search results (when ratings available)
   - Price information in listings
   - Event dates and times
   - Article metadata (reading time, publish date)

### Testing

To verify structured data:
1. Use [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Use [Schema.org Validator](https://validator.schema.org/)
3. Check Google Search Console for structured data reports

### Lighthouse SEO Impact

**Before:**
- Basic metadata only
- No structured data
- Limited rich result eligibility

**After:**
- ✅ Multiple schema types per page
- ✅ Rich result eligibility (events, courses, articles)
- ✅ Enhanced local business discovery
- ✅ Better search result appearance

## Files Modified

1. `app/class/[id]/page.tsx`
   - Enhanced `buildJsonLd()` function
   - Added Course and LocalBusiness schemas
   - Added ratings, images, and improved price formatting

2. `components/search/SearchPageClient.tsx`
   - Added `buildItemListSchema()` function
   - Added `useEffect` to inject ItemList schema
   - Client-side structured data injection

3. `app/blog/[slug]/page.tsx`
   - Added `buildArticleSchema()` function
   - Enhanced Article schema with author, publisher, mentions
   - Falls back to database `schema_json` if available

## Notes

- All structured data follows Schema.org specifications
- URLs use `NEXT_PUBLIC_APP_URL` environment variable
- Image URLs are properly formatted (handles both HTTP and Supabase paths)
- Ratings only included when review data is available
- Prices are parsed and formatted consistently (GBP currency)

## Future Enhancements

1. **Provider Public Pages**: Add `app/provider/[slug]/page.tsx` with LocalBusiness schema
2. **BreadcrumbList**: Add breadcrumb navigation schema
3. **Organization**: Add site-wide Organization schema in root layout
4. **FAQPage**: Add FAQ schema for FAQ pages
5. **Review Schema**: Add individual Review schemas for user reviews

