# Referral Tracking Improvements

## Summary

Referral tracking reliability has been significantly improved with a 30-day cookie, client-side tracking, and a unified server action for claiming referrals.

---

## Files Created: 3

### 1. `lib/referrals/claimReferralIfEligible.ts`
**Purpose:** Unified server action to claim referrals reliably

**Features:**
- ✅ Checks referral cookie
- ✅ Validates referral code
- ✅ Prevents self-referrals
- ✅ Handles duplicate referrals gracefully
- ✅ Updates existing referrals with user_id when user signs up
- ✅ Clears cookie after successful claim
- ✅ Returns detailed result with referral ID

**Usage:**
```typescript
const result = await claimReferralIfEligible(userId, userEmail, "signup" | "booking");
if (result.success) {
  // Referral claimed: result.referralId, result.referrerUserId
}
```

---

### 2. `components/referrals/ReferralTracker.tsx`
**Purpose:** Client-side referral click tracking

**Features:**
- ✅ Tracks referral link clicks from URL params (`?ref=CODE`)
- ✅ Stores referral data in sessionStorage for client-side tracking
- ✅ Checks for referral cookie and tracks when set
- ✅ Sends analytics events for referral interactions
- ✅ Non-blocking (never breaks the app)

**Events Tracked:**
- `referral_link_clicked` - When user clicks referral link
- `referral_cookie_set` - When referral cookie is set from `/r/[code]`

---

### 3. `app/api/referrals/check-cookie/route.ts`
**Purpose:** API endpoint to check referral cookie (for client-side tracking)

**Features:**
- ✅ Returns referral code if cookie exists
- ✅ Safe for client-side use (no sensitive data)
- ✅ Silent fail (returns false on error)

---

## Files Modified: 5

### 1. `app/r/[code]/_actions.ts`
**Changes:**
- ✅ Updated cookie expiry from 7 days to **30 days**
- ✅ Cookie settings remain secure (httpOnly, secure in production, sameSite: lax)

**Before:** `maxAge: 7 * 24 * 60 * 60` (7 days)
**After:** `maxAge: 30 * 24 * 60 * 60` (30 days)

---

### 2. `app/account/login/_actions.ts`
**Changes:**
- ✅ Replaced duplicate referral creation logic with `claimReferralIfEligible`
- ✅ Cleaner, more reliable referral claiming
- ✅ Removed redundant code

**Before:** Manual referral creation with duplicate checks
**After:** Uses unified `claimReferralIfEligible` server action

---

### 3. `app/api/stripe/webhook/route.ts`
**Changes:**
- ✅ Added referral claiming before booking creation
- ✅ Links referral to booking via metadata
- ✅ Gets user_id from email before claiming
- ✅ Non-blocking (booking creation continues if referral claim fails)

**Flow:**
1. Get user_id from email
2. Claim referral if eligible
3. Create booking with referral_id in metadata
4. Continue with booking confirmation

---

### 4. `app/api/book/start-with-wallet/route.ts`
**Changes:**
- ✅ Added referral claiming before booking creation
- ✅ Links referral to booking via metadata
- ✅ Non-blocking (booking creation continues if referral claim fails)

**Flow:**
1. Claim referral if eligible
2. Create booking with referral_id in metadata
3. Continue with booking confirmation

---

### 5. `app/layout.tsx`
**Changes:**
- ✅ Added `<ReferralTracker />` component to root layout
- ✅ Tracks referral clicks across entire app
- ✅ Non-intrusive (renders nothing, just tracks)

---

## Referral Pipeline Flow

### 1. Referral Link Click
```
User clicks /r/[CODE]
  ↓
ReferralTracker captures click
  ↓
validateReferralCode sets 30-day cookie
  ↓
Redirect to signup/login
```

### 2. Signup/Login
```
User signs up/logs in
  ↓
claimReferralIfEligible checks cookie
  ↓
Creates member_referral entry
  ↓
Cookie cleared
```

### 3. Booking
```
User creates booking
  ↓
claimReferralIfEligible checks cookie (if not already claimed)
  ↓
Links referral to booking via metadata
  ↓
Referral conversion tracked
```

---

## Improvements

### ✅ Cookie Reliability
- **30-day expiry** (was 7 days)
- **httpOnly** for security
- **Secure** in production
- **sameSite: lax** for cross-site compatibility

### ✅ Client-Side Tracking
- Tracks referral clicks in real-time
- Stores referral data in sessionStorage
- Analytics events for referral interactions
- Non-blocking (never breaks the app)

### ✅ Unified Server Action
- Single source of truth for referral claiming
- Handles all edge cases (self-referral, duplicates, etc.)
- Returns detailed results
- Clears cookie after successful claim

### ✅ Booking Integration
- Referrals automatically linked to bookings
- Works for both Stripe and wallet bookings
- Stored in booking metadata
- Non-blocking (booking succeeds even if referral claim fails)

---

## Testing Checklist

- [x] Referral cookie set with 30-day expiry
- [x] ReferralTracker tracks clicks
- [x] claimReferralIfEligible works for signups
- [x] claimReferralIfEligible works for bookings
- [x] Referrals linked to bookings in metadata
- [x] Self-referrals prevented
- [x] Duplicate referrals handled gracefully
- [x] Cookie cleared after successful claim

---

## API Endpoints

### `GET /api/referrals/check-cookie`
Check if user has referral cookie (for client-side tracking)

**Response:**
```json
{
  "hasReferralCookie": true,
  "referralCode": "ABC123"
}
```

---

## Server Actions

### `claimReferralIfEligible(userId, userEmail, context)`
Claim referral if user is eligible

**Parameters:**
- `userId` - User ID of person being referred
- `userEmail` - Email of person being referred
- `context` - "signup" or "booking"

**Returns:**
```typescript
{ success: true, referralId: string, referrerUserId: string } |
{ success: false, reason: string }
```

---

## Analytics Events

### `referral_link_clicked`
Fired when user clicks referral link with `?ref=CODE`

**Payload:**
```json
{
  "referralCode": "ABC123",
  "path": "/r/ABC123"
}
```

### `referral_cookie_set`
Fired when referral cookie is detected

**Payload:**
```json
{
  "referralCode": "ABC123"
}
```

---

## Notes

- Referral cookie is **httpOnly** (not accessible via JavaScript) for security
- Client-side tracking uses sessionStorage for referral click data
- Referrals are linked to bookings via `metadata.referral_id`
- All referral operations are **non-blocking** (never fail booking/signup)
- Cookie is automatically cleared after successful claim

