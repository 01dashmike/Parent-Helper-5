# Booking Real-Time Updates - Test Scenarios

This document describes how to test the real-time booking updates feature.

## Overview

The booking real-time system uses Supabase Realtime channels to notify clients when:
- A booking is created
- A booking is cancelled
- Payment is confirmed

## Setup

1. Ensure Supabase Realtime is enabled in your Supabase project
2. Verify environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Test Scenarios

### Scenario 1: Booking Created (Stripe Payment)

**Steps:**
1. Open the bookings page (`/account/bookings`) in one browser tab
2. In another tab, complete a booking with Stripe payment
3. Complete the Stripe checkout flow

**Expected Result:**
- Toast notification appears: "Booking Created - Your booking has been confirmed!"
- Booking appears in the bookings list (if page is refreshed or list is updated)

**Verification:**
- Check browser console for: `[useBookingUpdates] Subscribed to booking_updates channel`
- Check server logs for: `[booking-realtime] Published booking_created for booking <id>`

### Scenario 2: Booking Created (Wallet Payment)

**Steps:**
1. Open the bookings page (`/account/bookings`) in one browser tab
2. Ensure you have sufficient wallet balance
3. In another tab, complete a booking using wallet payment
4. Complete the booking flow

**Expected Result:**
- Toast notification appears: "Booking Created - Your booking has been confirmed!"
- Toast notification appears: "Payment Confirmed - Payment of £X.XX has been confirmed."

**Verification:**
- Check browser console for subscription confirmation
- Check server logs for both `booking_created` and `payment_confirmed` events

### Scenario 3: Payment Confirmed (Stripe Webhook)

**Steps:**
1. Open the bookings page (`/account/bookings`) in one browser tab
2. Complete a Stripe checkout (can use test mode)
3. Wait for Stripe webhook to process payment

**Expected Result:**
- Toast notification appears: "Payment Confirmed - Payment of £X.XX has been confirmed."

**Verification:**
- Check Stripe webhook logs
- Check server logs for: `[booking-realtime] Published payment_confirmed for booking <id>`

### Scenario 4: Booking Cancelled

**Steps:**
1. Open the bookings page (`/account/bookings`)
2. Have a confirmed booking in the list
3. Cancel the booking (via cancel action or API call)

**Expected Result:**
- Toast notification appears: "Booking Cancelled - Your booking has been cancelled."
- Booking status updates to "cancelled" in the list (without page refresh)

**Verification:**
- Check browser console for real-time event reception
- Check server logs for: `[booking-realtime] Published booking_cancelled for booking <id>`
- Verify booking status changes in UI without refresh

### Scenario 5: Multiple Users (Email Filtering)

**Steps:**
1. Open bookings page for User A (`userA@example.com`)
2. Open bookings page for User B (`userB@example.com`) in another browser/incognito
3. Create a booking for User A

**Expected Result:**
- Only User A receives the toast notification
- User B does not receive any notification

**Verification:**
- Check that events are filtered by email
- Verify only the correct user receives updates

## Manual Testing Checklist

- [ ] Booking created via Stripe shows toast notification
- [ ] Booking created via wallet shows toast notification
- [ ] Payment confirmed shows toast notification
- [ ] Booking cancelled shows toast notification and updates status
- [ ] Multiple users only receive their own updates
- [ ] Subscriptions work across page refreshes
- [ ] Subscriptions clean up on component unmount
- [ ] No console errors when real-time fails (graceful degradation)

## Debugging

### Check Subscription Status

In browser console:
```javascript
// Check if channel is subscribed
// Look for: [useBookingUpdates] Subscribed to booking_updates channel
```

### Check Server Publishing

In server logs:
```
[booking-realtime] Published booking_created for booking <id>
[booking-realtime] Published payment_confirmed for booking <id>
[booking-realtime] Published booking_cancelled for booking <id>
```

### Common Issues

1. **No toast notifications appearing**
   - Check browser console for subscription errors
   - Verify Supabase Realtime is enabled
   - Check network tab for WebSocket connections

2. **Events not being published**
   - Check server logs for errors
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check that publishing code is being executed

3. **Wrong user receiving updates**
   - Verify email filtering is working
   - Check that `userEmail` prop is passed correctly

## Integration with Existing Features

The real-time updates integrate with:
- ✅ Toast notification system (`useToast` hook)
- ✅ Booking list component (updates status in real-time)
- ✅ Server actions (cancellation)
- ✅ Stripe webhook (payment confirmation)
- ✅ Wallet booking flow (creation and payment)

## Performance Considerations

- Real-time subscriptions are lightweight
- Channel automatically unsubscribes on component unmount
- Failed publishing doesn't break main booking flow
- Events are filtered by email to reduce unnecessary updates

