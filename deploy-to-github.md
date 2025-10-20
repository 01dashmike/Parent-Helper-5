# Deploy Parent Helper to GitHub

Your Next.js app is ready to publish. Follow these steps to mirror the latest App Router build to GitHub.

## Create a Repository (Recommended)
1. Visit **github.com/new**.
2. Name the repo `Parent-Helper-5`.
3. Leave it empty (no README, license, or .gitignore).

## What to Upload
- `app/`, `components/`, `shared/`, `server/`, `public/`
- `package.json`, `package-lock.json`
- `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- `.env.example`, `.gitignore`, `README.md`

Avoid adding heavy data exports (`attached_assets/`, SQL/CSV backups) or one-off automation scripts unless you need them in version control.

## After Pushing
- Connect the repository to Vercel or Railway.
- Set environment variables (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, etc.).
- Trigger a build with `npm run build` (or `npm run railway-build` on Railway).
- Start the production server with `npm start`.

GitHub now reflects your modern Next.js stack—ready for collaboration, CI, and deployment.
