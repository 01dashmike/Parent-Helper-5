# Wellness User Accounts & Email System

This document describes the implementation of user accounts, preference saving, newsletter integration, email results, and accountability email system for the Parent Helper Wellness section.

## Features Implemented

### 1. User Authentication
- **Fast registration/login** using Supabase OTP (magic link)
- One-click email authentication
- No passwords required (unless in development mode)
- Seamless integration with existing Supabase auth

**Files:**
- `/app/wellness/(auth)/login/page.tsx` - Login page
- `/app/wellness/(auth)/register/page.tsx` - Registration page
- `/app/wellness/(auth)/actions.ts` - Authentication server actions
- `/lib/wellness/auth.ts` - Authentication utilities

**Usage:**
- Users can register at `/wellness/register`
- Users can login at `/wellness/login`
- Registration includes opt-ins for newsletter and accountability emails

### 2. Preference Persistence
- User preferences are saved to `wellness_profiles` table
- Preferences are automatically loaded when users create new plans
- Supports different preferences for each audience type (mum, dad, family, etc.)

**Files:**
- `/lib/wellness/actions.ts` - `saveWellnessProfile()`, `loadWellnessProfile()`

**Database:**
- `wellness_profiles` table stores user preferences per audience
- Linked to `auth.users` via `user_id`

### 3. Newsletter Integration
- Registration includes newsletter signup checkbox (checked by default)
- Integrates with existing `newsletters` table
- Users added to `wellness_users` table with newsletter preferences

**Files:**
- `/lib/wellness/newsletter.ts` - Newsletter utilities
- `/app/api/newsletter/subscribe/route.ts` - Newsletter API endpoint

**Usage:**
```typescript
await subscribeToNewsletter(email);
```

### 4. Email Results
- Users can email their wellness plans to themselves
- Supports meal plans, exercise plans, and supplement guides
- Beautiful HTML email templates with responsive design

**Files:**
- `/app/api/wellness/email-plan/route.ts` - API endpoint for emailing plans
- `/lib/emails/templates/wellnessPlan.ts` - Email templates
- Results pages updated with "Email Plan" buttons

**Usage:**
```typescript
POST /api/wellness/email-plan
{
  "email": "user@example.com",
  "planType": "meal|exercise|supplement",
  "audience": "mum|dad|family|couples|grandparents",
  "planData": { /* plan object */ }
}
```

### 5. Accountability Email System

#### Admin Interface
- Create, edit, and delete accountability email templates
- Set frequency (weekly, biweekly, monthly)
- Set email type (diet, exercise, supplements, general)
- Preview and activate/deactivate templates

**Files:**
- `/app/admin/wellness/emails/page.tsx` - List page
- `/app/admin/wellness/emails/create/page.tsx` - Create page
- `/app/admin/wellness/emails/[id]/page.tsx` - Edit page
- `/components/admin/wellness/AccountabilityEmailList.tsx` - List component
- `/components/admin/wellness/AccountabilityEmailEditor.tsx` - Editor component

**Admin URL:** `/admin/wellness/emails`

#### Email Sending
- Automated sending via cron job
- Respects user frequency preferences
- Tracks sends to prevent duplicates
- Supports variable substitution in templates

**Files:**
- `/lib/wellness/accountability.ts` - Email sending logic
- `/lib/emails/templates/accountability.ts` - Email template wrapper
- `/app/api/cron/wellness-accountability/route.ts` - Cron endpoint

**Database:**
- `wellness_accountability_emails` - Email templates
- `wellness_email_sends` - Tracking table for sent emails

## Database Schema

### wellness_users
Links Supabase auth users to wellness preferences and email settings.

```sql
CREATE TABLE wellness_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  newsletter_subscribed BOOLEAN DEFAULT false,
  accountability_emails_enabled BOOLEAN DEFAULT false,
  accountability_frequency TEXT CHECK (IN 'weekly', 'biweekly', 'monthly'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### wellness_accountability_emails
Admin-created email templates for accountability emails.

```sql
CREATE TABLE wellness_accountability_emails (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  email_type TEXT CHECK (IN 'diet', 'exercise', 'supplements', 'general'),
  frequency TEXT CHECK (IN 'weekly', 'biweekly', 'monthly'),
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  scheduled_send_day INTEGER CHECK (BETWEEN 1 AND 7),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### wellness_email_sends
Tracks sent accountability emails to prevent duplicates.

```sql
CREATE TABLE wellness_email_sends (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES wellness_users(user_id),
  email_template_id UUID REFERENCES wellness_accountability_emails(id),
  sent_at TIMESTAMPTZ,
  status TEXT CHECK (IN 'sent', 'failed'),
  error_message TEXT
);
```

## Scheduling Accountability Emails

### Option 1: Vercel Cron Jobs (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/wellness-accountability?frequency=biweekly&key=YOUR_SECRET",
      "schedule": "0 9 1,15 * *"
    },
    {
      "path": "/api/cron/wellness-accountability?frequency=monthly&key=YOUR_SECRET",
      "schedule": "0 9 1 * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use a service like cron-job.org to hit:
- `https://yourdomain.com/api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET`
- `https://yourdomain.com/api/cron/wellness-accountability?frequency=biweekly&key=YOUR_SECRET`
- `https://yourdomain.com/api/cron/wellness-accountability?frequency=monthly&key=YOUR_SECRET`

### Schedule:
- **Weekly:** Every Monday at 9am (`0 9 * * 1`)
- **Biweekly:** 1st and 15th of month at 9am (`0 9 1,15 * *`)
- **Monthly:** 1st of month at 9am (`0 9 1 * *`)

### Environment Variables

Add to `.env.local`:

```bash
# Required for cron endpoint security
CRON_SECRET_KEY=your-random-secret-key

# Already configured
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=no-reply@parenthelper.co.uk
NEXT_PUBLIC_APP_URL=https://parenthelper.co.uk
```

## User Flow

### Registration
1. User visits `/wellness/register`
2. Enters email
3. Checks newsletter and/or accountability email opt-ins
4. Receives OTP via email
5. Enters OTP to verify and create account
6. Redirected to wellness hub with saved preferences

### Creating Plans
1. User creates a wellness plan (meal/exercise/supplement)
2. If logged in, preferences are auto-saved to their profile
3. Plan is saved to `wellness_plans` table
4. User can email the plan to themselves
5. Plan is accessible from their dashboard

### Accountability Emails
1. User opts in during registration (or later in settings)
2. Admin creates email templates in `/admin/wellness/emails`
3. Cron job runs on schedule
4. System finds eligible users based on frequency preference
5. Emails are sent using templates
6. Sends are tracked to prevent duplicates

## Email Template Variables

Templates support variable substitution:

- `{{email}}` - User's email address
- `{{unsubscribe_url}}` - Unsubscribe link

Example:
```html
<p>Hi {{email}},</p>
<p>How's your diet going this week?</p>
<a href="{{unsubscribe_url}}">Unsubscribe</a>
```

## API Endpoints

### Authentication
- `POST /api/wellness/email-plan` - Email a plan to user

### Admin
- `GET /api/admin/wellness/emails` - List all templates
- `POST /api/admin/wellness/emails` - Create template
- `GET /api/admin/wellness/emails/[id]` - Get single template
- `PATCH /api/admin/wellness/emails/[id]` - Update template
- `DELETE /api/admin/wellness/emails/[id]` - Delete template

### Cron
- `GET /api/cron/wellness-accountability?frequency=weekly&key=SECRET` - Process emails

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

## Security

- RLS policies on all wellness tables
- Users can only access their own data
- Admin endpoints require authentication (TODO: Add admin check middleware)
- Cron endpoint requires secret key
- Email validation and sanitization
- Rate limiting recommended for email endpoints

## Future Enhancements

- [ ] User settings page to manage preferences
- [ ] View saved plans in dashboard
- [ ] Export plans as PDF
- [ ] Email analytics (open rates, click rates)
- [ ] A/B testing for email templates
- [ ] Meal prep company sponsorship integration
- [ ] OAuth login options (Google, Apple)
- [ ] Mobile app integration

## Testing

### Test Registration
1. Visit `/wellness/register`
2. Enter email and check opt-ins
3. Check email for OTP
4. Enter OTP to complete registration

### Test Email Results
1. Create a wellness plan
2. Click "Email Plan" button
3. Enter email address
4. Check inbox for plan email

### Test Accountability Emails (Manual Trigger)
Visit: `/api/cron/wellness-accountability?frequency=weekly&key=YOUR_SECRET`

### Test Admin Interface
1. Visit `/admin/wellness/emails`
2. Create a new template
3. Test activate/deactivate
4. Edit template
5. Delete template

## Migration

Run the migration:

```bash
# Apply the migration
psql $DATABASE_URL -f supabase/migrations/20251214000000_wellness_user_accounts.sql

# Or use Supabase CLI
supabase db push
```

## Support

For issues or questions, contact the development team.
