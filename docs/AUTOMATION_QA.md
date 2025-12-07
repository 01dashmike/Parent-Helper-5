# Automation System QA Checklist

## Parent Flows

### Booking Reminder
- [ ] Create booking 24-30h in future
- [ ] Run daily cron endpoint manually
- [ ] Email sent, logged, visible in notification_events
- [ ] Reminder not sent twice for same booking
- [ ] User with transactional opt-out does not receive reminder

### Lapsed Reactivation
- [ ] Create user + past booking >45 days ago
- [ ] No recent bookings
- [ ] Run daily cron
- [ ] Marketing email sent once
- [ ] Not sent more than every 30 days
- [ ] User with marketing opt-out does not receive email

### Cancellation Suggestions
- [ ] Provider cancels a booking
- [ ] Alternative classes suggested
- [ ] Template filled correctly
- [ ] Email sent to parent
- [ ] Logged in notification_events

## Provider Flows

### Weekly Digest
- [ ] Provider with some views/bookings
- [ ] Run weekly cron
- [ ] Email summarises 7-day stats correctly
- [ ] Includes views, bookings, revenue, top class
- [ ] Provider with marketing opt-out does not receive

### Onboarding Nudge
- [ ] Provider stuck at Step 3
- [ ] 2+ days old
- [ ] Nudge email sent
- [ ] 7-day nudge sent if still incomplete
- [ ] Not sent more than once per week

## Settings & Opt-out

- [ ] Toggle marketing off → reactivation email not sent
- [ ] Toggle booking reminders off → future reminders not sent
- [ ] All still receive essential transactional emails (confirmations)
- [ ] Settings persist across sessions

## Admin UI

- [ ] Can view all automation flows
- [ ] Can enable/disable flows
- [ ] Can view flow details
- [ ] Can see recent runs
- [ ] Can see notification events
- [ ] Test send button works

## Edge Cases

- [ ] Flow disabled → no emails sent
- [ ] Template missing → graceful failure, logged
- [ ] Email service down → logged as failed, flow continues
- [ ] User deleted → notifications skipped gracefully
- [ ] Invalid booking → no reminder sent





