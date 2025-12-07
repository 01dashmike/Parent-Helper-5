# Booking Flow End-to-End Fixes

## Files Changed

1. **`app/api/book/start/route.ts`**
   - Fixed: Store both `stripe_checkout_session_id` and `stripe_payment_intent_id` when creating Stripe checkout session
   - Ensures thank-you page can find booking by checkout session ID

2. **`app/api/book/webhook/route.ts`**
   - Fixed: Store `stripe_checkout_session_id` in both `bookings` table and `booking_requests` table
   - Ensures thank-you page can find booking after Stripe redirects back
   - Added checkout session ID to booking request update

3. **`app/book/thank-you/page.tsx`**
   - Fixed: Query booking by both `stripe_checkout_session_id` and `stripe_payment_intent_id` (backwards compatibility)
   - Handles both wallet payments (via `booking_id`) and Stripe payments (via `session_id`)

4. **`components/book/ThankYouClient.tsx`**
   - Fixed: Added `class_id` field to `bookingRequest` type definition
   - Prevents TypeScript error when rendering "View Class" link

5. **`app/book/checkout/page.tsx`**
   - Fixed: Added validation for numeric classId and occurrenceId
   - Prevents errors from invalid URL parameters
   - Improved error handling for missing booking information

## Explanation of Fixes

### Issue 1: Stripe Checkout Session ID Not Stored
**Problem:** The checkout page redirected to Stripe, which then redirected back with `session_id={CHECKOUT_SESSION_ID}`, but the webhook and start route only stored `stripe_payment_intent_id`, not the checkout session ID.

**Fix:** 
- Updated `/api/book/start` to store both `stripe_checkout_session_id` and `stripe_payment_intent_id`
- Updated webhook to store `stripe_checkout_session_id` in both `bookings` and `booking_requests` tables
- Updated thank-you page to query by both fields for backwards compatibility

### Issue 2: Thank-You Page Couldn't Find Booking
**Problem:** After Stripe redirect, the thank-you page queried `booking_requests` by `stripe_payment_intent_id`, but Stripe sends the checkout session ID, not the payment intent ID.

**Fix:**
- Updated `getBookingDetails()` to query by `stripe_checkout_session_id` first, with fallback to `stripe_payment_intent_id`
- Ensures bookings can be found regardless of which ID is stored

### Issue 3: Missing class_id in Type Definition
**Problem:** `ThankYouClient` component referenced `bookingDetails.bookingRequest.class_id` but the type didn't include this field.

**Fix:**
- Added `class_id: number` to the `bookingRequest` type in `ThankYouClientProps`
- Prevents TypeScript errors and ensures "View Class" link works

### Issue 4: Invalid URL Parameters
**Problem:** If `classId` or `occurrenceId` were non-numeric strings, `parseInt()` would return `NaN`, causing API errors.

**Fix:**
- Added validation in `useEffect` and `onSubmit` to check if IDs are valid numbers
- Shows error message instead of making invalid API calls
- Prevents crashes from malformed URLs

## Current End-to-End Path

### Stripe Payment Flow:
1. User navigates to `/book/checkout?classId=X&occurrenceId=Y`
2. Checkout page validates IDs and fetches class data
3. User fills form and submits
4. Frontend calls `/api/book/start` with booking details
5. API creates `booking_request` and Stripe checkout session
6. API stores `stripe_checkout_session_id` in `booking_request`
7. User redirected to Stripe checkout
8. After payment, Stripe redirects to `/book/thank-you?session_id={CHECKOUT_SESSION_ID}`
9. Thank-you page queries `booking_requests` by `stripe_checkout_session_id`
10. Webhook receives `checkout.session.completed` event
11. Webhook creates `booking` record and stores `stripe_checkout_session_id`
12. Thank-you page displays booking confirmation

### Wallet Payment Flow:
1. User navigates to `/book/checkout?classId=X&occurrenceId=Y`
2. Checkout page validates IDs and fetches class data
3. User selects "Pay with Wallet" if balance is sufficient
4. User fills form and submits
5. Frontend calls `/api/book/start-with-wallet` with booking details
6. API debits wallet and creates `simple_booking` record
7. API returns `bookingId` (UUID)
8. Frontend redirects to `/book/thank-you?booking_id={UUID}&payment_method=wallet`
9. Thank-you page queries `simple_bookings` by `id`
10. Thank-you page displays booking confirmation

## State Transitions

### Booking Request States:
- `pending` → Created when user submits checkout form
- `confirmed` → Set by webhook after successful payment
- `expired` → Set if booking request expires (30 minutes)

### Booking States:
- `confirmed` → Created by webhook or wallet payment
- `cancelled` → Set if booking is cancelled
- `completed` → Set after class session

## Error Handling

- **Missing IDs:** Shows error message, redirects to home if invalid
- **Invalid IDs:** Validates numeric format before API calls
- **API Errors:** Displays error message from API response
- **Payment Failures:** Shows error, allows retry
- **Wallet Insufficient Balance:** Shows error, suggests card payment
- **Booking Not Found:** Shows friendly error message with support contact

## Payment Logic Preserved

- All Stripe payment logic unchanged
- All wallet payment logic unchanged
- Commission calculation unchanged (7%)
- Coupon/reward application unchanged
- Email notifications unchanged

