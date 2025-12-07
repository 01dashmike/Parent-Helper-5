# Batch Update Pattern for Remaining Admin Pages

## Pattern to Replace

### BEFORE:
```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

### AFTER:
```typescript
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
// ... other imports (remove cookies, redirect if only used for Gate) ...

export default async function PageName() {
  await requireAdminServerComponent();
  // ... rest of page (unchanged) ...
}
```

## Remaining Files to Update

- app/admin/emails/page.tsx
- app/admin/referrals/page.tsx
- app/admin/rewards/page.tsx
- app/admin/verifications/page.tsx
- app/admin/errors/page.tsx
- app/admin/qna/page.tsx
- app/admin/topics/page.tsx
- app/admin/marketing/automations/page.tsx
- app/admin/health/page.tsx
- app/admin/docs/activity/page.tsx
- app/admin/personalisation/page.tsx
- app/admin/reports/providers/page.tsx
- app/admin/analytics/growth/page.tsx
- app/admin/analytics/insights/page.tsx
- app/admin/providers/leads/page.tsx
- app/admin/page 2.tsx (if exists)





