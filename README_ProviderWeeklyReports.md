# Provider Weekly Reports - Complete Documentation

## Overview

The Provider Weekly Reports system automatically generates and emails weekly summaries to all active providers every Monday morning at 7:00 AM. The system aggregates booking data, revenue, reviews, referrals, and class attendance metrics.

## Architecture

### Components

1. **Database Table**: `provider_reports` - Stores weekly summary statistics
2. **API Route**: `/api/providers/[id]/weekly-summary` - Generates summary for a provider
3. **Cron Job**: `/api/cron/provider-weekly-reports` - Runs Monday 7am, processes all providers
4. **Email Template**: `providerWeeklySnapshot.ts` - SendGrid email template
5. **Admin View**: `/admin/reports/providers` - View and sort all provider reports

## Database Schema

### `provider_reports` Table

```sql
CREATE TABLE provider_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id integer NOT NULL REFERENCES providers(id),
  week_start date NOT NULL,
  stats_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, week_start)
);
```

**stats_json** contains:
- `total_bookings` - Number of bookings in the week
- `confirmed_bookings` - Number of confirmed bookings
- `total_revenue` - Total revenue in GBP (from amount_cents)
- `avg_rating` - Average rating (all time, rounded to 1 decimal)
- `wallet_topups_from_referrals` - Referral-based wallet credits in GBP
- `class_attendance_rate` - Percentage (bookings with occurrence / total occurrences)
- `upcoming_classes_count` - Number of classes scheduled next week
- `week_start` - ISO date string
- `week_end` - ISO date string

## API Endpoints

### POST `/api/providers/[id]/weekly-summary`

Generates weekly summary for a specific provider.

**Response:**
```json
{
  "ok": true,
  "report": {
    "id": "uuid",
    "provider_id": 1,
    "week_start": "2024-01-15",
    "stats_json": { ... }
  },
  "stats": {
    "total_bookings": 10,
    "total_revenue": 250.50,
    "avg_rating": 4.5,
    ...
  }
}
```

### GET `/api/cron/provider-weekly-reports`

Cron endpoint that processes all providers. Secured with `CRON_SECRET` header.

**Headers:**
- `x-cron-secret` - Must match `CRON_SECRET` env variable

**Response:**
```json
{
  "ok": true,
  "sent": 45,
  "failed": 2,
  "total": 47
}
```

## Cron Scheduling

### Setup Instructions

**Vercel Cron Jobs:**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/provider-weekly-reports",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

**External Cron Service (e.g., cron-job.org):**
- URL: `https://your-domain.com/api/cron/provider-weekly-reports`
- Schedule: Every Monday at 7:00 AM
- Headers: `x-cron-secret: YOUR_CRON_SECRET`

**Manual Testing:**
```bash
curl -X GET "http://localhost:3000/api/cron/provider-weekly-reports" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

## Email Template

### Subject
"Your Parent Helper Week at a Glance"

### Content
- Revenue (formatted as GBP)
- New Bookings count
- Average Rating (with star emoji)
- Referrals (wallet topups from referrals)
- Next Classes count
- CTA button linking to provider dashboard

### Template Function
```typescript
getProviderWeeklySnapshotTemplate({
  providerName: string,
  totalRevenue: number,
  totalBookings: number,
  avgRating: number,
  walletTopupsFromReferrals: number,
  upcomingClassesCount: number,
  dashboardUrl: string,
})
```

## Admin View

### Route
`/admin/reports/providers`

### Features
- Table view of latest reports for all providers
- Sortable columns:
  - Revenue (desc/asc)
  - Bookings (desc/asc)
  - Rating (desc/asc)
  - Upcoming Classes (desc/asc)
- Shows provider name, week start date, and all metrics
- Admin authentication required (via `ph_admin` cookie)

## Data Aggregation Logic

### Week Calculation
- Week starts on Monday (00:00:00)
- Week ends on Sunday (23:59:59)
- Calculated dynamically based on current date

### Bookings
- Queries `bookings` table filtered by:
  - `provider_id`
  - `created_at` between week_start and week_end
- Counts total bookings and confirmed bookings separately
- Sums `amount_cents` and converts to GBP (divide by 100)

### Ratings
- Queries `provider_reviews` table filtered by:
  - `provider_id`
  - `status = 'approved'`
- Calculates average of all approved reviews
- Rounds to 1 decimal place

### Wallet Topups from Referrals
- Queries `wallet_transactions` table filtered by:
  - `type = 'credit'`
  - `created_at` between week_start and week_end
  - `source = 'referral'` OR `metadata.referral_id` exists
- Sums `amount_cents` and converts to GBP

### Class Attendance Rate
- Queries `class_occurrences` for provider's classes in the week
- Counts bookings with `occurrence_id` matching occurrences
- Calculates: `(bookings_with_occurrence / total_occurrences) * 100`
- Rounds to 1 decimal place

### Upcoming Classes
- Queries `class_occurrences` for next 7 days
- Filters by provider's class IDs
- Counts unique occurrences

## Testing

### Unit Tests
Located in `tests/unit/provider-weekly-summary.test.ts`

Tests cover:
- Booking count calculations
- Revenue calculations
- Rating averages
- Attendance rate calculations
- Edge cases (empty data, rounding)

### E2E Tests
Located in `tests/e2e/provider-weekly-report-flow.test.ts`

Tests cover:
- Full flow: generate summary → send email
- Providers with no bookings
- Providers without email addresses
- Week start calculation (Monday)

### Running Tests
```bash
npm run test:unit
npm run test:e2e
```

## Environment Variables

Required:
- `CRON_SECRET` - Secret token for securing cron endpoints
- `SENDGRID_API_KEY` - For sending emails
- `NEXT_PUBLIC_SITE_URL` or `APP_URL` - Base URL for dashboard links

## Deployment Checklist

1. ✅ Run migration: `supabase/migrations/20250120_provider_weekly_reports.sql`
2. ✅ Set `CRON_SECRET` environment variable
3. ✅ Configure cron job (Vercel or external service)
4. ✅ Test cron endpoint manually
5. ✅ Verify email delivery
6. ✅ Check admin view access

## Troubleshooting

### Reports not generating
- Check cron job is configured correctly
- Verify `CRON_SECRET` matches in cron service and env
- Check server logs for errors

### Emails not sending
- Verify `SENDGRID_API_KEY` is set
- Check provider has `billing_email` or `contact_email`
- Review SendGrid logs for delivery issues

### Incorrect data
- Verify bookings have correct `provider_id`
- Check `class_occurrences` are linked correctly
- Ensure `wallet_transactions` schema matches query assumptions

## Future Enhancements

- [ ] Historical comparison (week-over-week growth)
- [ ] Export reports to CSV/PDF
- [ ] Customizable email frequency (weekly/bi-weekly/monthly)
- [ ] Provider-specific email preferences
- [ ] Include charts/graphs in email
- [ ] Mobile-optimized email template
- [ ] A/B testing for email content

