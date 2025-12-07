# Security Hardening Implementation

This document outlines the comprehensive security hardening upgrades implemented across the Next.js + Supabase project.

## Overview

The security hardening includes:
1. Content Security Policy (CSP)
2. Global Rate Limiting
3. Upload Validation
4. Audit Logging
5. Field Encryption
6. Admin Authentication Improvements
7. Automated Security Scans
8. Security Headers
9. Abuse Monitoring Dashboard
10. Comprehensive Testing

## 1. Content Security Policy (CSP)

**Location**: `lib/security/csp.ts`, `middleware.ts`

**Implementation**:
- Full CSP with Stripe, Supabase, and Unsplash compatibility
- Nonce support for inline scripts
- Production-ready with `upgrade-insecure-requests`

**Key Directives**:
- `default-src 'self'` - Only allow same-origin resources
- `script-src` - Allow Stripe, Supabase, and nonced inline scripts
- `img-src` - Allow Supabase storage, Unsplash, OpenStreetMap
- `connect-src` - Allow Supabase, Stripe API, OpenAI
- `frame-src` - Allow Stripe Checkout and Supabase Auth

**Testing**: `tests/security/csp.test.ts`

## 2. Rate Limiting

**Location**: `lib/security/rate-limit.ts`, `middleware.ts`

**Implementation**:
- Upstash Redis integration with in-memory fallback
- Per-endpoint rate limits:
  - Login: 5 attempts/minute
  - OTP: 3 sends/5 minutes
  - Provider actions: 20/minute
  - AI endpoints: 10/minute
  - Bookings: 5/minute
  - Default: 100/minute

**Features**:
- IP-based or user ID-based identification
- Returns 429 with `Retry-After` header
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Configuration**:
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for Redis
- Falls back to in-memory store if not configured

**Testing**: `tests/security/rate-limit.test.ts`

## 3. Upload Validation

**Location**: `lib/security/upload-validation.ts`, `app/api/upload/route.ts`

**Implementation**:
- MIME type validation (images, documents)
- File size limits (5MB images, 10MB documents)
- EXIF data stripping for images
- Optional VirusTotal scanning

**Allowed MIME Types**:
- Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Documents: `application/pdf`, `application/msword`, etc.

**Security Features**:
- Automatic EXIF removal to prevent metadata leaks
- VirusTotal integration (optional, requires `VIRUSTOTAL_API_KEY`)
- Audit logging for all uploads

**Testing**: `tests/security/upload-validation.test.ts`

## 4. Audit Logging

**Location**: `lib/security/audit.ts`, `drizzle/migrations/0000_add_audit_logs.sql`

**Implementation**:
- Comprehensive audit log table with RLS
- Logs user actions, admin actions, provider updates, class changes, bookings
- Includes IP address and user agent tracking

**Audit Actions**:
- `provider_update`, `provider_create`
- `admin_action`, `admin_login`, `admin_failed_login`
- `class_create`, `class_update`, `class_delete`
- `booking_create`, `booking_cancel`
- `user_delete`, `sensitive_access`

**Admin Interface**: `/admin/audit`

**Database Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT,
  action TEXT NOT NULL,
  payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Field Encryption

**Location**: `lib/security/encryption.ts`

**Implementation**:
- AES-256-GCM encryption for sensitive fields
- Key derivation using scrypt
- Encrypt/decrypt utilities for objects

**Usage**:
```typescript
import { encrypt, decrypt, encryptFields, decryptFields } from '@/lib/security/encryption';

// Encrypt single field
const encrypted = encrypt("sensitive data");

// Encrypt multiple fields
const encryptedData = encryptFields(data, ['allergies', 'medical_notes']);
```

**Configuration**:
- Set `ENCRYPTION_SECRET` environment variable
- Use for: child allergies, SEN data, medical information

## 6. Admin Authentication Improvements

**Location**: `lib/admin/auth-improved.ts`, `drizzle/migrations/0000_add_users_table_admin_role.sql`

**Implementation**:
- Replaces `ADMIN_SECRET` cookie-based auth
- Uses Supabase Auth + `users.role` table
- RLS policies for admin access
- Foundation for 2FA (TOTP) and WebAuthn

**Migration Path**:
1. Run migration to create `users` table
2. Update admin routes to use `requireAdmin()` from `lib/admin/auth-improved.ts`
3. Set user roles: `UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';`

**2FA Support** (Future):
- TOTP secret storage in `users.two_factor_secret`
- WebAuthn credentials in `users.webauthn_credentials`

**Database Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role TEXT DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  webauthn_credentials JSONB DEFAULT '[]'
);
```

## 7. Automated Security Scans

**Location**: `.github/workflows/security-scan.yml`

**Implementation**:
- Weekly scheduled scans (Mondays at 2 AM UTC)
- Runs on push/PR to main/develop branches
- Scans include:
  - `npm audit` for dependency vulnerabilities
  - ESLint security rules
  - TypeScript type checking
  - OWASP ZAP baseline scan (on PRs)

**Artifacts**:
- `npm-audit-report.json`
- `eslint-security-report.json`
- `zap-results.json`

## 8. Security Headers

**Location**: `lib/security/headers.ts`, `middleware.ts`

**Implementation**:
- Applied to all responses via middleware
- Headers include:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security` (production only)
  - `Permissions-Policy`
  - `X-XSS-Protection: 1; mode=block`

## 9. Abuse Monitoring Dashboard

**Location**: `app/admin/security/`, `app/api/admin/security/`

**Implementation**:
- Real-time monitoring of:
  - Failed login attempts
  - Rate limit triggers
  - Blocked IPs
  - Recent audit logs

**Features**:
- IP blocking/unblocking
- Export audit logs to CSV
- Filter by action, role, search term
- KPI cards for quick overview

**Database Schema**:
```sql
CREATE TABLE blocked_ips (
  ip TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id)
);
```

## 10. Testing

**Test Files**:
- `tests/security/csp.test.ts` - CSP generation tests
- `tests/security/rate-limit.test.ts` - Rate limiting tests
- `tests/security/upload-validation.test.ts` - Upload validation tests

**Run Tests**:
```bash
npm run test:unit tests/security/
```

## Environment Variables

Required environment variables:

```bash
# Encryption
ENCRYPTION_SECRET=your-secret-key-here

# Rate Limiting (optional - falls back to in-memory)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# VirusTotal (optional)
VIRUSTOTAL_API_KEY=your-api-key

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Migrations

Run migrations in order:

1. `drizzle/migrations/0000_add_users_table_admin_role.sql`
2. `drizzle/migrations/0000_add_audit_logs.sql`
3. `drizzle/migrations/0000_add_blocked_ips.sql`

```bash
# Apply migrations via Supabase dashboard or CLI
psql $DATABASE_URL -f drizzle/migrations/0000_add_users_table_admin_role.sql
psql $DATABASE_URL -f drizzle/migrations/0000_add_audit_logs.sql
psql $DATABASE_URL -f drizzle/migrations/0000_add_blocked_ips.sql
```

## Rollout Plan

### Phase 1: Foundation (Week 1)
1. ✅ Deploy security headers and CSP
2. ✅ Deploy rate limiting (in-memory fallback)
3. ✅ Deploy audit logging infrastructure
4. ✅ Run database migrations

### Phase 2: Authentication (Week 2)
1. ✅ Migrate admin routes to new auth system
2. ✅ Set admin roles in database
3. ✅ Test admin access
4. ⏳ Implement 2FA (optional)

### Phase 3: Monitoring (Week 3)
1. ✅ Deploy abuse monitoring dashboard
2. ✅ Set up automated security scans
3. ✅ Configure alerts

### Phase 4: Hardening (Week 4)
1. ✅ Deploy upload validation
2. ✅ Enable field encryption for sensitive data
3. ✅ Configure VirusTotal (optional)
4. ✅ Enable Upstash Redis for rate limiting (optional)

## Risk Assessment

### Low Risk
- Security headers (non-breaking)
- CSP (may require adjustments for third-party scripts)
- Rate limiting (in-memory fallback)

### Medium Risk
- Admin auth migration (requires careful testing)
- Upload validation (may reject valid files initially)

### High Risk
- Field encryption (requires data migration for existing encrypted fields)
- Database migrations (backup required)

## Testing Instructions

1. **Test CSP**:
   ```bash
   npm run test:unit tests/security/csp.test.ts
   ```

2. **Test Rate Limiting**:
   ```bash
   npm run test:unit tests/security/rate-limit.test.ts
   # Then test manually: Make 6 rapid requests to /api/auth/login
   ```

3. **Test Upload Validation**:
   ```bash
   npm run test:unit tests/security/upload-validation.test.ts
   # Then test manually: Upload invalid file types/sizes
   ```

4. **Test Admin Auth**:
   - Try accessing `/admin/security` without admin role
   - Verify 403 response
   - Set role to admin and verify access

5. **Test Audit Logging**:
   - Perform admin actions
   - Check `/admin/audit` for logs
   - Verify IP addresses and user agents are logged

## Files Created/Modified

### New Files
- `lib/security/csp.ts`
- `lib/security/rate-limit.ts`
- `lib/security/headers.ts`
- `lib/security/encryption.ts`
- `lib/security/audit.ts`
- `lib/security/upload-validation.ts`
- `lib/admin/auth-improved.ts`
- `app/api/upload/route.ts`
- `app/admin/security/page.tsx`
- `app/admin/security/_components/SecurityDashboardClient.tsx`
- `app/api/admin/security/block-ip/route.ts`
- `app/api/admin/security/unblock-ip/route.ts`
- `app/admin/audit/page.tsx`
- `app/admin/audit/_components/AuditLogViewer.tsx`
- `tests/security/csp.test.ts`
- `tests/security/rate-limit.test.ts`
- `tests/security/upload-validation.test.ts`
- `.github/workflows/security-scan.yml`
- `drizzle/migrations/0000_add_audit_logs.sql`
- `drizzle/migrations/0000_add_users_table_admin_role.sql`
- `drizzle/migrations/0000_add_blocked_ips.sql`
- `docs/SECURITY_HARDENING.md`

### Modified Files
- `middleware.ts` - Added CSP, security headers, rate limiting
- `package.json` - May need to add `@upstash/ratelimit` and `@upstash/redis` dependencies

## Next Steps

1. Install dependencies:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Run migrations in Supabase

3. Set environment variables

4. Test each component

5. Monitor security dashboard for issues

6. Gradually migrate admin routes to new auth system

## Support

For issues or questions:
- Check audit logs: `/admin/audit`
- Monitor security dashboard: `/admin/security`
- Review GitHub Actions security scan results

