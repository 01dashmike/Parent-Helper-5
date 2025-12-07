# Admin Auth Migration - Status & Remaining Work

## ✅ Completed

1. **New Auth Helper Created** (`lib/admin/auth-improved.ts`)
   - `requireAdminServerComponent()` - for pages
   - `requireAdminRoute()` - for API routes
   - Dev override: `DEV_ADMIN_EMAIL` in development
   - Legacy functions kept for backward compatibility

2. **Login Page Updated** (`app/admin/login/page.tsx`)
   - Removed all cookie-based auth
   - Redirects to `/account/login?next=/admin`

3. **Not-Authorised Page Created** (`app/admin/not-authorised/page.tsx`)
   - Shows friendly message for non-admin users

4. **Pages Updated** (6 of 25):
   - ✅ `app/admin/page.tsx`
   - ✅ `app/admin/blogs/page.tsx`
   - ✅ `app/admin/insights/page.tsx`
   - ✅ `app/admin/videos/page.tsx`
   - ✅ `app/admin/analytics/page.tsx`
   - ✅ `app/admin/analytics/page.tsx` (duplicate check)

5. **API Routes Updated** (2 of 30+):
   - ✅ `app/api/admin/automation/summary/route.ts`
   - ✅ `app/api/blog/admin/route.ts`

## 🔄 Remaining Work

### Admin Pages (19 remaining)

**Pattern to replace:**

**BEFORE:**
```typescript
import { cookies } from "next/headers";
// ... other imports ...

function Gate() {
  // ... Gate component with cookie-setting logic ...
}

export default async function PageName() {
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("ph_admin")?.value;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || cookieSecret !== adminSecret) {
    return <Gate />;
  }
  // ... rest of page ...
}
```

**AFTER:**
```typescript
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
// ... other imports (remove cookies import) ...

export default async function PageName() {
  await requireAdminServerComponent();
  // ... rest of page ...
}
```

**Files to update:**
- `app/admin/partners/page.tsx`
- `app/admin/analytics/referrals/page.tsx`
- `app/admin/tips/page.tsx`
- `app/admin/analytics/growth/page.tsx`
- `app/admin/emails/page.tsx`
- `app/admin/reports/providers/page.tsx`
- `app/admin/errors/page.tsx`
- `app/admin/verifications/page.tsx`
- `app/admin/qna/page.tsx`
- `app/admin/topics/page.tsx`
- `app/admin/marketing/automations/page.tsx`
- `app/admin/health/page.tsx`
- `app/admin/referrals/page.tsx`
- `app/admin/rewards/page.tsx`
- `app/admin/payments/page.tsx`
- `app/admin/docs/activity/page.tsx`
- `app/admin/personalisation/page.tsx`
- `app/admin/bookings/page.tsx`
- `app/admin/questions/page.tsx`
- `app/admin/automation/page.tsx`
- `app/admin/analytics/insights/page.tsx`
- `app/admin/providers/leads/page.tsx`
- `app/admin/page 2.tsx` (if exists)

### API Routes (28+ remaining)

**Pattern to replace:**

**BEFORE:**
```typescript
import { cookies } from "next/headers";
// ... other imports ...

async function validateAdmin() {
  const cookieStore = await cookies();
  const cookieSecret = cookieStore.get("ph_admin")?.value;
  if (!process.env.ADMIN_SECRET || cookieSecret !== process.env.ADMIN_SECRET) {
    throw new Error("Unauthorized");
  }
}

export async function GET(req: NextRequest) {
  try {
    await validateAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... rest of handler ...
}
```

**AFTER:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin/auth-improved";
// ... other imports (remove cookies import) ...

export async function GET(req: NextRequest) {
  const response = new NextResponse();
  const authResult = await requireAdminRoute(req, response);
  
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler ...
}
```

**Files to update:**
- `app/api/admin/automation/insights/route.ts`
- `app/api/admin/partners/route.ts`
- `app/api/admin/activity/route.ts`
- `app/api/admin/automation/coach/route.ts`
- `app/api/admin/automation/forecast/route.ts`
- `app/api/admin/automation/reports/route.ts`
- `app/api/admin/automation/toggles/route.ts`
- `app/api/admin/topics/route.ts`
- `app/api/admin/marketing/rules/route.ts`
- `app/api/admin/marketing/campaigns/route.ts`
- `app/api/admin/payments/route.ts`
- `app/api/admin/rewards/route.ts`
- `app/api/admin/referrals/route.ts`
- `app/api/admin/questions/[id]/route.ts`
- `app/api/admin/growth-metrics/route.ts`
- `app/api/admin/tips/route.ts`
- `app/api/admin/verifications/route.ts`
- `app/api/admin/insights/route.ts`
- `app/api/admin/referrals/analytics/route.ts`
- `app/api/admin/audit/route.ts`
- `app/api/admin/revenue/route.ts`
- `app/api/admin/email-logs/export/route.ts`
- `app/api/classes/questions/[qid]/moderate/route.ts`
- `app/api/retention/send-reactivation/route.ts`
- `app/api/retention/calculate-engagement/route.ts`
- `app/api/personalisation/refresh-quality/route.ts`
- `app/api/marketing/trigger/route.ts`
- `app/api/videos/[id]/route.ts` (partial - check usage)
- `app/api/ai/coach/route.ts` (partial - check usage)

### Cleanup Tasks

1. **Delete obsolete files:**
   - `app/api/admin/session/route.ts` (cookie-setting endpoint)
   - `lib/admin/auth.ts` (if not used elsewhere - check first)

2. **Remove unused imports:**
   - Remove `cookies` imports from all updated files
   - Remove `ADMIN_SECRET` references

3. **Environment variables:**
   - `ADMIN_SECRET` can be removed (no longer needed)
   - Add `DEV_ADMIN_EMAIL` to `.env.local` for development

## 🧪 Testing Checklist

After completing migration:

- [ ] Dev mode: Set `DEV_ADMIN_EMAIL=your@email.com` in `.env.local`
- [ ] Log in via `/account/login` with dev email
- [ ] Visit `/admin` - should work automatically
- [ ] Visit `/admin/login` while logged in - should redirect to `/admin`
- [ ] Visit `/admin` while logged out - should redirect to `/admin/login`
- [ ] Visit `/admin` with non-admin account - should show `/admin/not-authorised`
- [ ] Test API routes return 401 when not authenticated
- [ ] Test API routes return 401 when authenticated but not admin
- [ ] Test API routes work when authenticated as admin
- [ ] Verify provider/account flows still work (not affected)

## 📝 Notes

- Dev override: In development, if `DEV_ADMIN_EMAIL` matches logged-in user's email, access is granted regardless of `users.role`
- The `users` table must have a `role` column with value `'admin'` for production admin access
- All redirects are handled automatically by `requireAdminServerComponent()`
- API routes return JSON errors, pages redirect





