# Admin Activity Feed - Setup & Usage Guide

## Overview

The Admin Activity Feed provides a real-time view of all important events happening across the Parent Helper platform, including provider signups, class changes, bookings, emails, cron jobs, and Stripe events.

## Files Created/Modified

### Database
- `supabase/migrations/20250126_activity_log.sql` - Creates `activity_log` table with indexes and RLS

### Core Library
- `lib/activityLog.ts` - Main logging utility with `logActivity()` and `getRecentActivity()`
- `lib/activityLog/examples.ts` - Example integration patterns

### Routes
- `app/admin/docs/activity/page.tsx` - Activity feed page with admin auth
- `app/api/admin/activity/route.ts` - API endpoint for fetching activity

### Components
- `components/admin/activity/ActivityFeedClient.tsx` - Main client component
- `components/admin/activity/ActivityFilterBar.tsx` - Filter controls
- `components/admin/activity/ActivityList.tsx` - Activity list container
- `components/admin/activity/ActivityItem.tsx` - Individual activity item
- `components/admin/activity/ActivityLevelBadge.tsx` - Level badge component
- `components/admin/activity/ActivityScopeTag.tsx` - Scope tag component
- `components/admin/activity/ActivityMetadataDrawer.tsx` - Metadata viewer dialog

### UI Components
- `components/ui/dialog.tsx` - Dialog component (created)

### Tests
- `tests/unit/activity/logActivity.test.ts` - Unit tests
- `tests/e2e/admin-activity-feed.spec.ts` - E2E tests

### Integration Points (Modified)
- `lib/emails/sendTransactional.ts` - Added email activity logging
- `app/api/stripe/webhook/route.ts` - Added Stripe payment logging
- `app/api/billing/webhook/route.ts` - Added billing event logging

## SQL Migration Content

```sql
-- See: supabase/migrations/20250126_activity_log.sql

create table if not exists public.activity_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  event_type text not null,
  scope text not null,
  actor_id uuid null,
  provider_id integer null,
  class_id integer null,
  booking_id uuid null,
  title text not null,
  description text null,
  metadata jsonb null,
  level text not null default 'info'
);

-- Indexes for performance
create index activity_log_created_at_idx on public.activity_log(created_at desc);
create index activity_log_scope_idx on public.activity_log(scope);
create index activity_log_level_idx on public.activity_log(level);
create index activity_log_event_type_idx on public.activity_log(event_type);
create index activity_log_scope_created_idx on public.activity_log(scope, created_at desc);
```

## How to Trigger Sample Events Locally

### 1. Provider Signup Event

**Option A: Via API (if you have a provider registration endpoint)**
```bash
curl -X POST http://localhost:3000/api/providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "contactName": "John Doe",
    "email": "john@example.com",
    "town": "Manchester"
  }'
```

**Option B: Direct database insert (for testing)**
```sql
INSERT INTO activity_log (event_type, scope, title, description, level)
VALUES (
  'provider.signup',
  'provider',
  'New provider lead: Test Business',
  'Contact: John Doe, john@example.com, Manchester',
  'info'
);
```

### 2. Email Event

**Set environment variable:**
```bash
LOG_EMAIL_ACTIVITY=true
```

**Send a test email:**
```typescript
import { sendTransactional } from "@/lib/emails/sendTransactional";

await sendTransactional({
  to: "test@example.com",
  subject: "Test Email",
  html: "<p>Test</p>",
  text: "Test",
  type: "test",
});
```

### 3. Stripe Payment Event

**Trigger via Stripe CLI (if configured):**
```bash
stripe trigger checkout.session.completed
```

**Or manually insert:**
```sql
INSERT INTO activity_log (event_type, scope, title, description, metadata, level)
VALUES (
  'stripe.payment.succeeded',
  'billing',
  'Payment completed',
  'Checkout session: cs_test_123',
  '{"sessionId": "cs_test_123", "amount": 5000, "currency": "gbp"}'::jsonb,
  'info'
);
```

### 4. Cron Job Event

**Add to your cron route (e.g., `/api/cron/weekly`):**
```typescript
import { logActivity } from "@/lib/activityLog";

// At start
await logActivity({
  eventType: "cron.weekly",
  scope: "system",
  title: "Weekly metrics job started",
  description: "Processing provider metrics",
});

// At completion
await logActivity({
  eventType: "cron.weekly",
  scope: "system",
  title: "Weekly metrics job completed",
  description: "Processed 50 providers, sent 30 emails",
  metadata: {
    providersProcessed: 50,
    emailsSent: 30,
  },
});
```

### 5. Class Created Event

**Add to your class creation API:**
```typescript
import { logActivity } from "@/lib/activityLog";

// After creating class
await logActivity({
  eventType: "class.created",
  scope: "class",
  title: `New class created: ${className}`,
  description: `${weekday} at ${time} in ${town}`,
  classId: newClassId,
  providerId: providerId,
  metadata: {
    className,
    weekday,
    time,
    town,
  },
});
```

## Environment Variables

Add to `.env.local`:
```bash
# Enable email activity logging
LOG_EMAIL_ACTIVITY=true

# Admin secret (already required for admin pages)
ADMIN_SECRET=your-secret-here
```

## Accessing the Activity Feed

1. **Navigate to:** `/admin/docs/activity`
2. **Authenticate:** Enter admin secret if prompted
3. **View activities:** See timeline of all events
4. **Filter:** Use date range, scope, and level filters
5. **View details:** Click "Details" button to see full metadata

## Integration Checklist

To fully integrate activity logging, add `logActivity()` calls to:

- [x] Email sending (`lib/emails/sendTransactional.ts`)
- [x] Stripe webhooks (`app/api/stripe/webhook/route.ts`, `app/api/billing/webhook/route.ts`)
- [ ] Provider registration API (when provider submits form)
- [ ] Provider approval process (when admin approves provider)
- [ ] Class creation API (when provider creates class)
- [ ] Class update API (when class details change)
- [ ] Booking completion (when booking is confirmed)
- [ ] Booking cancellation (when booking is cancelled)
- [ ] Weekly cron jobs (`/api/cron/weekly`, `/api/cron/provider-weekly-reports`, etc.)
- [ ] Error handlers in critical paths

## Example Integration

See `lib/activityLog/examples.ts` for copy-paste examples of how to integrate logging into each flow.

## Testing

### Unit Tests
```bash
npm test tests/unit/activity/logActivity.test.ts
```

### E2E Tests
```bash
npx playwright test tests/e2e/admin-activity-feed.spec.ts
```

## Build Verification

```bash
npm run build
```

All routes should compile without errors. The activity feed is server-side rendered with client-side interactivity.

## Performance Notes

- All activity writes happen asynchronously (non-blocking)
- Indexes on `created_at`, `scope`, and `level` ensure fast queries
- Pagination limits to 50 items per page
- Metadata is stored as JSONB for flexible querying

## Security

- Activity feed is admin-only (requires `ADMIN_SECRET` cookie)
- Sensitive data (emails, tokens) is redacted in UI
- RLS policies prevent unauthorized access
- Service role used for writes (server-side only)

