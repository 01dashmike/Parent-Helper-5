# Saved Searches & Alerts Implementation

This document outlines the complete implementation of the Saved Searches and Alerts feature for Parent Helper.

## Overview

The feature allows logged-in members to save their class searches and receive weekly email alerts when new classes matching their criteria are added. The implementation includes a frictionless onboarding funnel that converts first-time savers into members through one-tap sign-in.

## Database Structure

### Migration: `supabase/migrations/20250120_saved_searches_alerts.sql`

**Tables Created:**

1. **saved_searches**
   - `id` (uuid, primary key)
   - `user_id` (uuid, FK → auth.users)
   - `query` (text) - Full search string (e.g., "q=music&town=london")
   - `town` (text, nullable)
   - `filters` (jsonb, nullable) - Optional structured filters
   - `created_at` (timestamptz)
   - `last_alert_at` (timestamptz, nullable)
   - `alert_frequency` (text) - 'daily', 'weekly', or 'none' (default: 'weekly')
   - `is_active` (boolean, default: true)

2. **alerts_log**
   - `id` (uuid, primary key)
   - `saved_search_id` (uuid, FK → saved_searches)
   - `sent_at` (timestamptz)
   - `count_classes` (int)
   - `preview_class` (text, nullable)

**RLS Policies:**
- Users can manage their own saved searches
- Service role can manage all searches (for cron jobs)
- Anonymous read access disabled by default (can be enabled for teaser searches)

## API Endpoints

### 1. `/api/search/save` (POST)
- **Purpose**: Save or update a search for the authenticated user
- **Request Body**: `{ query: string, town?: string, filters?: object }`
- **Response**: `{ success: true, id: string, message: string }` or `{ error: "AUTH_REQUIRED" }`
- **Behavior**: Returns `AUTH_REQUIRED` if user is not signed in (triggers client modal)

### 2. `/api/auth/magic-link` (POST)
- **Purpose**: Generate one-tap sign-in magic link
- **Request Body**: `{ email: string, next?: string }`
- **Response**: `{ success: true, message: string }`
- **Features**:
  - Rate limiting (30 seconds per email)
  - Supabase OTP magic link generation
  - Redirects to `/onboarding/child` after sign-in

### 3. `/api/search/alerts/weekly` (GET)
- **Purpose**: Cron job to send weekly digest emails
- **Authentication**: Protected by `CRON_SECRET` or Vercel Cron header
- **Schedule**: Weekly on Monday at 8 AM (configured in `vercel.json`)
- **Logic**:
  - Finds all active saved searches with `alert_frequency='weekly'`
  - Queries for new classes created since `last_alert_at`
  - Sends SendGrid digest email if new classes found
  - Updates `last_alert_at` and logs to `alerts_log`

### 4. `/auth/callback` (GET)
- **Purpose**: Handle Supabase auth callback after magic link click
- **Query Params**: `code` (from Supabase), `next` (redirect URL)
- **Behavior**: Exchanges code for session and redirects to `next` URL

## Frontend Components

### 1. `components/search/SaveSearchButton.tsx`
- **Location**: Search results page
- **Features**:
  - Checks authentication status
  - Shows modal if not authenticated
  - Saves search via API if authenticated
  - Optimistic UI updates
  - Button text: "✨ Save & get weekly class alerts near [Town]"

### 2. `components/modals/SaveSearchPrompt.tsx`
- **Purpose**: Modal for non-authenticated users
- **Features**:
  - Email input
  - Magic link request
  - Success state with confirmation message
  - Micro-copy: "Want to save this alert?"

### 3. `components/account/SavedSearchCard.tsx`
- **Purpose**: Display and manage individual saved searches
- **Features**:
  - Alert frequency toggle (daily/weekly/none)
  - Delete button
  - Preview latest results link
  - Shows last alert date
  - Status indicators

### 4. `components/onboarding/AddChildModal.tsx`
- **Purpose**: Modal for adding child profile (optional)
- **Features**:
  - Child name and birthdate
  - Interests selection
  - Allergies selection
  - Skip option

### 5. `app/onboarding/child/_components/AddChildOnboarding.tsx`
- **Purpose**: Full-page onboarding form
- **Features**: Same as AddChildModal but as a dedicated page

## Pages

### 1. `/account/searches`
- **Purpose**: Manage saved searches
- **Features**:
  - List all user's saved searches
  - Toggle alert frequency
  - Delete searches
  - Preview search results
  - Empty state with helpful message

### 2. `/onboarding/child`
- **Purpose**: Progressive profile after sign-in
- **Features**:
  - Single-screen child profile form
  - Skip option (non-blocking)
  - Redirects to account page after completion

## Feature Flags

Added to `lib/env.ts`:
- `SAVED_SEARCHES_ENABLED` - Enable/disable saved searches feature
- `MAGIC_LINK_SIGNIN_ENABLED` - Enable/disable magic link sign-in
- `CHILD_PROFILES_ENABLED` - Enable/disable child profiles
- `WEEKLY_ALERTS_ENABLED` - Enable/disable weekly alerts cron job

## Email Templates

### Weekly Digest Email
- **Subject**: "New classes near [Town] this week 🎨"
- **Content**:
  - Up to 5 class summaries
  - Count of total new classes
  - CTA: "View all on Parent Helper"
  - Unsubscribe link (sets `alert_frequency='none'`)

### Magic Link Email
- **Subject**: "Confirm your Parent Helper login"
- **Content**: Sent automatically by Supabase (configure in Supabase dashboard)

## Cron Job Configuration

### Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/search/alerts/weekly",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

**Schedule**: Every Monday at 8:00 AM UTC

**Alternative**: Can be triggered manually via:
```bash
curl -X GET https://your-domain.com/api/search/alerts/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Server Actions

### `app/account/searches/_actions.ts`
- `deleteSavedSearch(searchId: string)` - Delete a saved search
- `updateAlertFrequency(searchId: string, frequency: string)` - Update alert frequency

## Environment Variables

Required environment variables:
```bash
# Feature Flags
SAVED_SEARCHES_ENABLED=true
MAGIC_LINK_SIGNIN_ENABLED=true
CHILD_PROFILES_ENABLED=true
WEEKLY_ALERTS_ENABLED=true

# Cron Job Security
CRON_SECRET=your-secret-token  # Optional, for manual cron triggers

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# SendGrid (already configured)
SENDGRID_API_KEY=...
EMAIL_FROM=...
```

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   # Apply the migration to your Supabase database
   # The migration file is at: supabase/migrations/20250120_saved_searches_alerts.sql
   ```

2. **Configure Supabase**:
   - Set Site URL in Supabase dashboard to your domain
   - Configure email templates in Supabase Auth settings
   - Enable email redirects to `/auth/callback`

3. **Set Environment Variables**:
   - Add feature flags to `.env.local` or your hosting platform
   - Ensure SendGrid API key is configured

4. **Deploy**:
   - Push changes to your repository
   - Vercel will automatically set up the cron job
   - Or configure cron manually in your hosting platform

## Testing

### Manual Testing Checklist

1. **Save Search Flow**:
   - [ ] Visit `/search?q=music&town=london`
   - [ ] Click "Save this search" (not logged in)
   - [ ] Modal appears with email input
   - [ ] Enter email and submit
   - [ ] Check email for magic link
   - [ ] Click magic link
   - [ ] Redirected to `/onboarding/child`
   - [ ] Add child profile or skip
   - [ ] Redirected to `/account`
   - [ ] Search is saved

2. **Authenticated Save**:
   - [ ] Log in
   - [ ] Visit search results
   - [ ] Click "Save this search"
   - [ ] Instant feedback: "Saved! You'll get weekly updates."

3. **Manage Saved Searches**:
   - [ ] Visit `/account/searches`
   - [ ] See list of saved searches
   - [ ] Toggle alert frequency
   - [ ] Delete a search
   - [ ] Preview search results

4. **Weekly Alerts**:
   - [ ] Manually trigger `/api/search/alerts/weekly`
   - [ ] Check email logs for sent emails
   - [ ] Verify `alerts_log` table has entries
   - [ ] Verify `last_alert_at` is updated

## Performance Considerations

- **Client Caching**: Saved searches are prefetched in account layout
- **Debouncing**: SaveSearchButton API calls are debounced
- **Rate Limiting**: Magic link requests limited to 1 per 30 seconds per email
- **Email Rate Limits**: Respects Supabase email rate limits
- **Graceful Degradation**: Feature flags allow disabling features without breaking the app

## Future Enhancements

- Daily alerts option (already in schema, needs cron job)
- Email template customization
- Alert preferences per search
- Batch unsubscribe
- Search sharing (teaser searches for anonymous users)

## Notes

- The implementation uses Supabase's built-in email sending for magic links
- Custom email templates can be configured in Supabase dashboard
- The weekly digest email is sent via SendGrid using the existing `sendTransactional` utility
- All components are client-side rendered for optimal UX
- Server actions are used for mutations to ensure proper revalidation

