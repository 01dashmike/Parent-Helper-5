# GitHub Export Guide for Parent Helper (Next.js)

Your Next.js application is ready to share on GitHub. Follow this checklist to publish the production codebase (App Router + shared automation tooling).

## Essential Files for GitHub

### Core Application ✓
- `app/` – Next.js App Router routes, API handlers, and layouts
- `components/` – Shared UI primitives (cards, dialogs, CTA blocks)
- `shared/` – Drizzle/Zod schemas used by both API routes and scripts
- `server/` – Optional automation scripts (Stripe, newsletters, data sync)
- `public/` – Static assets (icons, images)
- `README.md` – Project overview and setup instructions

### Configuration ✓
- `package.json` / `package-lock.json`
- `next.config.mjs`
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `.env.example` (template for required environment variables)
- `.gitignore`

## GitHub Upload Steps

1. **Create a repository**
   - Name: `Parent-Helper-5`
   - Description: `Parent Helper 5 – Next.js App Router`
   - Visibility: Public (or private if preferred)

2. **Upload the project root**
   ```
   app/
   components/
   shared/
   server/
   public/
   package.json
   package-lock.json
   next.config.mjs
   tailwind.config.ts
   postcss.config.js
   tsconfig.json
   README.md
   .env.example
   .gitignore
   ```

3. **Exclude** heavy data exports and one-off scripts unless required:
   - `.cjs` automation scripts you do not plan to share
   - Database dumps and CSV exports
   - `node_modules/`
   - Large attachments in `attached_assets/`

## Deployment Platforms

**Vercel (recommended):**
- First-class support for Next.js App Router
- Automatic builds (`npm run build`) and previews per pull request

**Railway / Render / Fly.io:**
- Use the `railway-build` helper script (`npm run railway-build`) or run `npm install && npm run build`
- Serve production with `npm start`

## Environment Variables

Create `.env.local` locally and configure the same keys in your hosting provider:

```
DATABASE_URL=postgres_connection_string
SUPABASE_SERVICE_ROLE=service_role_key
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=your_sendgrid_api_key
```

Additional automation scripts in `/server` may require extra keys (e.g., Instagram, Google Places).

## Project Snapshot

- 5,000+ curated class records with geospatial search
- Blog, partner landing pages, and provider dashboards implemented with Next.js App Router
- Stripe-powered featured listings and SendGrid newsletters ready for production scaling

Your Next.js build is ready for GitHub and cloud deployment.
