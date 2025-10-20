# Parent Helper App (Next.js App Router)

Parent Helper connects UK families with thousands of verified baby and toddler activities. The project now runs entirely on the Next.js App Router, pairing server-rendered React components with modern data fetching, while retaining the rich dataset, Supabase integrations, and automation tooling that power the platform.

## Features

- Location-aware search with category, age range, and price filters
- Structured data for >5,000 classes sourced from Supabase/Postgres and enrichment scripts
- Rich editorial content (blog, guides) served through the Next.js App Router
- Franchise and provider tooling, including Stripe checkout hooks and CRM exports
- Automation scripts (in `/server` and `/scripts`) for syncing data, newsletters, and analytics

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

Create a `.env.local` (or project-level secrets in your hosting platform) with the required credentials. Common keys include:

```
DATABASE_URL=postgresql_connection_string
SUPABASE_SERVICE_ROLE=service_role_key
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=your_sendgrid_api_key
```

> Many automation scripts under `/server` and `/scripts` expect the same variables. Review each script before running it against production data.

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

## Deployment Notes

1. Set environment variables in your hosting provider (Vercel, Railway, Render, etc.).
2. Run `npm run build` during the build phase (or `npm run railway-build`).
3. Launch with `npm start` (Next will default to port 3000; adjust with `PORT` if required).
4. Enable connection pooling (e.g., Neon + PgBouncer) for Supabase/Postgres when running at scale.

The Parent Helper Next.js implementation is production-ready and replaces the previous Express frontend stack while preserving all core features and automation workflows.
