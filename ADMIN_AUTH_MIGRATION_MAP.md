# Admin Auth Migration - Complete Mapping

## A) Pages Using Admin Cookie Auth (app/admin/**)

All 25 admin pages use cookie-based auth:
- app/admin/page.tsx
- app/admin/login/page.tsx
- app/admin/blogs/page.tsx
- app/admin/insights/page.tsx
- app/admin/docs/activity/page.tsx
- app/admin/analytics/page.tsx
- app/admin/personalisation/page.tsx
- app/admin/bookings/page.tsx
- app/admin/marketing/automations/page.tsx
- app/admin/topics/page.tsx
- app/admin/reports/providers/page.tsx
- app/admin/analytics/growth/page.tsx
- app/admin/analytics/referrals/page.tsx
- app/admin/errors/page.tsx
- app/admin/tips/page.tsx
- app/admin/qna/page.tsx
- app/admin/partners/page.tsx
- app/admin/videos/page.tsx
- app/admin/rewards/page.tsx
- app/admin/verifications/page.tsx
- app/admin/emails/page.tsx
- app/admin/payments/page.tsx
- app/admin/referrals/page.tsx
- app/admin/health/page.tsx
- app/admin/questions/page.tsx
- app/admin/automation/page.tsx
- app/admin/analytics/insights/page.tsx
- app/admin/providers/leads/page.tsx

**Pattern used:**
```typescript
const cookieStore = await cookies();
const cookieSecret = cookieStore.get("ph_admin")?.value;
const adminSecret = process.env.ADMIN_SECRET;
if (!adminSecret || cookieSecret !== adminSecret) {
  return <Gate />; // or redirect("/admin/login")
}
```

## B) API Routes Validating Admin (app/api/admin/**)

All 30+ admin API routes use cookie-based auth:
- app/api/admin/session/route.ts (sets cookie)
- app/api/admin/automation/summary/route.ts
- app/api/admin/automation/insights/route.ts
- app/api/admin/partners/route.ts
- app/api/admin/activity/route.ts
- app/api/admin/automation/coach/route.ts
- app/api/admin/automation/forecast/route.ts
- app/api/admin/automation/reports/route.ts
- app/api/admin/automation/toggles/route.ts
- app/api/admin/topics/route.ts
- app/api/admin/marketing/rules/route.ts
- app/api/admin/marketing/campaigns/route.ts
- app/api/admin/payments/route.ts
- app/api/admin/rewards/route.ts
- app/api/admin/referrals/route.ts
- app/api/admin/questions/[id]/route.ts
- app/api/admin/growth-metrics/route.ts
- app/api/admin/tips/route.ts
- app/api/admin/verifications/route.ts
- app/api/admin/insights/route.ts
- app/api/admin/referrals/analytics/route.ts
- app/api/admin/audit/route.ts
- app/api/admin/revenue/route.ts
- app/api/admin/email-logs/export/route.ts
- app/api/blog/admin/route.ts
- app/api/classes/questions/[qid]/moderate/route.ts
- app/api/retention/send-reactivation/route.ts
- app/api/retention/calculate-engagement/route.ts
- app/api/personalisation/refresh-quality/route.ts
- app/api/marketing/trigger/route.ts
- app/api/videos/[id]/route.ts (partial)
- app/api/ai/coach/route.ts (partial)

**Pattern used:**
```typescript
async function validateAdmin() {
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("ph_admin")?.value;
  if (!process.env.ADMIN_SECRET || cookieSecret !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}
```

## C) Helper Files

1. **lib/admin/auth.ts** - Hybrid auth (Supabase OR cookie fallback)
   - Used by: app/api/admin/seo/generate/route.ts
   - Status: Will be removed (replaced by auth-improved.ts)

2. **lib/admin/auth-improved.ts** - Supabase-only auth
   - Used by: 
     - app/api/admin/security/block-ip/route.ts
     - app/api/admin/security/unblock-ip/route.ts
     - app/admin/audit/page.tsx
     - app/admin/security/page.tsx
   - Status: Will be enhanced with new functions

## D) Current Active Admin Authentication Path

**Primary System:** Cookie-based (`ph_admin` cookie = `ADMIN_SECRET` env var)
- Used by: ~25 pages, ~30 API routes
- Login: app/admin/login/page.tsx sets cookie
- Validation: Direct cookie comparison

**Secondary System:** Supabase auth (users.role === 'admin')
- Used by: 2 API routes, 2 pages
- Helper: lib/admin/auth-improved.ts

**Legacy Helper:** lib/admin/auth.ts (hybrid)
- Used by: 1 API route
- Status: Obsolete





