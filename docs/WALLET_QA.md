# Wallet System QA Checklist

## Test Cases

### Credit Purchase

- [ ] Can purchase 5-credit pack
- [ ] Can purchase 10-credit pack
- [ ] Can purchase 20-credit pack
- [ ] Payment flow completes successfully
- [ ] Credits are added to wallet after payment
- [ ] Ledger entry is created
- [ ] Wallet balance updates correctly

### Credit Usage

- [ ] Can view credit balance on wallet page
- [ ] Can see transaction history
- [ ] Can use credits to book eligible class
- [ ] Credits are deducted when booking is created
- [ ] Ledger entry shows credit spend
- [ ] Cannot book with insufficient credits (error shown)

### Unlimited Passes

- [ ] Provider can enable unlimited passes
- [ ] Parent can purchase weekly pass
- [ ] Parent can purchase monthly pass
- [ ] Pass shows as active on wallet page
- [ ] Can use pass to book class (free)
- [ ] Pass expiry date is correct
- [ ] Cannot use expired pass

### Provider Settings

- [ ] Provider can enable/disable credit acceptance
- [ ] Provider can set credit cost per class
- [ ] Provider can configure unlimited pass pricing
- [ ] Settings save correctly
- [ ] Per-class overrides work (future)

### Booking Integration

- [ ] Credit banner appears on booking page if eligible
- [ ] Pass banner appears if active pass exists
- [ ] Can select "Use Credits" option
- [ ] Can select "Use Pass" option
- [ ] Booking completes successfully with credits
- [ ] Booking completes successfully with pass
- [ ] Redemption record is created
- [ ] Confirmation email sent

### Edge Cases

- [ ] Provider disables credits → banner doesn't show
- [ ] Class doesn't accept credits → banner doesn't show
- [ ] Insufficient credits → error message shown
- [ ] Expired pass → cannot use
- [ ] Booking cancellation → credits refunded (if applicable)
- [ ] Pass-based booking → no refund (time-based)

### Analytics

- [ ] Wallet purchase events tracked
- [ ] Credit spend events tracked
- [ ] Pass purchase events tracked
- [ ] Pass usage events tracked

### Mobile

- [ ] Wallet page responsive
- [ ] Buy credits page responsive
- [ ] Credit banner visible on mobile booking flow
- [ ] All buttons accessible

## Regression Tests

- [ ] Normal paid bookings still work
- [ ] Free RSVP bookings still work
- [ ] Block bookings still work
- [ ] Upsells still work
- [ ] Provider dashboard unaffected
- [ ] No performance degradation





