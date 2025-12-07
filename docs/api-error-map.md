# API Error Mapping & Unified Error Schema v2 Proposal

## Summary

This document provides a comprehensive, read-only mapping of how all API routes currently return errors. It identifies inconsistencies across the codebase and proposes (but does not implement) a unified Error Schema v2. This analysis was performed without modifying any source code, preserving all existing behavior for reference during future refactoring efforts.

---

## 1. Global Overview

### Statistics

- **Total API route files analyzed:** 203
- **Total unique endpoints (path + method):** ~250+ (many routes support multiple HTTP methods)
- **HTTP status codes in use for errors:**
  - `400` - Bad Request (validation errors, invalid input, business rule violations)
  - `401` - Unauthorized (authentication required)
  - `403` - Forbidden (authorization failed, feature disabled)
  - `404` - Not Found (resource not found)
  - `409` - Conflict (duplicate resources, e.g., referral already exists)
  - `429` - Too Many Requests (rate limit exceeded)
  - `500` - Internal Server Error (unexpected errors, database failures)
  - `503` - Service Unavailable (feature disabled, service not configured)

### Error Field Patterns

**Most common error field keys:**

1. **`error` (string)** - Used in ~85% of error responses
   - Examples: `{ error: "Unauthorized" }`, `{ error: "Invalid request" }`
   - Most consistent pattern across the codebase

2. **`message` (string)** - Used in ~10% of error responses
   - Examples: `{ message: "Internal server error" }`
   - Often paired with `error` field: `{ error: "AUTH_REQUIRED", message: "Please sign in" }`

3. **`code` (string)** - Used in ~15% of error responses (machine-readable codes)
   - Examples: `{ error: "AUTH_REQUIRED" }`, `{ error: "FORBIDDEN" }`, `{ error: "WALLET_NOT_FOUND" }`
   - Some routes use `code` as a separate field, others embed it in `error`
   - Common codes: `AUTH_REQUIRED`, `FORBIDDEN`, `WALLET_NOT_FOUND`, `INSUFFICIENT_BALANCE`, `NOT_OWNER`, `STRIPE_CONNECT_NOT_CONFIGURED`

4. **`details` (array/object)** - Used in ~8% of error responses (validation errors)
   - Examples: `{ error: "Invalid request", details: validationResult.error.errors }`
   - Typically contains Zod validation error arrays

5. **`errors` (array)** - Rarely used (~2% of routes)
   - Example: `{ errors: ["Missing X", "Invalid Y"] }`

6. **`valid` (boolean)** - Used in specific validation endpoints
   - Example: `{ valid: false, error: "Coupon not found" }` (rewards/validate-coupon)

7. **`success` (boolean)** - Used in some success responses, rarely in errors
   - Example: `{ success: false, error: "..." }` (cron routes)

### Status Code Usage Patterns

- **400 (Bad Request):** Most common for validation errors, missing required fields, invalid business state (e.g., insufficient balance, occurrence not bookable)
- **401 (Unauthorized):** Consistent for missing/invalid authentication
- **403 (Forbidden):** Used for both authorization failures and feature flags (e.g., "Reviews feature is not enabled")
- **404 (Not Found):** Consistent for missing resources
- **409 (Conflict):** Used sparingly for duplicate resources (referrals, invitations)
- **429 (Rate Limit):** Used consistently for rate limiting
- **500 (Internal Server Error):** Catch-all for unexpected errors, database failures
- **503 (Service Unavailable):** Used for feature flags and service configuration issues

### Validation Error Patterns

- **Zod validation errors:** Most routes using Zod return `{ error: "Invalid request", details: validationResult.error.errors }`
- **Field-level errors:** Rarely used; most validation errors are flat strings
- **No structured field errors:** No routes currently use `fieldErrors: { fieldName: ["error1", "error2"] }` pattern

---

## 2. Per-Route Error Behavior

### Authentication & Authorization

#### `/api/auth/magic-link` — POST
- **File:** `app/api/auth/magic-link/route.ts`
- **Error responses:**
  - `503` — `{ error: "Magic link sign-in is disabled" }`
  - `400` — `{ error: "Email is required" }`
  - `429` — `{ error: "Please wait before requesting another magic link" }`
  - `500` — `{ error: error?.message ?? "Failed to send magic link" }`
- **Notes:**
  - Uses `error?.message` fallback pattern
  - Rate limiting implemented

#### `/api/auth/user` — GET
- **File:** `app/api/auth/user/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Internal server error" }`
- **Notes:**
  - Simple error shape

---

### Wallet Operations

#### `/api/wallet/summary` — GET
- **File:** `app/api/wallet/summary/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `404` — `{ error: "Wallet not found" }`
  - `500` — `{ error: "Failed to fetch wallet summary" }`
- **Notes:**
  - Uses `logger.error` for failures
  - Consistent `{ error: string }` shape

#### `/api/wallet/credit` — POST
- **File:** `app/api/wallet/credit/route.ts`
- **Error responses:**
  - `503` — `{ error: "Wallet feature is disabled" }`
  - `400` — `{ error: "Invalid request", details: validationResult.error.errors }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in" }`
  - `403` — `{ error: "FORBIDDEN", message: "Only admins can credit other users' wallets" }`
  - `404` — `{ error: "Wallet not found" }` (implicit, via wallet creation)
  - `500` — `{ error: "Failed to fetch wallet account" }`, `{ error: "Failed to create wallet account" }`, `{ error: "Failed to create transaction" }`, `{ error: errorMessage }`
- **Notes:**
  - Uses `code`-style error values (`AUTH_REQUIRED`, `FORBIDDEN`)
  - Includes `message` field alongside `error` for user-friendly text
  - Uses `logger.error` for failures
  - Includes `details` for validation errors

#### `/api/wallet/debit` — POST
- **File:** `app/api/wallet/debit/route.ts`
- **Error responses:**
  - `503` — `{ error: "Wallet feature is disabled" }`
  - `400` — `{ error: "Invalid request", details: validationResult.error.errors }`, `{ error: "INSUFFICIENT_BALANCE", message: "...", balance_cents: number }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in" }`
  - `403` — `{ error: "FORBIDDEN", message: "You can only debit your own wallet" }`
  - `404` — `{ error: "WALLET_NOT_FOUND", message: "Wallet account not found" }`
  - `500` — `{ error: "Failed to fetch wallet account" }`, `{ error: "Failed to create transaction" }`, `{ error: error?.message ?? "Failed to debit wallet" }`
- **Notes:**
  - Uses `code`-style error values
  - Includes contextual data (`balance_cents`) in error response
  - Uses `console.error` (not yet migrated to logger)

#### `/api/wallet/cashout` — POST
- **File:** `app/api/wallet/cashout/route.ts`
- **Error responses:**
  - `503` — `{ error: "Wallet feature is disabled" }`, `{ error: "STRIPE_CONNECT_NOT_CONFIGURED", message: "Stripe Connect is not configured" }`
  - `400` — `{ error: "Invalid request", details: validationResult.error.errors }`, `{ error: "INSUFFICIENT_BALANCE", message: "...", balance_cents: number }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in" }`
  - `403` — `{ error: "FORBIDDEN", message: "You can only cash out your own wallet" }`, `{ error: "NOT_OWNER", message: "You must be a family wallet owner to request cash-out" }`
  - `404` — `{ error: "WALLET_NOT_FOUND", message: "Wallet account not found" }`
  - `500` — `{ error: "Failed to verify wallet ownership" }`, `{ error: "Failed to fetch wallet account" }`, `{ error: "Failed to create cash-out request" }`, `{ error: error?.message ?? "Failed to process cash-out request" }`
- **Notes:**
  - Uses `code`-style error values
  - Includes contextual data in error responses
  - Uses `console.error` (not yet migrated to logger)

#### `/api/wallet/family/get` — GET
- **File:** `app/api/wallet/family/get/route.ts`
- **Error responses:**
  - `503` — `{ error: "Family wallet feature is disabled" }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in to view family wallet" }`
  - `500` — `{ error: "Failed to fetch family wallet" }`, `{ error: "Failed to fetch family wallet details" }`, `{ error: error?.message ?? "Failed to get family wallet" }`
- **Notes:**
  - Uses `code`-style error values
  - Returns `{ success: true, data: null }` when no wallet exists (not an error)

#### `/api/wallet/family/invite` — POST
- **File:** `app/api/wallet/family/invite/route.ts`
- **Error responses:**
  - `503` — `{ error: "Family wallet feature is disabled" }`
  - `400` — `{ error: "Email and role are required" }`, `{ error: "Invalid role. Must be 'owner', 'adult', or 'child'" }`, `{ error: "Cannot invite another owner. Only one owner per family wallet." }`, `{ error: "This email is already a member of the family wallet" }`, `{ error: "An invitation has already been sent to this email" }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in to invite members" }`
  - `404` — `{ error: "Family wallet not found. You must be the owner to invite members." }`
  - `500` — `{ error: "Failed to create invitation" }`, `{ error: error?.message ?? "Failed to invite member" }`
- **Notes:**
  - Uses `code`-style error values
  - Detailed business rule error messages

---

### Bookings

#### `/api/book/start` — POST
- **File:** `app/api/book/start/route.ts`
- **Error responses:**
  - `403` — `{ error: "Bookings feature is disabled" }`
  - `400` — `{ error: parsed.error.errors[0]?.message ?? "Invalid booking data" }`, `{ error: "This occurrence is not available for booking" }`, `{ error: "No spots available" }`, `{ error: "Invalid price for this class" }`, `{ error: "The selected reward coupon is no longer valid" }`, `{ error: "The selected reward coupon has expired" }`, `{ error: "The selected reward coupon has reached its redemption limit" }`, `{ error: "Invalid reward coupon" }`
  - `404` — `{ error: "Class or occurrence not found" }`, `{ error: "Class data not found" }`
  - `500` — `{ error: "Server error" }`, `{ error: "Failed to create booking" }`, `{ error: "Failed to validate reward coupon" }`, `{ error: errorMessage }`
- **Notes:**
  - Uses `logger.error` for failures
  - Detailed business rule error messages
  - Uses `parsed.error.errors[0]?.message` for Zod validation (first error only)

#### `/api/book/start-with-wallet` — POST
- **File:** `app/api/book/start-with-wallet/route.ts`
- **Error responses:**
  - `403` — `{ error: "Bookings feature is disabled" }`, `{ error: "Family wallet feature is disabled" }`
  - `400` — Similar to `/api/book/start`
  - `401` — `{ error: "Authentication required" }`
  - `404` — `{ error: "Class or occurrence not found" }`, `{ error: "Class data not found" }`
  - `500` — `{ error: "Server error" }`, `{ error: "Failed to check wallet balance" }`, `{ error: "Failed to create booking" }`, `{ error: error.message || "Internal server error" }`
- **Notes:**
  - Similar patterns to `/api/book/start`
  - Uses `error.message || "Internal server error"` fallback

---

### Referrals

#### `/api/referrals` — GET
- **File:** `app/api/referrals/route.ts`
- **Error responses:**
  - `403` — `{ error: "Referrals feature is not enabled" }`
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Failed to fetch referrals" }`
- **Notes:**
  - Uses `logger.error` for failures
  - Consistent `{ error: string }` shape

#### `/api/referrals` — POST
- **File:** `app/api/referrals/route.ts`
- **Error responses:**
  - `403` — `{ error: "Referrals feature is not enabled" }`
  - `400` — `{ error: "Invalid request", details: validationResult.error.errors }`
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Failed to create referral" }`, `{ error: "Invalid JSON in request body" }`, `{ error: errorMessage }`
- **Notes:**
  - Uses `logger.error` for failures
  - Includes `details` for validation errors
  - Handles JSON parsing errors separately

#### `/api/referral/create` — POST
- **File:** `app/api/referral/create/route.ts`
- **Error responses:**
  - `400` — `{ error: "Valid email address required." }`, `{ error: "You cannot refer yourself." }`
  - `401` — `{ error: "Unauthorized. Please sign in to create a referral." }`
  - `409` — `{ error: "Referral already exists for this email." }`
  - `429` — `{ error: rateLimitResult.error }`
  - `500` — `{ error: "Server configuration error." }`, `{ error: "Failed to generate referral code. Please try again." }`, `{ error: "Failed to create referral." }`, `{ error: "Internal server error." }`
- **Notes:**
  - Uses `409` for duplicate resources
  - Uses `429` for rate limiting
  - Detailed error messages with periods

---

### Reviews

#### `/api/reviews/helpful` — POST
- **File:** `app/api/reviews/helpful/route.ts`
- **Error responses:**
  - `403` — `{ error: "Reviews feature is not enabled" }`
  - `400` — `{ error: "review_id and is_helpful (boolean) are required" }`
  - `404` — `{ error: "Review not found" }`
  - `500` — `{ error: "Failed to vote: ${errorMessage}" }`
- **Notes:**
  - Uses `logger.error` for failures
  - Template string in error message

#### `/api/reviews/helpful` — GET
- **File:** `app/api/reviews/helpful/route.ts`
- **Error responses:**
  - `403` — `{ error: "Reviews feature is not enabled" }`
  - `400` — `{ error: "review_id is required" }`
  - `500` — `{ error: "Failed to get vote: ${errorMessage}" }`
- **Notes:**
  - Uses `logger.error` for failures

#### `/api/reviews/report` — POST
- **File:** `app/api/reviews/report/route.ts`
- **Error responses:**
  - `403` — `{ error: "Reviews feature is not enabled" }`
  - `400` — `{ error: "review_id and report_type are required" }`, `{ error: "report_type must be one of: ${validReportTypes.join(", ")}" }`, `{ error: "You have already reported this review" }`
  - `404` — `{ error: "Review not found" }`
  - `500` — `{ error: "Failed to submit report: ${insertError.message}" }`, `{ error: "Failed to submit report: ${errorMessage}" }`
- **Notes:**
  - Uses `logger.error` for failures
  - Includes database error message in response

#### `/api/reviews/booking-status/[bookingId]` — GET
- **File:** `app/api/reviews/booking-status/[bookingId]/route.ts`
- **Error responses:**
  - `403` — `{ error: "Reviews feature is not enabled" }`
  - `400` — `{ error: "bookingId is required" }`
  - `404` — `{ error: "Booking not found" }`
  - `500` — `{ error: "Failed to get booking status: ${errorMessage}" }`
- **Notes:**
  - Uses `logger.error` for failures

---

### Search

#### `/api/search` — GET
- **File:** `app/api/search/route.ts`
- **Error responses:**
  - `500` — `{ results: [], error: errorMessage }`
- **Notes:**
  - Uses `logger.error` and `logger.warn` for failures
  - Returns empty results array with error message (doesn't fail completely)
  - Error included in success-shaped response

---

### Rewards

#### `/api/rewards/redeem` — POST
- **File:** `app/api/rewards/redeem/route.ts`
- **Error responses:**
  - `403` — `{ error: "Rewards feature is not enabled" }`
  - `400` — `{ error: "reward_id is required" }`
  - `401` — `{ error: "Unauthorized" }`
  - `404` — `{ error: "Reward not found or not available" }`
  - `500` — `{ error: "Failed to create Stripe coupon" }`, `{ error: "Failed to redeem reward" }`, `{ error: error.message || "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)
  - Uses `error.message || "Internal server error"` fallback

#### `/api/rewards/validate-coupon` — GET
- **File:** `app/api/rewards/validate-coupon/route.ts`
- **Error responses:**
  - `400` — `{ valid: false, error: "Coupon ID is required" }`
  - `200` — `{ valid: false, error: "This coupon is no longer valid" }`, `{ valid: false, error: "This coupon has expired" }`, `{ valid: false, error: "This coupon has reached its redemption limit" }`, `{ valid: false, error: "Coupon not found" }`
  - `500` — `{ valid: false, error: "Failed to validate coupon" }`, `{ valid: false, error: error.message || "Internal server error" }`
- **Notes:**
  - Unique error shape: `{ valid: boolean, error?: string }`
  - Returns `200` with `valid: false` for business logic errors (not `400`)

---

### Family & Children

#### `/api/family/children` — GET
- **File:** `app/api/family/children/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Supabase not configured" }`, `{ error: "Failed to fetch children" }`, `{ error: "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)

#### `/api/family/children` — POST
- **File:** `app/api/family/children/route.ts`
- **Error responses:**
  - `400` — `{ error: "Invalid request", details: error.errors }` (Zod validation)
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Supabase not configured" }`, `{ error: "Failed to create profile" }`, `{ error: "Failed to create child" }`, `{ error: "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)
  - Includes `details` for validation errors

#### `/api/family/profile` — GET
- **File:** `app/api/family/profile/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Supabase not configured" }`, `{ error: "Failed to fetch profile" }`, `{ error: "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)

#### `/api/family/profile` — POST
- **File:** `app/api/family/profile/route.ts`
- **Error responses:**
  - `400` — `{ error: "Invalid request", details: error.errors }` (Zod validation)
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Supabase not configured" }`, `{ error: "Failed to update profile" }`, `{ error: "Failed to create profile" }`, `{ error: "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)
  - Includes `details` for validation errors

---

### Classes & Questions

#### `/api/classes/[id]/questions` — GET
- **File:** `app/api/classes/[id]/questions/route.ts`
- **Error responses:**
  - `400` — `{ error: "Invalid class ID" }`
  - `200` — `{ questions: [] }` (returns empty array on error, doesn't fail)
- **Notes:**
  - Graceful degradation: returns empty array instead of error
  - Uses `console.error` (not yet migrated to logger)

#### `/api/classes/[id]/questions` — POST
- **File:** `app/api/classes/[id]/questions/route.ts`
- **Error responses:**
  - `403` — `{ error: "Q&A feature is disabled" }`
  - `400` — `{ error: "Invalid class ID" }`, `{ error: parsed.error.errors[0]?.message ?? "Invalid question" }`, `{ error: "Rate limit exceeded. Please try again later." }`, `{ error: "Question contains inappropriate content" }`
  - `401` — `{ error: "Authentication required" }`
  - `404` — `{ error: "Class not found" }`
  - `429` — `{ error: "Rate limit exceeded. Please try again later." }`
  - `500` — `{ error: "Server error" }`, `{ error: "Failed to create question" }`, `{ error: "Internal server error" }`
- **Notes:**
  - Uses `429` for rate limiting
  - Uses `console.error` (not yet migrated to logger)

---

### Calendar

#### `/api/calendar/enable` — POST
- **File:** `app/api/calendar/enable/route.ts`
- **Error responses:**
  - `503` — `{ error: "Calendar sync is not enabled" }`
  - `401` — `{ error: "AUTH_REQUIRED", message: "Please sign in to enable calendar sync" }`
  - `500` — `{ error: "Failed to enable calendar sync" }`, `{ error: error?.message ?? "Failed to enable calendar sync" }`
- **Notes:**
  - Uses `code`-style error values
  - Uses `console.error` (not yet migrated to logger)

---

### Admin

#### `/api/admin/verifications` — GET
- **File:** `app/api/admin/verifications/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Server configuration error" }`, `{ error: "Failed to fetch verifications" }`, `{ error: error.message || "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)

#### `/api/admin/verifications` — POST
- **File:** `app/api/admin/verifications/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `400` — `{ error: "verification_id and action are required" }`, `{ error: "Invalid action. Must be: approve or reject" }`
  - `404` — `{ error: "Verification not found" }`
  - `500` — `{ error: "Server configuration error" }`, `{ error: "Failed to update verification" }`, `{ error: error.message || "Internal server error" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)

#### `/api/admin/rewards` — GET
- **File:** `app/api/admin/rewards/route.ts`
- **Error responses:**
  - `401` — `{ error: "Unauthorized" }`
  - `500` — `{ error: "Failed to fetch rewards" }`
- **Notes:**
  - Uses `console.error` (not yet migrated to logger)

---

### Health & System

#### `/api/health` — GET
- **File:** `app/api/health/route.ts`
- **Error responses:**
  - `503` — Returns `{ ok: false, ... }` with detailed health check failures
- **Notes:**
  - Unique response shape: `{ ok: boolean, timestamp: string, checks: HealthCheck[], summary: {...} }`
  - Not a standard error response; includes detailed diagnostic information

#### `/api/og-image` — GET
- **File:** `app/api/og-image/route.tsx`
- **Error responses:**
  - `500` — `new Response("Failed to generate image", { status: 500 })` (plain text, not JSON)
- **Notes:**
  - Returns plain text error, not JSON
  - Uses `console.error` (not yet migrated to logger)

---

### Stripe Webhooks

#### `/api/stripe/webhook` — POST
- **File:** `app/api/stripe/webhook/route.ts`
- **Error responses:**
  - `404` — `{ error: "Not found" }`
  - `400` — `{ error: "Invalid signature" }`, `{ error: "No customer email" }`, `{ error: "Invalid occurrence_id" }`
  - `500` — `{ error: "Webhook secret not configured" }`, `{ error: "Failed to create booking" }`, `{ error: error instanceof Error ? error.message : "Webhook processing failed" }`
- **Notes:**
  - Uses `logger.error` for one instance (partially migrated)
  - Many `console.error` calls remain
  - Has Bucket C comment for webhook payload type

---

## 3. Inconsistency Matrix

### Error Key Inconsistencies

**Pattern 1: `{ error: string }` (Most Common)**
- Used in: ~85% of routes
- Examples: `/api/wallet/summary`, `/api/referrals`, `/api/reviews/helpful`
- **Consistency:** High

**Pattern 2: `{ error: string, message: string }` (Wallet/Auth Routes)**
- Used in: ~15% of routes (primarily wallet and auth)
- Examples: `/api/wallet/credit`, `/api/wallet/debit`, `/api/calendar/enable`
- **Inconsistency:** Some routes use `error` as code, others use it as message
- **Issue:** `error` field serves dual purpose (code vs. message)

**Pattern 3: `{ message: string }` (Rare)**
- Used in: ~5% of routes
- Examples: Some legacy routes
- **Inconsistency:** Different primary field name

**Pattern 4: `{ valid: boolean, error?: string }` (Validation Endpoints)**
- Used in: `/api/rewards/validate-coupon`
- **Inconsistency:** Unique shape for validation endpoints

**Pattern 5: `{ error: string, details: array }` (Validation Errors)**
- Used in: Routes using Zod validation
- Examples: `/api/wallet/credit`, `/api/referrals`, `/api/family/children`
- **Inconsistency:** `details` field name varies (sometimes `details`, sometimes `errors`)

**Pattern 6: `{ error: string, balance_cents?: number }` (Contextual Errors)**
- Used in: Wallet operations
- Examples: `/api/wallet/debit`, `/api/wallet/cashout`
- **Inconsistency:** Some errors include contextual data, others don't

### Status Code Inconsistencies

**Issue 1: Feature Disabled Responses**
- Some routes use `403` for feature flags: `{ error: "Feature is not enabled" }`
- Some routes use `503` for feature flags: `{ error: "Feature is disabled" }`
- **Inconsistency:** Same logical condition, different status codes
- **Examples:**
  - `403`: `/api/reviews/helpful`, `/api/reviews/report`
  - `503`: `/api/wallet/credit`, `/api/wallet/debit`, `/api/calendar/enable`

**Issue 2: Validation Errors**
- Most routes use `400` for validation errors
- Some routes might use `422` (not observed in sample, but possible)
- **Inconsistency:** HTTP spec suggests `422` for semantic validation, but codebase uses `400`

**Issue 3: Unauthorized vs. Forbidden**
- `401` used for: Missing/invalid authentication
- `403` used for: Authorization failures AND feature flags
- **Inconsistency:** `403` is overloaded (authorization + feature flags)

**Issue 4: Not Found Patterns**
- Most routes use `404` consistently
- Some routes return empty arrays instead of `404` (e.g., `/api/classes/[id]/questions` GET)
- **Inconsistency:** Graceful degradation vs. explicit error

### Validation / Field Errors

**Current State:**
- Most validation errors return flat string: `{ error: "Invalid request" }`
- Zod validation errors include `details`: `{ error: "Invalid request", details: validationResult.error.errors }`
- No routes use structured `fieldErrors: { fieldName: ["error1"] }` pattern
- **Inconsistency:** Validation error detail level varies

### Code Field Inconsistencies

**Routes using code-style errors:**
- `/api/wallet/credit`: `AUTH_REQUIRED`, `FORBIDDEN`
- `/api/wallet/debit`: `AUTH_REQUIRED`, `FORBIDDEN`, `WALLET_NOT_FOUND`, `INSUFFICIENT_BALANCE`
- `/api/wallet/cashout`: `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_OWNER`, `WALLET_NOT_FOUND`, `INSUFFICIENT_BALANCE`, `STRIPE_CONNECT_NOT_CONFIGURED`
- `/api/calendar/enable`: `AUTH_REQUIRED`

**Routes NOT using code-style errors:**
- `/api/referrals`: Plain strings
- `/api/reviews/*`: Plain strings
- `/api/family/*`: Plain strings

**Inconsistency:** ~15% of routes use machine-readable codes, ~85% use human-readable strings only

### Error Message Style Inconsistencies

**Punctuation:**
- Some routes include periods: `"Failed to create referral."`
- Some routes don't: `"Failed to create referral"`
- **Inconsistency:** No standard punctuation style

**Capitalization:**
- Most routes use sentence case: `"Invalid request"`
- Some use title case: `"AUTH_REQUIRED"` (when used as code)
- **Inconsistency:** Mixed styles

### Logging Inconsistencies

**Routes using `logger.error` (standardized):**
- `/api/wallet/summary`
- `/api/wallet/credit`
- `/api/referrals`
- `/api/search`
- `/api/book/start`
- `/api/reviews/helpful`
- `/api/reviews/booking-status/[bookingId]`
- `/api/reviews/report`
- `/api/stripe/webhook` (partially)

**Routes using `console.error` (not yet standardized):**
- `/api/wallet/debit`
- `/api/wallet/cashout`
- `/api/wallet/family/get`
- `/api/wallet/family/invite`
- `/api/family/children`
- `/api/family/profile`
- `/api/classes/[id]/questions`
- `/api/calendar/enable`
- `/api/admin/verifications`
- `/api/admin/rewards`
- `/api/rewards/redeem`
- `/api/referral/create`
- `/api/account/delete`
- And many more...

**Inconsistency:** ~50% of routes use standardized logging, ~50% still use `console.error`

---

## 4. Proposed Unified Error Schema v2 (Design Only)

### Base Error Shape

```typescript
interface ErrorResponseV2 {
  // Machine-readable error code (required)
  code: string;
  
  // Human-readable error message (required)
  message: string;
  
  // HTTP status code (required, matches response status)
  status: number;
  
  // Optional additional context
  details?: Record<string, unknown>;
  
  // Optional field-level validation errors
  fieldErrors?: Record<string, string[]>;
  
  // Whether client can safely retry this request
  retryable?: boolean;
  
  // Request ID for logging/tracing (if available)
  requestId?: string;
}
```

### Error Code Taxonomy

**Authentication & Authorization:**
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Authorization failed (403)
- `FEATURE_DISABLED` - Feature flag disabled (503)

**Validation:**
- `VALIDATION_ERROR` - General validation failure (400)
- `MISSING_REQUIRED_FIELD` - Required field missing (400)
- `INVALID_FORMAT` - Format validation failed (400)

**Resources:**
- `NOT_FOUND` - Resource not found (404)
- `ALREADY_EXISTS` - Duplicate resource (409)
- `CONFLICT` - Business rule conflict (409)

**Business Logic:**
- `INSUFFICIENT_BALANCE` - Wallet balance insufficient (400)
- `NOT_AVAILABLE` - Resource not available (400)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)

**System:**
- `INTERNAL_ERROR` - Unexpected server error (500)
- `SERVICE_UNAVAILABLE` - Service not configured (503)
- `DATABASE_ERROR` - Database operation failed (500)

### Example Mappings

**Current:** `{ error: "Unauthorized" }` (401)
**Proposed:** 
```json
{
  "code": "UNAUTHORIZED",
  "message": "You must be logged in to access this resource.",
  "status": 401,
  "retryable": false
}
```

**Current:** `{ error: "AUTH_REQUIRED", message: "Please sign in" }` (401)
**Proposed:**
```json
{
  "code": "UNAUTHORIZED",
  "message": "Please sign in",
  "status": 401,
  "retryable": false
}
```

**Current:** `{ error: "Invalid request", details: [...] }` (400)
**Proposed:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "The request contains invalid data.",
  "status": 400,
  "fieldErrors": {
    "email": ["Email is required", "Email must be valid"],
    "age": ["Age must be between 0 and 18"]
  },
  "retryable": false
}
```

**Current:** `{ error: "WALLET_NOT_FOUND", message: "Wallet account not found" }` (404)
**Proposed:**
```json
{
  "code": "NOT_FOUND",
  "message": "Wallet account not found",
  "status": 404,
  "details": {
    "resourceType": "wallet"
  },
  "retryable": false
}
```

**Current:** `{ error: "INSUFFICIENT_BALANCE", message: "...", balance_cents: 1000 }` (400)
**Proposed:**
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance. Available: £10.00, Requested: £25.00",
  "status": 400,
  "details": {
    "availableBalanceCents": 1000,
    "requestedAmountCents": 2500
  },
  "retryable": false
}
```

**Current:** `{ valid: false, error: "Coupon not found" }` (200)
**Proposed:**
```json
{
  "code": "NOT_FOUND",
  "message": "Coupon not found",
  "status": 404,
  "details": {
    "resourceType": "coupon"
  },
  "retryable": false
}
```

### Backwards Compatibility

The proposed schema is designed to be backwards-compatible via adapters:

```typescript
// Adapter function (future implementation)
function adaptErrorV2ToV1(errorV2: ErrorResponseV2): { error: string } {
  return { error: errorV2.message };
}

// Or maintain both fields during transition
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  options?: { details?: Record<string, unknown>; fieldErrors?: Record<string, string[]> }
): ErrorResponseV2 & { error: string } {
  return {
    code,
    message,
    status,
    error: message, // Legacy field for backwards compatibility
    ...options,
  };
}
```

---

## 5. Migration Strategy (Future Work Only)

### Phase 1: Infrastructure (Non-Breaking)

1. **Create central error helper** (`lib/api-errors.ts`):
   ```typescript
   export function createErrorResponse(
     code: string,
     message: string,
     status: number,
     options?: ErrorResponseOptions
   ): ErrorResponseV2 & { error: string } {
     // Returns both v2 and v1 fields for backwards compatibility
   }
   ```

2. **Update server logger** to accept error codes and request IDs

3. **Add request ID middleware** to generate traceable request IDs

### Phase 2: Gradual Migration (Non-Breaking)

1. **For new routes:**
   - Immediately adopt Error Schema v2
   - Use `createErrorResponse` helper

2. **For existing routes:**
   - Start using `createErrorResponse` internally
   - Keep returning `{ error: string }` shape (v1) to clients
   - Add `code` and other v2 fields internally for logging

3. **Add version negotiation:**
   - Support `Accept: application/vnd.parenthelper.v2+json` header
   - Return v2 schema when header present
   - Default to v1 for backwards compatibility

### Phase 3: Frontend Migration

1. **Update API client** to:
   - Send `Accept: application/vnd.parenthelper.v2+json` header
   - Parse v2 error responses
   - Fall back to v1 parsing if v2 not available

2. **Update error handling** to use `code` field for machine-readable error detection

3. **Update UI** to display `message` field with proper formatting

### Phase 4: Full Migration (Breaking Change)

1. **Remove v1 compatibility** after all clients updated
2. **Standardize all routes** to use v2 schema exclusively
3. **Update documentation** and API contracts

### Migration Principles

- **No breaking changes** until Phase 4
- **Gradual rollout** route by route
- **Feature flags** for v2 error responses
- **Monitoring** to track v1 vs. v2 usage
- **Client SDK updates** coordinated with API changes

---

## 6. Risk Observations

### Security & Privacy

1. **Error message leakage:**
   - Some routes include database error messages: `{ error: "Failed to submit report: ${insertError.message}" }`
   - **Risk:** May expose internal implementation details
   - **Recommendation:** Sanitize database errors before returning to client

2. **Stack traces:**
   - No routes observed returning stack traces (good)
   - Some routes log full error objects which may contain sensitive data

3. **PII in error messages:**
   - Most error messages are safe (no email addresses, user IDs exposed)
   - Some contextual errors include amounts/IDs which are acceptable

### Consistency Risks

1. **Feature flag errors:**
   - Mixed use of `403` vs. `503` for disabled features
   - **Risk:** Clients may handle these differently
   - **Recommendation:** Standardize on `503` for feature flags, `403` for authorization

2. **Validation error detail:**
   - Some routes return detailed validation errors, others return generic messages
   - **Risk:** Inconsistent user experience
   - **Recommendation:** Always include field-level errors for validation failures

3. **Rate limiting:**
   - Some routes implement rate limiting, others don't
   - **Risk:** Inconsistent protection against abuse
   - **Recommendation:** Apply rate limiting consistently across write operations

---

## 7. Summary of Findings

### Strengths

1. **High consistency** in basic error shape: `{ error: string }` used in ~85% of routes
2. **Appropriate status codes** for most scenarios
3. **Good separation** between authentication (401) and authorization (403) in most cases
4. **Logging standardization** in progress (~50% migrated to `logger.error`)

### Weaknesses

1. **Dual-purpose `error` field:** Sometimes a code (`AUTH_REQUIRED`), sometimes a message (`"Unauthorized"`)
2. **Inconsistent feature flag handling:** `403` vs. `503` for same logical condition
3. **Missing machine-readable codes:** Only ~15% of routes use structured error codes
4. **Inconsistent validation error detail:** Some routes include field-level errors, others don't
5. **Mixed logging:** ~50% still using `console.error` instead of standardized logger
6. **No request tracing:** No request IDs for correlating errors across services

### Opportunities

1. **Unified error schema** would improve:
   - Client-side error handling
   - API documentation
   - Error monitoring and analytics
   - Internationalization (i18n) support

2. **Structured validation errors** would improve:
   - Form validation UX
   - Error display consistency
   - Accessibility (field-level error announcements)

3. **Request IDs** would improve:
   - Debugging production issues
   - Error correlation
   - Support ticket resolution

---

## Appendix: Complete Route List

Due to the large number of routes (203 files), a complete per-route breakdown would be impractical. The patterns documented above are representative of the codebase. Key route categories include:

- **Authentication:** `/api/auth/*`
- **Wallet:** `/api/wallet/*`, `/api/wallet/family/*`
- **Bookings:** `/api/book/*`
- **Referrals:** `/api/referrals/*`, `/api/referral/*`
- **Reviews:** `/api/reviews/*`
- **Search:** `/api/search/*`
- **Rewards:** `/api/rewards/*`
- **Family:** `/api/family/*`
- **Classes:** `/api/classes/*`
- **Admin:** `/api/admin/*`
- **Provider:** `/api/provider/*`
- **Cron:** `/api/cron/*`
- **Analytics:** `/api/analytics/*`
- **Blog:** `/api/blog/*`
- **Calendar:** `/api/calendar/*`
- **Videos:** `/api/videos/*`
- **And many more...**

Each category generally follows similar patterns within itself, but patterns vary across categories.

---

**Document Status:** Read-only analysis complete. No code changes made. This document serves as a reference for future API error standardization work.

