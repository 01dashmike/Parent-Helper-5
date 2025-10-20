# GitHub Export Checklist

Use this list to publish the Next.js App Router version of Parent Helper.

## Files to Include ✓
- `app/` (routes, API handlers, layouts)
- `components/` (shared UI)
- `shared/` (Drizzle/Zod schemas)
- `server/` (optional automation scripts)
- `public/`
- `package.json`, `package-lock.json`
- `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- `.env.example`, `.gitignore`
- `README.md`

## Export Steps ✓
1. Copy the repository contents (excluding `node_modules/` and large data exports).
2. Create a GitHub repo named `Parent-Helper-5`.
3. Push or upload the files above.
4. Configure deployment (Vercel, Railway, Render, etc.).

## Environment Variables ✓
```
DATABASE_URL=postgres_connection_string
SUPABASE_SERVICE_ROLE=service_role_key
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Build Commands ✓
- `npm install`
- `npm run build`
- `npm start`

Your Next.js project is ready to ship.
