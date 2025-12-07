# Event Tracking System - Setup Guide

## ✅ Implementation Complete

A complete, scalable event-tracking system has been implemented for provider analytics.

---

## 🚀 Quick Start

### 1. Run Database Migration

```bash
# Via Supabase CLI
supabase migration up

# Or manually in Supabase Dashboard SQL Editor
# Run: supabase/migrations/20250222000100_analytics_event_tracking.sql
```

### 2. Set Environment Variable

Add to `.env.local`:
```bash
CRON_SECRET=your-secret-key-here
```

### 3. Set Up Cron Job

**Option A: Vercel Cron**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/aggregate-events?secret=YOUR_SECRET",
    "schedule": "0 2 * * *"
  }]
}
```

**Option B: External Cron Service**

Call daily at 2 AM:
```
GET https://your-domain.com/api/cron/aggregate-events?secret=YOUR_SECRET
```

### 4. Integrate Tracking

**Class Pages:**
```typescript
// Already integrated in app/class/[id]/ClassPageClient.tsx
usePageAnalytics({
  classId: classId,
  providerId: providerId,
  pageType: "class",
});
```

**Provider Profile Pages:**
```typescript
// Add to provider profile page client component
usePageAnalytics({
  providerId: providerId,
  pageType: "profile",
});
```

---

## 📊 Event Types

### Core Events
- `class_view` - Class detail page viewed
- `profile_view` - Provider profile viewed
- `search_impression` - Class appears in search
- `search_click` - User clicks search result
- `website_click` - User clicks website link
- `phone_click` - User clicks phone number

### Advanced Events
- `time_on_page` - Time spent (seconds)
- `scroll_depth` - Scroll percentage (50%, 75%, 100%)
- `cta_click` - CTA button clicked
- `gallery_open` - Gallery opened
- `video_play` - Video played

---

## 🔧 API Usage

### Track Event

```typescript
import { trackEvent } from "@/lib/tracking/events";

await trackEvent("class_view", {
  classId: 123,
  providerId: 456,
  metadata: { source: "search" },
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
trackCtaClick("book_now", providerId, classId);
```

---

## 📈 Dashboard Integration

Once aggregation is running, update `/api/provider/dashboard/hero`:

```typescript
// Replace stubbed metrics with real data
const { data: metrics } = await supabase
  .from("provider_daily_metrics")
  .select("*")
  .eq("provider_id", providerId)
  .eq("date", dateStr)
  .single();
```

---

## 🧪 Testing

### Manual Test

```bash
# Track an event
curl -X POST http://localhost:3000/api/events/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "class_view",
    "classId": 1,
    "providerId": 1
  }'

# Verify event stored
# Check Supabase: SELECT * FROM analytics_events ORDER BY occurred_at DESC LIMIT 10;

# Run aggregation
curl "http://localhost:3000/api/cron/aggregate-events?secret=YOUR_SECRET"

# Verify metrics
# Check Supabase: SELECT * FROM provider_daily_metrics WHERE provider_id = 1;
```

---

## ✅ Status

**Implementation:** ✅ Complete
**Database:** ✅ Migration ready
**API:** ✅ Endpoints created
**Client:** ✅ Utilities ready
**Integration:** ✅ Class page integrated
**Cron Job:** ⚠️ Needs setup

---

**Next:** Set up cron job and integrate into provider profile pages.





