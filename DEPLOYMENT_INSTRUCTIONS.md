# Deployment Instructions (Next.js App Router)

## 1. Prepare Your Repository
- Ensure the following directories and files are committed:
  - `app/`, `components/`, `shared/`, `server/`, `public/`
  - `package.json`, `package-lock.json`
  - `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
  - `.env.example`, `.gitignore`, `README.md`
- Remove large data exports or one-off scripts you do not intend to publish (database dumps, CSV backups, etc.).

## 2. Configure Environment Variables
Create `.env.local` locally and mirror the same secrets in your hosting provider (Vercel, Railway, Render, Fly.io, etc.):

```
DATABASE_URL=postgres_connection_string
SUPABASE_SERVICE_ROLE=service_role_key
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=your_sendgrid_api_key
```

Additional automation scripts in `/server` may require further keys (Google Places, Instagram, etc.).

## 3. Deploy to Vercel
1. Import the repository into Vercel.
2. Set the environment variables listed above.
3. Build command: `npm run build`
4. Output is served automatically by `next start` in Vercel’s serverless runtime.

## 4. Deploy to Railway / Render
1. Set the build command to `npm run railway-build` (or `npm install && npm run build`).
2. Start command: `npm start`.
3. Define the same environment variables in the platform dashboard.

## 5. Local Production Smoke Test
```bash
npm install
npm run build
npm start
```
Visit http://localhost:3000 to verify the production build before pushing live.

Your Next.js App Router deployment is now aligned with the modern stack—legacy Express-centric steps are no longer required.
