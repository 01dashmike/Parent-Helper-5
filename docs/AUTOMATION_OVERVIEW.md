# Marketing Automation & Notifications System

## Overview

The Marketing Automation & Notifications System provides a lean but powerful layer for keeping parents engaged and helping providers grow. It integrates seamlessly with existing booking, analytics, and email infrastructure.

## Architecture

### Database Schema

- **notification_templates**: Base email/push templates with markdown content
- **notification_events**: Log of each notification attempt (sent, skipped, failed, bounced)
- **automation_flows**: High-level automation definitions with configurable settings
- **automation_runs**: Execution logs per flow per day
- **user_notification_settings**: User preferences for marketing and transactional emails

### Core Libraries

- **lib/notifications/templates.ts**: Template fetching and rendering with placeholder replacement
- **lib/notifications/send.ts**: Unified sending abstraction that respects user preferences
- **lib/notifications/flows.ts**: Helper functions to find users for each automation flow
- **lib/notifications/automation.ts**: Flow execution engine

## Automation Flows

### 1. Parent Booking Reminder (Transactional)
- **Trigger**: Daily cron
- **Target**: Parents with bookings in 18-30 hours
- **Template**: `parent_booking_reminder`
- **Purpose**: Reduce no-shows and increase trust

### 2. Parent Lapsed Reactivation (Marketing)
- **Trigger**: Daily cron
- **Target**: Parents with no bookings in 45+ days
- **Template**: `parent_lapsed_reactivation`
- **Purpose**: Bring back inactive parents

### 3. Cancellation Suggestions (Transactional)
- **Trigger**: When provider cancels a booking
- **Target**: Parent whose booking was cancelled
- **Template**: `parent_cancellation_suggestions`
- **Purpose**: Recover lost demand

### 4. Provider Weekly Digest (Marketing)
- **Trigger**: Weekly cron (Monday 8 AM)
- **Target**: All active providers
- **Template**: `provider_weekly_digest`
- **Purpose**: Keep providers informed and motivated

### 5. Provider Onboarding Nudge (Marketing)
- **Trigger**: Daily cron
- **Target**: Providers with incomplete onboarding (2+ days)
- **Templates**: `provider_onboarding_nudge_2d`, `provider_onboarding_nudge_7d`
- **Purpose**: Push providers to complete onboarding

## Cron Endpoints

- **GET /api/cron/notifications/daily**: Runs booking reminders, lapsed reactivation, onboarding nudges
- **GET /api/cron/notifications/weekly**: Runs provider weekly digest

Both endpoints are protected by `CRON_SECRET` header.

## Admin UI

- **/admin/automation**: List all automation flows with enable/disable toggles
- **/admin/automation/[key]**: Detail page showing flow config, recent runs, and notification events

## User Preferences

- **/account/settings/notifications**: Parent notification preferences
- **/provider/settings/notifications**: Provider notification preferences

Users can opt out of marketing emails while keeping transactional emails (confirmations, reminders).

## Integration Points

- **Booking System**: Cancellation flow triggers suggestions
- **Email Infrastructure**: Uses existing SendGrid setup
- **Analytics**: All notifications logged to `notification_events`
- **User Settings**: Respects opt-in/opt-out preferences

## Security & Fail-Safe

- All flows are fail-safe: if automation fails, core booking/auth flows continue
- User preferences are always respected
- All notifications are logged for audit
- Admin can disable flows without code changes








