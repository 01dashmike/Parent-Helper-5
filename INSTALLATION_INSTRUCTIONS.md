# Security Hardening Installation Instructions

## Quick Start

### 1. Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

Note: `sharp` is already installed.

### 2. Set Environment Variables

Add to your `.env.local` or `.env`:

```bash
# Required
ENCRYPTION_SECRET=your-secret-key-minimum-32-characters-long

# Optional - Rate Limiting (falls back to in-memory if not set)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional - VirusTotal Scanning
VIRUSTOTAL_API_KEY=your-api-key
```

### 3. Run Database Migrations

Execute these SQL files in your Supabase SQL Editor (in order):

1. `drizzle/migrations/0000_add_users_table_admin_role.sql`
2. `drizzle/migrations/0000_add_audit_logs.sql`
3. `drizzle/migrations/0000_add_blocked_ips.sql`

Or via CLI:
```bash
psql $DATABASE_URL -f drizzle/migrations/0000_add_users_table_admin_role.sql
psql $DATABASE_URL -f drizzle/migrations/0000_add_audit_logs.sql
psql $DATABASE_URL -f drizzle/migrations/0000_add_blocked_ips.sql
```

### 4. Set Admin Roles

After running migrations, set admin roles:

```sql
-- Set a user as admin
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Verify
SELECT id, email, role FROM users WHERE role = 'admin';
```

### 5. Test the Implementation

```bash
# Run security tests
npm run test:unit tests/security/

# Test CSP
npm run test:unit tests/security/csp.test.ts

# Test rate limiting
npm run test:unit tests/security/rate-limit.test.ts

# Test upload validation
npm run test:unit tests/security/upload-validation.test.ts
```

### 6. Verify Security Headers

```bash
# Start dev server
npm run dev

# In another terminal, check headers
curl -I http://localhost:3000

# Should see:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# etc.
```

### 7. Test Admin Access

1. Try accessing `/admin/security` without admin role → Should get 403
2. Set your user as admin (see step 4)
3. Try accessing `/admin/security` again → Should work

### 8. Migrate Existing Admin Routes (Optional)

Replace `ADMIN_SECRET` cookie checks with new auth:

**Before:**
```typescript
const cookieStore = await cookies();
const cookieSecret = cookieStore.get("ph_admin")?.value;
if (!process.env.ADMIN_SECRET || cookieSecret !== process.env.ADMIN_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**After:**
```typescript
import { requireAdmin } from "@/lib/admin/auth-improved";

const authError = await requireAdmin(request);
if (authError) {
  return authError;
}
```

## Verification Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin roles set
- [ ] Security tests passing
- [ ] Security headers present
- [ ] Admin access working
- [ ] Audit logs accessible at `/admin/audit`
- [ ] Security dashboard accessible at `/admin/security`

## Troubleshooting

### Rate Limiting Not Working
- Check if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- If not set, it will use in-memory fallback (works but doesn't persist)
- Check middleware logs for rate limit errors

### Admin Access Denied
- Verify user has `role = 'admin'` in `users` table
- Check Supabase Auth session is valid
- Verify RLS policies are correct

### CSP Errors in Browser Console
- Check browser console for CSP violations
- Adjust CSP directives in `lib/security/csp.ts` if needed
- Common issues: third-party scripts, inline styles

### Upload Validation Failing
- Check file MIME type is in allowed list
- Verify file size is within limits
- Check EXIF stripping is working (may add slight latency)

### Audit Logs Not Appearing
- Verify `audit_logs` table exists
- Check RLS policies allow service role inserts
- Verify `logAuditEvent` is being called

## Next Steps

1. Monitor `/admin/security` dashboard for abuse patterns
2. Review `/admin/audit` logs regularly
3. Set up alerts for failed login attempts
4. Consider enabling Upstash Redis for production
5. Implement 2FA for admin users (optional)
6. Configure VirusTotal for file scanning (optional)

## Support

- See `docs/SECURITY_HARDENING.md` for detailed documentation
- Check `SECURITY_IMPLEMENTATION_SUMMARY.md` for implementation details
- Review audit logs at `/admin/audit` for issues

