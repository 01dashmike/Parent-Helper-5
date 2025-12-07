# Event Tracking System - Implementation Summary

## ✅ Complete Implementation

A complete, scalable event-tracking system for provider analytics has been implemented, similar to ClassPass, Treatwell, and Happity's analytics dashboards.

---

## 📁 Files Created

### Database Migration

1. **`supabase/migrations/20250222000100_analytics_event_tracking.sql`**
   - Creates `analytics_events` table (raw events)
   - Creates `provider_daily_metrics` table (aggregated)
   - Creates `class_daily_metrics` table (aggregated)
   - All necessary indexes for performance

### API Routes

1. **`app/api/events/track/route.ts`**
   - POST endpoint for tracking events
   - Validates events with Zod
   - Manages session IDs via cookies
   - Stores events in `analytics_events` table

2. **`app/api/cron/aggregate-events/route.ts`**
   - Daily aggregation cron job
   - Aggregates raw events into daily metrics
   - Deletes old events (>90 days)
   - Protected by CRON_SECRET

### Client Utilities

1. **`lib/tracking/events.ts`**
   - `trackEvent()` - Main tracking function
   - Helper functions for each event type
   - Type-safe event tracking

2. **`lib/tracking/usePageAnalytics.ts`**
   - React hook for automatic page tracking
   - Tracks: page views, time on page, scroll depth
   - Auto-tracks at intervals (5s, 15s, 30s, 60s, etc.)

### Schema (Drizzle)

1. **`shared/schema.ts`** (updated)
   - `analyticsEvents` table definition
   - `providerDailyMetrics` table definition
   - `classDailyMetrics` table definition

---

## 🎯 Event Types Supported

### Core Events
- `class_view` - When a class detail page is viewed
- `profile_view` - When a provider profile is viewed
- `search_impression` - When a class appears in search results
- `search_click` - When a user clicks a search result
- `website_click` - When user clicks website link
- `phone_click` - When user clicks phone number

### Advanced Events
- `time_on_page` - Time spent on page (seconds)
- `scroll_depth` - Scroll percentage (50%, 75%, 100%)
- `cta_click` - CTA button clicks (book now, get directions, etc.)
- `gallery_open` - When gallery is opened
- `video_play` - When video is played

---

## 📊 Database Schema

### analytics_events (Raw Events)
```sql
- id (bigserial)
- event_type (text)
- provider_id (bigint, nullable)
- class_id (bigint, nullable)
- user_id (uuid, nullable)
- session_id (text)
- metadata (jsonb)
- occurred_at (timestamptz)
```

**Indexes:**
- provider_id
- class_id
- event_type
- occurred_at
- session_id
- Composite: (provider_id, date(occurred_at))
- Composite: (class_id, date(occurred_at))

### provider_daily_metrics (Aggregated)
```sql
- id (bigserial)
- provider_id (bigint)
- date (date)
- views (int)
- bookings (int)
- revenue (numeric)
- search_impressions (int)
- search_clicks (int)
- website_clicks (int)
- phone_clicks (int)
- time_on_page_seconds (int)
- scroll_depth_50/75/100 (int)
- cta_clicks (int)
- gallery_opens (int)
- video_plays (int)
- created_at, updated_at
```

**Unique Constraint:** (provider_id, date)

### class_daily_metrics (Aggregated)
```sql
- id (bigserial)
- class_id (bigint)
- date (date)
- views (int)
- search_impressions (int)
- search_clicks (int)
- website_clicks (int)
- phone_clicks (int)
- time_on_page_seconds (int)
- scroll_depth_50/75/100 (int)
- cta_clicks (int)
- gallery_opens (int)
- video_plays (int)
- created_at, updated_at
```

**Unique Constraint:** (class_id, date)

---

## 🔧 API Endpoints

### POST /api/events/track

**Request:**
```json
{
  "eventType": "class_view",
  "providerId": 123,
  "classId": 456,
  "metadata": {
    "source": "search",
    "position": 3
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Features:**
- Validates event type with Zod
- Creates/retrieves session ID from cookie
- Captures user ID if authenticated
- Stores event in database
- Silent failure (doesn't break app)

### GET /api/cron/aggregate-events

**Query Params:**
- `?secret=...` (required, must match CRON_SECRET)
- `?date=YYYY-MM-DD` (optional, defaults to yesterday)

**Response:**
```json
{
  "success": true,
  "date": "2025-02-21",
  "providersAggregated": 15,
  "classesAggregated": 42
}
```

**Features:**
- Aggregates yesterday's events (or specified date)
- Groups by provider_id and class_id
- Upserts into daily metrics tables
- Deletes events older than 90 days
- Protected by secret

---

## 📱 Client-Side Usage

### Basic Tracking

```typescript
import { trackEvent } from "@/lib/tracking/events";

// Track a class view
await trackEvent("class_view", {
  classId: 123,
  providerId: 456,
});

// Track a CTA click
await trackEvent("cta_click", {
  providerId: 456,
  classId: 123,
  metadata: { ctaType: "book_now" },
});
```

### Helper Functions

```typescript
import {
  trackClassView,
  trackProfileView,
  trackWebsiteClick,
  trackPhoneClick,
  trackCtaClick,
  trackScrollDepth,
  trackTimeOnPage,
} from "@/lib/tracking/events";

// Simple helpers
trackClassView(classId, providerId);
trackProfileView(providerId);
trackWebsiteClick(providerId, classId);
trackPhoneClick(providerId, classId);
```

### React Hook

```typescript
import { usePageAnalytics } from "@/lib/tracking/usePageAnalytics";

function ClassDetailPage({ classId, providerId }) {
  usePageAnalytics({
    classId,
    providerId,
    pageType: "class",
  });

  return <div>...</div>;
}
```

**Auto-tracks:**
- Page view on mount
- Time on page: 5s, 15s, 30s, 60s, then every 60s
- Scroll depth: 50%, 75%, 100%

---

## 🔄 Aggregation Process

### Daily Cron Job

1. **Query Events:**
   - Get all events from yesterday (or specified date)
   - Filter by provider_id or class_id

2. **Group & Aggregate:**
   - Group by provider_id → aggregate metrics
   - Group by class_id → aggregate metrics
   - Count events by type
   - Sum time_on_page seconds
   - Count scroll depth milestones

3. **Upsert Metrics:**
   - Upsert into `provider_daily_metrics`
   - Upsert into `class_daily_metrics`
   - Use unique constraint (provider_id, date)

4. **Cleanup:**
   - Delete events older than 90 days
   - Keeps raw events for recent analysis

### Metrics Calculated

**Provider Metrics:**
- Views (class_view + profile_view)
- Search impressions
- Search clicks
- Website clicks
- Phone clicks
- Time on page (sum of seconds)
- Scroll depth counts (50%, 75%, 100%)
- CTA clicks
- Gallery opens
- Video plays

**Class Metrics:**
- Views (class_view only)
- Search impressions
- Search clicks
- Website clicks
- Phone clicks
- Time on page
- Scroll depth
- CTA clicks
- Gallery opens
- Video plays

---

## 🔌 Integration Points

### Pages to Integrate

1. **Class Detail Page** (`/class/[id]` or similar)
   ```typescript
   usePageAnalytics({
     classId: class.id,
     providerId: class.provider_id,
     pageType: "class",
   });
   ```

2. **Provider Profile Page** (`/provider/[slug]` or similar)
   ```typescript
   usePageAnalytics({
     providerId: provider.id,
     pageType: "profile",
   });
   ```

3. **Search Results**
   ```typescript
   // Track impressions when results render
   results.forEach((result, index) => {
     trackSearchImpression(result.classId, result.providerId, {
       position: index + 1,
       query: searchQuery,
     });
   });
   ```

4. **CTA Buttons**
   ```typescript
   <button
     onClick={() => {
       trackCtaClick("book_now", providerId, classId);
       // ... handle click
     }}
   >
     Book Now
   </button>
   ```

---

## 🚀 Setup & Configuration

### Environment Variables

Add to `.env.local`:
```bash
CRON_SECRET=your-secret-key-here
```

### Database Migration

Run the migration:
```bash
# Via Supabase CLI
supabase migration up

# Or manually in Supabase Dashboard SQL Editor
# Run: supabase/migrations/20250222000100_analytics_event_tracking.sql
```

### Cron Job Setup

**Vercel Cron:**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/aggregate-events?secret=YOUR_SECRET",
    "schedule": "0 2 * * *"
  }]
}
```

**Or use external cron service:**
- Call `GET /api/cron/aggregate-events?secret=YOUR_SECRET` daily at 2 AM

---

## 📈 Dashboard Integration (Future)

Once aggregation is running, update `/api/provider/dashboard/hero` to use:

```typescript
// Instead of provider_metrics table
const { data: metrics } = await supabase
  .from("provider_daily_metrics")
  .select("*")
  .eq("provider_id", providerId)
  .eq("date", dateStr)
  .single();
```

This will provide real-time metrics from actual tracking data.

---

## 🧪 Testing

### Manual Testing

1. **Track Event:**
   ```bash
   curl -X POST http://localhost:3000/api/events/track \
     -H "Content-Type: application/json" \
     -d '{
       "eventType": "class_view",
       "classId": 1,
       "providerId": 1
     }'
   ```

2. **Verify Event Stored:**
   ```sql
   SELECT * FROM analytics_events 
   ORDER BY occurred_at DESC 
   LIMIT 10;
   ```

3. **Run Aggregation:**
   ```bash
   curl "http://localhost:3000/api/cron/aggregate-events?secret=YOUR_SECRET"
   ```

4. **Verify Metrics:**
   ```sql
   SELECT * FROM provider_daily_metrics 
   WHERE provider_id = 1 
   ORDER BY date DESC;
   ```

---

## ✅ Status

**Implementation:** ✅ Complete
**Database:** ✅ Migration ready
**API:** ✅ Endpoints created
**Client:** ✅ Utilities ready
**Integration:** ⚠️ Needs page integration
**Cron Job:** ⚠️ Needs setup

---

## 📝 Next Steps

1. **Integrate into pages:**
   - Add `usePageAnalytics` to class detail pages
   - Add `usePageAnalytics` to provider profile pages
   - Add click tracking to CTAs

2. **Set up cron job:**
   - Configure Vercel Cron or external service
   - Test aggregation manually first

3. **Update dashboard:**
   - Modify `/api/provider/dashboard/hero` to use `provider_daily_metrics`
   - Replace stubbed values with real data

4. **Add search tracking:**
   - Track impressions when search results render
   - Track clicks when results are clicked

---

**Status:** ✅ Core system complete, ready for page integration





