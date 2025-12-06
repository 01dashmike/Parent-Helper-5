# Parent Helper App (Next.js App Router)

[![CI](https://github.com/01dashmike/parent-helper-app/actions/workflows/ci.yml/badge.svg)](https://github.com/01dashmike/parent-helper-app/actions/workflows/ci.yml)

Parent Helper connects UK families with thousands of verified baby and toddler activities. The project now runs entirely on the Next.js App Router, pairing server-rendered React components with modern data fetching, while retaining the rich dataset, Supabase integrations, and automation tooling that power the platform.

## Features

- Location-aware search with category, age range, and price filters
- Structured data for >5,000 classes sourced from Supabase/Postgres and enrichment scripts
- Rich editorial content (blog, guides) served through the Next.js App Router
- Franchise and provider tooling, including Stripe checkout hooks and CRM exports
- Automation scripts (in `/server` and `/scripts`) for syncing data, newsletters, and analytics
- **Privacy-first analytics** - GDPR-compliant, cookie-free usage tracking

## Technology Stack

- **Framework**: Next.js 15 App Router (React 19 + TypeScript)
- **Styling**: Tailwind CSS, Radix UI primitives, shadcn/ui design system
- **Data**: Supabase/Postgres + Drizzle ORM schema shared via `/shared`
- **Payments & Email**: Stripe billing flows, SendGrid transactional emails
- **Tooling**: ESLint flat config, Prettier, Turbo/automation scripts for data ingestion

## React & Mapping Notes

- Next 15.5.6 requires React 19. We pin a single copy of `react`/`react-dom` at 19.0.0 via npm overrides to avoid duplicate React installs.
- `react-leaflet-markercluster` (React 17 only) has been removed. The map currently renders simple markers and we will reintroduce clustering once a React 19-compatible option is available.

## Quick Start

```bash
pnpm install
pnpm dev
```

- The app boots at http://localhost:3000 with hot reloading.
- API routes live under `app/api/*` and share types with `/shared/schema.ts`.

## Development Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Serve production build
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
pnpm check        # Run lint + typecheck
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run end-to-end tests
pnpm test:full    # Run all tests (unit + e2e)
```

## Build & Deploy

```bash
pnpm build
pnpm start            # serves the production build with next start
```

For Railway or other container hosts you can use the bundled helper script:

```bash
pnpm run railway-build  # installs dependencies and runs next build
```

## Environment Setup

Create a `.env.local` (or project-level secrets in your hosting platform) with the required credentials. For Railway deployments, set the following at **both the Project scope and the Service scope** so builds and runtime containers can read them:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_SECRET`
- `DATABASE_URL` (optional, used for schema repair scripts and direct SQL access)

Stripe, SendGrid, and other integrations still require their respective keys (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`, etc.). Many automation scripts under `/server` and `/scripts` expect the same variables—review each script before running it against production data.

### Feature Flags

- `NEXT_PUBLIC_WELLNESS_ENABLED` (default: `true`) - Controls visibility of the "Health & Wellness" navigation menu and wellness hub pages. Set to `"false"` to hide the wellness section.
- `NEXT_PUBLIC_ACCOUNT_ENABLED` (default: `true`) - Controls visibility of the account area (`/account`). Set to `"false"` to disable the members area.
- `NEXT_PUBLIC_EXPERIMENTS_ENABLED` (default: `false`) - Enables A/B testing for hero copy and CTA placement. Set to `"true"` to enable experiments.
- `NEXT_PUBLIC_MEMBERS_ENABLED` (default: `true`) - Enables the expanded Members Area with saved searches, alerts, and enhanced dashboard. Set to `"false"` to disable members features.
- `PROVIDER_ANALYTICS_ENABLED` or `NEXT_PUBLIC_PROVIDER_ANALYTICS_ENABLED` (default: `false`) - Enables provider analytics dashboard with metrics, charts, and weekly email digests. Set to `"true"` to enable.
- `BULK_SCHEDULING_ENABLED` or `NEXT_PUBLIC_BULK_SCHEDULING_ENABLED` (default: `false`) - Enables bulk scheduling feature for providers to create repeated class occurrences quickly. Set to `"true"` to enable.
- `FAMILY_WALLET_ENABLED` or `NEXT_PUBLIC_FAMILY_WALLET_ENABLED` (default: `false`) - Enables Family Wallet system allowing parents, grandparents, and guardians to share booking credits, manage household members, and gift points. Set to `"true"` to enable.
- `GROWTH_AUTOMATION_DASHBOARD_ENABLED` or `NEXT_PUBLIC_GROWTH_AUTOMATION_DASHBOARD_ENABLED` (default: `false`) - Enables the Growth Automation Control Center for admins with AI insights, automated provider reports, and performance coaching. Set to `"true"` to enable.
- `PROVIDER_PAYOUTS_ENABLED` (default: `false`) - Enables provider payout reconciliation dashboard with Stripe integration, booking matching, and monthly summary emails. Set to `"true"` to enable.
- `CRON_SECRET` (optional) - Secret token for securing the `/api/cron/check-alerts`, `/api/cron/provider-metrics-digest`, `/api/cron/provider-payout-summary`, `/api/cron/update-loyalty-tiers`, and `/api/cron/provider-weekly-growth` endpoints. Set this when configuring cron jobs.
- `TRACKING_ENABLED` or `NEXT_PUBLIC_TRACKING_ENABLED` (default: `false`) - Enables lightweight analytics tracking for personalized experiences. Set to `"true"` to enable.
- `ANALYTICS_RETENTION_ENABLED` (default: `false`) - Enables engagement score calculation and retention intelligence. Set to `"true"` to enable.
- `REACTIVATION_EMAILS_ENABLED` (default: `false`) - Enables automated reactivation emails for inactive families. Set to `"true"` to enable.
- `PERSONALIZATION_ENABLED` or `NEXT_PUBLIC_PERSONALIZATION_ENABLED` (default: `false`) - Enables AI personalisation with family profiles, recommendations, and tailored newsletters. Set to `"true"` to enable.
- `AUTO_RECS_ON_SIGNIN` (default: `false`) - Automatically build recommendations when user signs in. Set to `"true"` to enable.
- `NEWSLETTER_ENABLED` (default: `false`) - Enables weekly tailored newsletters. Set to `"true"` to enable.
- `RECS_WEIGHTS` (optional) - JSON string with recommendation weights: `'{"w_age_fit":0.35,"w_distance":0.2,"w_pop":0.2,"w_quality":0.2,"w_novelty":0.05}'`
- `RECS_MAX_RADIUS_KM` (default: `20`) - Maximum radius in km for location-based recommendations.
- `NEWSLETTER_BATCH_SIZE` (default: `500`) - Number of newsletters to send per batch.

### SendGrid & Email Configuration

Add the following email variables to support transactional sends and the `/api/test-email` verification endpoint:

```
SENDGRID_FROM_EMAIL=notification@parenthelper.co.uk
SENDGRID_FROM_NAME=Parent Helper
SENDGRID_REPLY_TO=notification@parenthelper.co.uk
ADMIN_EMAIL=admin@parenthelper.co.uk
ENABLE_TEST_EMAILS=true
```

## Project Structure

```
├── app/                     # Next.js App Router routes, layouts, and API handlers
│   ├── api/                 # Route handlers (e.g., /api/search)
│   ├── classes/             # Dynamic class and town routes
│   ├── lib/                 # Shared utilities and data loaders
│   ├── layout.jsx           # Root layout
│   └── page.jsx             # Landing experience
├── components/              # Reusable UI (cards, dialogs, forms, maps)
├── server/                  # Long-running tasks, Stripe hooks, newsletter jobs
├── shared/                  # Zod/Drizzle schemas and shared type definitions
├── public/                  # Static assets
├── package.json             # Scripts & dependencies
├── next.config.mjs          # Next.js configuration
├── postcss.config.js        # Tailwind/PostCSS pipeline
├── tailwind.config.ts       # Tailwind design tokens
└── tsconfig.json            # TypeScript configuration
```

Legacy Express automation scripts remain in the repository; they can be run independently when needed, but the primary user experience now ships from Next.js.

## Privacy-First Analytics

Parent Helper includes a privacy-respectful analytics system that helps us understand user behavior without compromising personal data:

### What We Track
- Search queries (anonymized patterns, not exact text)
- Map interactions (zoom, pan, marker clicks)
- Blog post views
- Class card interactions
- Filter usage patterns

### Privacy Guarantees
✅ **No personal data collected** - We never store names, emails, or identifying information
✅ **No cookies used** - Session tracking uses localStorage only (no consent needed under UK GDPR)
✅ **Anonymous session IDs** - Generated client-side using UUID v4
✅ **90-day retention** - Data automatically deleted after 90 days
✅ **Fully GDPR compliant** - Designed for UK/EU privacy regulations
✅ **Fire-and-forget** - Analytics never block the UI or slow down user experience

### Technical Implementation
```typescript
// lib/analytics.ts
import { logSearch, logMapInteraction, logBlogView } from "@/lib/analytics";

// Example usage
logSearch({
  query: "music classes",
  location: "Winchester",
  category: "Music",
  resultCount: 12
});
```

Events are batched (500ms debounce) and sent to `/api/analytics`, which stores them in Supabase with RLS policies preventing public writes.

### Analytics & Retention

Parent Helper includes analytics and retention intelligence to measure family engagement and automatically re-engage lapsed users:

- **Lightweight Tracking**: Fire-and-forget event tracking using `sendBeacon` API
- **Engagement Scores**: Calculated loyalty scores (0-100) based on visits, recommendations clicked, conversions, and session time
- **Retention Automation**: Weekly reactivation emails to inactive families
- **Admin Dashboard**: View metrics at `/admin/analytics`

#### Usage

```typescript
import { track, trackEvents } from "@/lib/analytics-track";

// Track custom events
track("custom_event", { property: "value" });

// Use convenience functions
trackEvents.recommendationClick(classId);
trackEvents.bookingCompleted(classId, amount);
trackEvents.onboardingCompleted();
```

#### Retention Functions

- **Calculate Engagement Scores**: `POST /api/retention/calculate-engagement` (run nightly via cron)
- **Send Reactivation Emails**: `POST /api/retention/send-reactivation` (run weekly via cron)

### Admin Dashboard
View anonymized insights at `/admin/insights`:
- Top searched categories
- Most active towns
- Popular blog posts
- Map interaction patterns
- Daily search trends

All displayed using Recharts with Parent Helper's sage/cream brand colors.

### Database Setup
Run the migration to create the analytics table:
```sql
-- supabase/migrations/create_analytics_table.sql
-- Creates analytics_events table with RLS and 90-day retention
```

For automated cleanup, set up a cron job to call the `delete_old_analytics_events()` function daily.

### Compliance
This analytics implementation complies with:
- **UK GDPR** (General Data Protection Regulation)
- **PECR** (Privacy and Electronic Communications Regulations)
- **ICO Guidelines** (Information Commissioner's Office)

No cookie banner required as we don't use cookies for tracking.

### Provider Growth Score System

Parent Helper includes a comprehensive Provider Growth Score system that helps providers understand their performance and receive AI-powered recommendations.

#### Overview

The Provider Growth Score is a composite metric (0-100) that combines:
- **40%** Booking growth (vs previous week)
- **25%** Conversion rate (bookings/views)
- **20%** Profile completeness
- **15%** Review average

#### Architecture

```
Metrics Collection → Score Calculation → AI Suggestions → Weekly Email → Dashboard Display
```

1. **Metrics Collection**: Weekly aggregation of views, bookings, reviews, and profile data
2. **Score Calculation**: Weighted composite score normalized to 0-100
3. **AI Suggestions**: OpenAI-powered "Next Best Action" recommendations
4. **Weekly Email**: A/B tested engagement emails sent every Sunday
5. **Dashboard Display**: Real-time growth score visualization on provider dashboard

#### Database Schema

- `provider_growth_score`: Stores weekly scores, metrics, and AI suggestions
- `provider_email_tests`: Tracks A/B test variants and email performance

#### Weekly Automation

The system runs automatically every Sunday at 03:00 UTC via cron job:

```bash
# Cron command (set up in your hosting provider)
0 3 * * 0 curl -X POST https://your-domain.com/api/cron/provider-weekly-growth \
  -H "Authorization: Bearer $CRON_SECRET"
```

#### A/B Testing

Email variants are automatically assigned based on provider ID:
- **Variant A**: "Your Parent Helper Growth Report"
- **Variant B**: "See how your classes performed this week"

Open rates and click rates are tracked in `provider_email_tests` for analysis.

#### Dashboard Integration

Providers can view their growth score at `/provider`:
- Visual score ring (0-100)
- Week-over-week comparison
- Metric breakdown
- AI "Next Best Action" suggestion
- "Improve Your Score" checklist

#### API Endpoints

- `GET /api/provider/growth-score` - Get current provider's growth score
- `POST /api/cron/provider-weekly-growth` - Weekly calculation job (requires CRON_SECRET)

#### Testing

Unit tests verify score calculation logic:
```bash
pnpm test -- provider-growth-score.test.ts
```

E2E tests verify dashboard display and email delivery:
```bash
pnpm test:e2e -- provider-growth-score.spec.ts
```

## Deployment Notes

1. Set environment variables in your hosting provider (Vercel, Railway, Render, etc.).
2. Run `pnpm build` during the build phase (or `pnpm run railway-build`).
3. Launch with `pnpm start` (Next will default to port 3000; adjust with `PORT` if required).
4. Enable connection pooling (e.g., Neon + PgBouncer) for Supabase/Postgres when running at scale.

The Parent Helper Next.js implementation is production-ready and replaces the previous Express frontend stack while preserving all core features and automation workflows.
