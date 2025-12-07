# Marketing Automation System

Automated email and SMS campaigns for onboarding, referrals, and user retention.

## Features

- ✅ **Automated Email Campaigns**: Welcome series, first booking, inactivity re-engagement
- ✅ **SMS Support**: Booking reminders and notifications via Twilio
- ✅ **Automation Rules**: Configurable triggers and actions
- ✅ **Campaign Metrics**: Track opens, clicks, conversions
- ✅ **Admin Dashboard**: Manage campaigns and view performance
- ✅ **Template Variables**: Handlebars-style variables ({{first_name}}, {{wallet_balance}}, {{local_city}})

## Setup

### 1. Enable Feature Flag

Add to your `.env.local`:

```bash
MARKETING_AUTOMATION_ENABLED=true
```

### 2. Run Database Migration

```bash
# Apply the migration
psql $DATABASE_URL -f supabase/migrations/20250116_marketing_automation.sql
psql $DATABASE_URL -f supabase/migrations/20250116_marketing_triggers.sql
```

### 3. Initialize Default Campaigns

```bash
npx tsx scripts/setup-marketing-automation.ts
```

### 4. Configure SendGrid

Set up SendGrid webhook to track email opens/clicks:

1. Go to SendGrid Dashboard → Settings → Mail Settings → Event Webhook
2. Add webhook URL: `https://yourdomain.com/api/marketing/webhooks/sendgrid`
3. Enable events: `open`, `click`, `bounce`, `dropped`

### 5. Configure Twilio (Optional, for SMS)

Add to `.env.local`:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+441234567890
```

### 6. Set Up Cron Jobs

Configure these endpoints to run periodically:

**Email/SMS Queue Processing** (every 5 minutes):
```bash
curl -X GET https://yourdomain.com/api/marketing/process-queue \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Inactivity Check** (daily):
```bash
curl -X GET https://yourdomain.com/api/cron/check-inactivity \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Automation Triggers

### 1. User Signup (`user_signup`)
- **When**: New user creates account
- **Action**: Sends welcome email
- **Triggered by**: Supabase trigger on `auth.users` insert

### 2. First Booking (`first_booking`)
- **When**: User makes their first confirmed booking
- **Action**: Sends congratulations + referral email
- **Triggered by**: Supabase trigger on `simple_bookings` insert

### 3. Inactivity (`inactivity`)
- **When**: User has no activity for 30+ days
- **Action**: Sends re-engagement email with local classes
- **Triggered by**: Cron job (`/api/cron/check-inactivity`)

### 4. Saved Search (`saved_search`)
- **When**: User saved a search 7+ days ago
- **Action**: Sends weekly digest of new matching classes
- **Triggered by**: Cron job checking `saved_searches` table

### 5. Wallet Balance (`wallet_balance`)
- **When**: User has wallet balance > £10
- **Action**: Sends nudge to use credit
- **Triggered by**: Manual check or scheduled job

### 6. Referral Pending (`referral_pending`)
- **When**: User's referral hasn't joined after 14 days
- **Action**: Sends reminder to invite friends
- **Triggered by**: Cron job checking referrals table

## Email Templates

Templates support Handlebars-style variables:

- `{{first_name}}` - User's first name
- `{{wallet_balance}}` - Formatted wallet balance (e.g., "£10.00")
- `{{local_city}}` - User's local city/town
- `{{app_url}}` - Application URL

Templates are defined in `lib/marketing/email-templates.ts`.

## Integration

### In Your Code

Call integration hooks from your existing flows:

```typescript
import { onUserSignup, onFirstBooking, onSavedSearch } from "@/lib/marketing/integrations";

// After user signs up
await onUserSignup(userId, email, { firstName: "John" });

// After first booking
await onFirstBooking(userId, email, bookingId);

// When user saves a search
await onSavedSearch(userId);
```

### Manual Trigger (Testing)

```bash
curl -X POST https://yourdomain.com/api/marketing/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: ph_admin=$ADMIN_SECRET" \
  -d '{
    "triggerType": "user_signup",
    "userId": "user-uuid",
    "context": {
      "firstName": "John"
    }
  }'
```

## Admin Dashboard

Access at `/admin/marketing/automations`:

- View campaign performance (opens, clicks, conversions)
- Enable/disable automation rules
- Toggle campaigns on/off
- View weekly metrics

## Testing

Use test utilities to simulate events:

```typescript
import {
  simulateUserSignup,
  simulateFirstBooking,
  simulateInactivity,
  checkEmailQueue,
} from "@/lib/marketing/test-utils";

// Simulate signup
await simulateUserSignup(userId, "test@example.com", "John");

// Check queued emails
const emails = await checkEmailQueue(userId);
console.log(emails);
```

## Campaign Metrics

Metrics are tracked daily in `campaign_metrics` table:

- `emails_sent` - Total emails sent
- `emails_opened` - Total opens
- `emails_clicked` - Total clicks
- `emails_bounced` - Total bounces
- `sms_sent` - Total SMS sent
- `sms_delivered` - Total SMS delivered
- `conversions` - Bookings made after campaign

## SMS Support

SMS messages are queued and processed via Twilio:

1. Messages are added to `sms_queue` table
2. Cron job (`/api/marketing/process-queue`) processes pending SMS
3. If Twilio not configured, SMS are logged for testing

## Troubleshooting

### Emails not sending
- Check `MARKETING_AUTOMATION_ENABLED=true`
- Verify SendGrid API key is set
- Check `email_queue` table for failed messages
- Review error messages in `email_queue.error_message`

### Triggers not firing
- Verify Supabase triggers are installed
- Check `automation_rules` table for enabled rules
- Review `user_activity_log` for activity tracking

### Metrics not updating
- Ensure SendGrid webhook is configured
- Check webhook endpoint logs
- Verify `campaign_metrics` table is being updated

## Database Tables

- `marketing_campaigns` - Campaign definitions
- `email_queue` - Queued emails
- `sms_queue` - Queued SMS
- `automation_rules` - Automation rule configurations
- `campaign_metrics` - Daily campaign performance
- `user_activity_log` - User activity tracking

## API Endpoints

- `GET /api/marketing/process-queue` - Process email/SMS queue
- `POST /api/marketing/webhooks/sendgrid` - SendGrid webhook handler
- `POST /api/marketing/trigger` - Manually trigger automation
- `GET /api/cron/check-inactivity` - Check for inactive users
- `GET /api/admin/marketing/campaigns` - List campaigns
- `POST /api/admin/marketing/campaigns` - Create/update campaigns
- `GET /api/admin/marketing/rules` - List automation rules
- `POST /api/admin/marketing/rules` - Create/update rules

