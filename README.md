# Parent Helper App (Next.js App Router)

Parent Helper connects UK families with thousands of verified baby and toddler activities. The project now runs entirely on the Next.js App Router, pairing server-rendered React components with modern data fetching, while retaining the rich dataset, Supabase integrations, and automation tooling that power the platform.

## Features

- Location-aware search with category, age range, and price filters
- Structured data for >5,000 classes sourced from Supabase/Postgres and enrichment scripts
- Rich editorial content (blog, guides) served through the Next.js App Router
- Franchise and provider tooling, including Stripe checkout hooks and CRM exports
- Automation scripts (in `/server` and `/scripts`) for syncing data, newsletters, and analytics
- **Privacy-first analytics** - GDPR-compliant, cookie-free usage tracking

## Technology Stack

- **Framework**: Next.js 15 App Router (React 18 + TypeScript)
- **Styling**: Tailwind CSS, Radix UI primitives, shadcn/ui design system
- **Data**: Supabase/Postgres + Drizzle ORM schema shared via `/shared`
- **Payments & Email**: Stripe billing flows, SendGrid transactional emails
- **Tooling**: ESLint flat config, Prettier, Turbo/automation scripts for data ingestion

## Quick Start

```bash
npm install
npm run dev
```

- The app boots at http://localhost:3000 with hot reloading.
- API routes live under `app/api/*` and share types with `/shared/schema.ts`.

## Build & Deploy

```bash
npm run build
npm start            # serves the production build with next start
```

For Railway or other container hosts you can use the bundled helper script:

```bash
npm run railway-build  # installs dependencies and runs next build
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

## Deployment Notes

1. Set environment variables in your hosting provider (Vercel, Railway, Render, etc.).
2. Run `npm run build` during the build phase (or `npm run railway-build`).
3. Launch with `npm start` (Next will default to port 3000; adjust with `PORT` if required).
4. Enable connection pooling (e.g., Neon + PgBouncer) for Supabase/Postgres when running at scale.

The Parent Helper Next.js implementation is production-ready and replaces the previous Express frontend stack while preserving all core features and automation workflows.
