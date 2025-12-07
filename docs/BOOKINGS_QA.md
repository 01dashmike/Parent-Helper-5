# Booking System - QA Checklist

## ✅ Pre-Deployment Testing

### Database

- [ ] Migration runs successfully
- [ ] All tables created with correct indexes
- [ ] Foreign keys work correctly
- [ ] Check constraints enforce data integrity
- [ ] Update triggers fire correctly

### Core Functionality

- [ ] Can generate sessions for a class
- [ ] Can check session availability
- [ ] Can reserve seats (atomic operation)
- [ ] Can release seats on cancellation
- [ ] Prevents overbooking
- [ ] Age validation works

---

## 🧪 Booking Flow Tests

### Drop-in Booking

1. **Select Session**
   - [ ] Calendar displays correctly
   - [ ] Sessions show availability
   - [ ] Can select available session
   - [ ] Cannot select fully booked session
   - [ ] Cannot select past session

2. **Enter Details**
   - [ ] Parent name fields required
   - [ ] Email validation works
   - [ ] Phone optional (unless required by provider)
   - [ ] Can add multiple children
   - [ ] Can remove children (if > 1)
   - [ ] Age validation against class range
   - [ ] Consent checkbox required

3. **Review & Confirm**
   - [ ] Summary shows correct details
   - [ ] Price calculated correctly
   - [ ] Upsells displayed
   - [ ] Can go back to edit
   - [ ] Confirmation works
   - [ ] Redirects to success page

4. **Post-Booking**
   - [ ] Confirmation email sent
   - [ ] Booking appears in provider dashboard
   - [ ] Seats reserved correctly
   - [ ] Analytics events fired

---

### Block Booking

1. **Select Block Option**
   - [ ] Block booking option appears (if enabled)
   - [ ] Can select number of weeks
   - [ ] Shows discount if applicable

2. **Availability Check**
   - [ ] Checks all future sessions
   - [ ] Fails if any session unavailable
   - [ ] Shows clear error message

3. **Create Block**
   - [ ] Reserves seats for all sessions
   - [ ] Creates booking with linked sessions
   - [ ] Price calculated correctly
   - [ ] Confirmation shows all dates

---

### Free RSVP

1. **Free Class Booking**
   - [ ] Shows "Free RSVP" badge
   - [ ] No payment required
   - [ ] Price shows as £0.00
   - [ ] Booking created successfully
   - [ ] Confirmation email sent

---

## 🎯 Upsell Tests

### Upsell Display

- [ ] Upsells appear in checkout
- [ ] Only enabled upsells shown
- [ ] Class-specific upsells shown
- [ ] Provider-wide upsells shown
- [ ] Prices display correctly
- [ ] Descriptions show

### Upsell Selection

- [ ] Can select/deselect upsells
- [ ] Price updates in summary
- [ ] Multiple upsells can be selected
- [ ] Total includes upsell prices

### Upsell Analytics

- [ ] Views tracked when displayed
- [ ] Acceptances tracked when selected
- [ ] Analytics stored in database
- [ ] Provider can view upsell performance

---

## 📧 Email Tests

### Confirmation Email

- [ ] Sent immediately on booking
- [ ] Contains correct booking details
- [ ] Shows session date/time
- [ ] Shows location
- [ ] Shows children names
- [ ] Shows price (if paid)
- [ ] Marked as sent in database

### Reminder Email

- [ ] Sent 24 hours before session
- [ ] Contains session details
- [ ] Only sent once per booking
- [ ] Marked as sent in database

### Review Request Email

- [ ] Sent after session end time
- [ ] Contains review link
- [ ] Only sent once per booking
- [ ] Marked as sent in database

---

## 🔐 Security Tests

### Capacity Management

- [ ] Cannot book more seats than available
- [ ] Atomic reservation prevents race conditions
- [ ] Concurrent bookings handled correctly
- [ ] Overbooking impossible

### Age Validation

- [ ] Rejects if child too young
- [ ] Rejects if child too old
- [ ] Clear error message shown
- [ ] Validation happens server-side

### Provider Protection

- [ ] Provider cannot book own class
- [ ] Error message shown if attempted
- [ ] Check happens server-side

### Data Security

- [ ] No payment info in client
- [ ] All processing server-side
- [ ] Sensitive data not logged
- [ ] Email addresses protected

---

## 📊 Analytics Tests

### Event Tracking

- [ ] `booking_started` fires on checkout start
- [ ] `booking_completed` fires on confirmation
- [ ] `upsell_viewed` fires when displayed
- [ ] `upsell_accepted` fires when selected
- [ ] `block_booking_selected` fires for blocks
- [ ] Events include correct data
- [ ] Events stored in analytics system

### Provider Dashboard Metrics

- [ ] Total bookings count correct
- [ ] Revenue calculated correctly
- [ ] Conversion rate accurate
- [ ] Metrics update in real-time

---

## 🎨 UI/UX Tests

### Mobile Experience

- [ ] Calendar works on mobile
- [ ] Forms usable on small screens
- [ ] Buttons appropriately sized
- [ ] Text readable
- [ ] Touch targets adequate

### Desktop Experience

- [ ] Layout looks good
- [ ] Forms easy to fill
- [ ] Navigation clear
- [ ] Progress bar visible

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen readers supported
- [ ] Focus states visible
- [ ] ARIA labels present

---

## 🔄 Integration Tests

### Class Detail Page

- [ ] "Book Now" button appears
- [ ] Links to booking flow
- [ ] Shows availability status
- [ ] Disabled if fully booked

### Provider Dashboard

- [ ] Bookings section visible
- [ ] Can view upcoming sessions
- [ ] Can filter bookings
- [ ] Can mark attendance
- [ ] Can cancel bookings
- [ ] CSV export works

### Email Integration

- [ ] Emails send successfully
- [ ] Templates render correctly
- [ ] Links work in emails
- [ ] Email client configured

---

## 🐛 Edge Cases

### Capacity Edge Cases

- [ ] Last seat booking works
- [ ] Concurrent last seat attempts handled
- [ ] Capacity = 0 handled
- [ ] Negative capacity prevented

### Date Edge Cases

- [ ] Past sessions not bookable
- [ ] Sessions starting now handled
- [ ] Timezone issues resolved
- [ ] Daylight saving handled

### Data Edge Cases

- [ ] Empty children array handled
- [ ] Missing parent email handled
- [ ] Special characters in names
- [ ] Very long notes handled

### Error Handling

- [ ] Network errors handled gracefully
- [ ] Database errors show user-friendly message
- [ ] Validation errors clear
- [ ] No sensitive error details exposed

---

## 🚀 Performance Tests

### Load Testing

- [ ] Handles 100 concurrent bookings
- [ ] No race conditions
- [ ] Database queries optimized
- [ ] Page load times acceptable

### Database Performance

- [ ] Indexes used correctly
- [ ] Queries fast (< 100ms)
- [ ] No N+1 queries
- [ ] Connection pooling works

---

## 📱 Browser Tests

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet

---

## ✅ Sign-Off

**Tested by:** _______________

**Date:** _______________

**Status:** ☐ Pass  ☐ Fail  ☐ Needs Review

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🔄 Regression Tests

After any changes, verify:

- [ ] Existing bookings still work
- [ ] Provider dashboard still functions
- [ ] Email sending still works
- [ ] Analytics still tracks
- [ ] No breaking changes

---

## 📝 Known Issues

List any known issues or limitations:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________





