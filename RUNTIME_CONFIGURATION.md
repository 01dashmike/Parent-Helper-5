# Runtime Configuration Guide

This document explains all environment variables and feature flags needed for Parent Helper to run correctly across development, staging, and production environments.

## Overview

Parent Helper uses environment variables for:
- **Core infrastructure** (database, authentication, payments)
- **Third-party integrations** (Stripe, SendGrid, OpenAI)
- **Feature flags** (to enable/disable features without code changes)
- **Security** (admin access, webhook secrets)

All `NEXT_PUBLIC_*` variables are exposed to the browser and should never contain secrets. Server-only variables (without `NEXT_PUBLIC_`) are safe for API keys and secrets.

---

## Core Infrastructure Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL` ⚠️ **REQUIRED**
- **What it does**: The public URL of your Supabase project (e.g., `https://xxxxx.supabase.co`)
- **Used by**: Browser and server code to connect to your database and authentication
- **What breaks if missing**: The entire app fails to load - no data, no authentication, no search
- **Safe default for dev**: None - you must set up a Supabase project
- **Example**: `https://abcdefghijklmnop.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY` ⚠️ **REQUIRED**
- **What it does**: Public API key that allows browser code to read/write data (with Row Level Security rules)
- **Used by**: All client-side database operations, user authentication, search queries
- **What breaks if missing**: App won't connect to database, users can't sign in, search won't work
- **Safe default for dev**: None - get this from your Supabase project settings
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_URL` ⚠️ **REQUIRED**
- **What it does**: Same as `NEXT_PUBLIC_SUPABASE_URL` but for server-side code (can fallback to public version)
- **Used by**: Server API routes, background jobs, admin operations
- **What breaks if missing**: Server-side database operations fail, API routes won't work
- **Safe default for dev**: Can use same value as `NEXT_PUBLIC_SUPABASE_URL`

#### `SUPABASE_ANON_KEY` (Optional)
- **What it does**: Alternative way to provide the anon key for server code
- **Used by**: Server-side operations that need database access
- **What breaks if missing**: Server code falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` (usually fine)
- **Safe default for dev**: Can omit if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

#### `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **REQUIRED**
- **What it does**: Secret key that bypasses Row Level Security - use for admin operations only
- **Used by**: Admin dashboards, data migrations, background jobs that need full database access
- **What breaks if missing**: Admin features won't work, data migration scripts fail, some automation breaks
- **Safe default for dev**: Get from Supabase project settings → API → service_role key
- **⚠️ Security**: Never expose this in browser code - it has full database access

#### `DATABASE_URL` (Optional)
- **What it does**: Direct PostgreSQL connection string for database tools and migration scripts
- **Used by**: Schema repair scripts, direct SQL access, some automation tools
- **What breaks if missing**: Migration scripts and direct database tools won't work (app still works via Supabase)
- **Safe default for dev**: Can omit unless you need direct database access
- **Example**: `postgresql://user:password@host:5432/database`

---

## Payment Processing (Stripe)

#### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ⚠️ **REQUIRED**
- **What it does**: Public Stripe key that allows the browser to create payment forms and checkout sessions
- **Used by**: Featured listing purchases, provider subscriptions, membership upgrades
- **What breaks if missing**: Payment buttons won't work, users can't upgrade to featured listings, subscription flows fail
- **Safe default for dev**: Use Stripe test mode key (`pk_test_...`)
- **Example**: `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

#### `STRIPE_SECRET_KEY` ⚠️ **REQUIRED**
- **What it does**: Secret Stripe key for server-side payment operations (creating charges, managing subscriptions)
- **Used by**: Payment processing, subscription management, webhook handling
- **What breaks if missing**: Payments won't process, subscriptions won't activate, revenue features completely broken
- **Safe default for dev**: Use Stripe test mode key (`sk_test_...`)
- **⚠️ Security**: Never expose in browser - this can create charges
- **Example**: `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

#### `STRIPE_WEBHOOK_SECRET` ⚠️ **REQUIRED**
- **What it does**: Secret that verifies webhook requests are actually from Stripe (prevents fraud)
- **Used by**: Webhook handler that processes payment events (subscription renewals, refunds, etc.)
- **What breaks if missing**: Webhooks fail verification, subscription renewals won't process automatically, payment status won't update
- **Safe default for dev**: Get from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret
- **Example**: `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

---

## Email & Notifications (SendGrid)

#### `SENDGRID_API_KEY` ⚠️ **REQUIRED**
- **What it does**: API key for sending transactional emails (notifications, newsletters, alerts)
- **Used by**: Email notifications, weekly newsletters, provider reports, reactivation emails
- **What breaks if missing**: No emails sent - users won't get notifications, newsletters won't send, provider reports fail
- **Safe default for dev**: Create a SendGrid account and get API key from Settings → API Keys
- **Example**: `SG.abcdefghijklmnopqrstuvwxyz.1234567890`

#### `SENDGRID_FROM_EMAIL` (Optional)
- **What it does**: Default "from" email address for all outgoing emails
- **Used by**: All email sending operations
- **What breaks if missing**: Emails may fail to send or use a default address
- **Safe default for dev**: `notification@parenthelper.co.uk` or your verified SendGrid sender

#### `SENDGRID_FROM_NAME` (Optional)
- **What it does**: Display name shown in email "from" field
- **Used by**: All email sending operations
- **What breaks if missing**: Emails still send but may show generic sender name
- **Safe default for dev**: `Parent Helper`

#### `SENDGRID_REPLY_TO` (Optional)
- **What it does**: Email address for replies
- **Used by**: Email sending operations
- **What breaks if missing**: Replies may go to wrong address
- **Safe default for dev**: `notification@parenthelper.co.uk`

#### `ADMIN_EMAIL` (Optional)
- **What it does**: Email address for admin notifications and error reports
- **Used by**: Error reporting, admin alerts
- **What breaks if missing**: Admin notifications won't send
- **Safe default for dev**: Your email address

---

## AI & Automation

#### `OPENAI_API_KEY` ⚠️ **REQUIRED**
- **What it does**: API key for OpenAI to power AI features (blog generation, recommendations, insights)
- **Used by**: AI blog post generation, personalized recommendations, provider AI insights, performance coaching
- **What breaks if missing**: AI features won't work - no auto-generated blog posts, no AI recommendations, no AI insights
- **Safe default for dev**: Get from OpenAI Dashboard → API Keys
- **Example**: `sk-proj-abcdefghijklmnopqrstuvwxyz1234567890`

#### `OPENAI_MODEL` (Optional)
- **What it does**: Which OpenAI model to use (defaults to `gpt-4o-mini` if not set)
- **Used by**: AI blog generation, AI recommendations
- **What breaks if missing**: Uses default model (usually fine)
- **Safe default for dev**: `gpt-4o-mini` (cheaper) or `gpt-4o` (better quality)

---

## Security & Admin

#### `ADMIN_SECRET` ⚠️ **REQUIRED**
- **What it does**: Secret token that protects admin-only endpoints and features
- **Used by**: Admin dashboards, admin API routes, protected admin pages
- **What breaks if missing**: Admin features won't be accessible, admin pages return 403 errors
- **Safe default for dev**: Generate a random string (e.g., `openssl rand -hex 32`)
- **⚠️ Security**: Use a strong random string - this protects admin access

#### `CRON_SECRET` (Optional)
- **What it does**: Secret token for securing scheduled job endpoints (prevents unauthorized cron triggers)
- **Used by**: Weekly alerts, provider reports, newsletter sends, retention calculations
- **What breaks if missing**: Cron jobs can still run but won't be secured (anyone could trigger them)
- **Safe default for dev**: Generate a random string (e.g., `openssl rand -hex 32`)
- **⚠️ Security**: Required in production to prevent abuse

---

## Application URLs

#### `NEXT_PUBLIC_APP_URL` (Optional)
- **What it does**: The public URL of your application (used for generating shareable links, emails, etc.)
- **Used by**: Email links, social sharing, canonical URLs
- **What breaks if missing**: Links in emails may be broken, social sharing may use wrong URL
- **Safe default for dev**: `http://localhost:3000` (dev) or `https://your-domain.com` (prod)
- **Example**: `https://parenthelper.co.uk`

#### `APP_URL` (Optional)
- **What it does**: Same as `NEXT_PUBLIC_APP_URL` but for server-side code
- **Used by**: Server-side link generation, webhook callbacks
- **What breaks if missing**: Server-generated links may be incorrect
- **Safe default for dev**: Same as `NEXT_PUBLIC_APP_URL`

---

## Feature Flags

Feature flags allow you to enable/disable features without deploying code. All flags default to `false` unless otherwise noted. Set to `"true"` to enable, `"false"` to disable.

### Core Features

#### `NEXT_PUBLIC_ACCOUNT_ENABLED` (Default: `true`)
- **What it does**: Controls whether the account/members area is visible to users
- **Used by**: Account navigation, member dashboard, user settings
- **What breaks if missing**: Account area hidden (set to `"false"`), or visible by default (if not set)
- **Safe default for dev**: `true` (enabled)

#### `NEXT_PUBLIC_MEMBERS_ENABLED` (Default: `true`)
- **What it does**: Enables the expanded Members Area with saved searches, alerts, and enhanced dashboard
- **Used by**: Members navigation, saved searches feature, alerts system
- **What breaks if missing**: Members features hidden if set to `"false"`
- **Safe default for dev**: `true` (enabled)

### Personalization & Recommendations

#### `PERSONALIZATION_ENABLED` / `NEXT_PUBLIC_PERSONALIZATION_ENABLED` (Default: `false`)
- **What it does**: Enables AI-powered personalization with family profiles, tailored recommendations, and customized newsletters
- **Used by**: Recommendation engine, family profiles, personalized content
- **What breaks if missing**: Personalization features hidden, recommendations use generic logic
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_CHILD_PROFILES_ENABLED` / `CHILD_PROFILES_ENABLED` (Default: `false`)
- **What it does**: Enables child profile management - parents can create profiles for each child with age, interests, etc.
- **Used by**: Child profile pages, age-based recommendations, personalized search
- **What breaks if missing**: Child profile features hidden, recommendations can't use child-specific data
- **Safe default for dev**: `false` (disabled until ready)

#### `AUTO_RECS_ON_SIGNIN_ENABLED` (Default: `false`)
- **What it does**: Automatically generates recommendations when a user signs in
- **Used by**: Sign-in flow, recommendation system
- **What breaks if missing**: Recommendations only generated on-demand, not automatically
- **Safe default for dev**: `false` (disabled to reduce API costs)

### Newsletters & Communication

#### `NEWSLETTER_ENABLED` (Default: `false`)
- **What it does**: Enables weekly tailored newsletters sent to subscribers
- **Used by**: Newsletter automation, weekly email sends
- **What breaks if missing**: Newsletter feature disabled, no automated emails sent
- **Safe default for dev**: `false` (disabled until ready to send)

#### `NEWSLETTER_BATCH_SIZE` (Default: `500`)
- **What it does**: Number of newsletters to send per batch (prevents overwhelming email service)
- **Used by**: Newsletter sending automation
- **What breaks if missing**: Uses default of 500 (usually fine)
- **Safe default for dev**: `500`

#### `WEEKLY_ALERTS_ENABLED` (Default: `false`)
- **What it does**: Enables weekly email alerts for saved searches
- **Used by**: Alert system, weekly cron job
- **What breaks if missing**: Weekly alerts won't send
- **Safe default for dev**: `false` (disabled until ready)

#### `REACTIVATION_EMAILS_ENABLED` (Default: `false`)
- **What it does**: Enables automated reactivation emails to inactive families
- **Used by**: Retention system, reactivation automation
- **What breaks if missing**: Reactivation emails won't send
- **Safe default for dev**: `false` (disabled until ready)

### Provider Features

#### `PROVIDER_PAYOUTS_ENABLED` (Default: `false`)
- **What it does**: Enables provider payout reconciliation dashboard with Stripe integration, booking matching, and monthly summary emails
- **Used by**: Provider payout dashboard, payout reconciliation, monthly reports
- **What breaks if missing**: Provider payout features hidden, providers can't track earnings
- **Safe default for dev**: `false` (disabled until Stripe Connect is set up)

#### `PROVIDER_REFERRALS_ENABLED` (Default: `false`)
- **What it does**: Enables provider referral program and dashboard
- **Used by**: Provider referral tracking, referral rewards
- **What breaks if missing**: Provider referral features hidden
- **Safe default for dev**: `false` (disabled until ready)

### Search & Discovery

#### `NEXT_PUBLIC_CITY_PAGES_ENABLED` / `CITY_PAGES_ENABLED` (Default: `false`)
- **What it does**: Enables city-specific landing pages (e.g., `/winchester`, `/southampton`)
- **Used by**: City page routes, local content
- **What breaks if missing**: City pages hidden, local SEO features disabled
- **Safe default for dev**: `false` (disabled until content is ready)

#### `SAVED_SEARCHES_ENABLED` (Default: `false`)
- **What it does**: Enables users to save their search queries for quick access later
- **Used by**: Saved searches feature, search history
- **What breaks if missing**: Saved searches feature hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_NEARBY_EVENTS_ENABLED` / `NEARBY_EVENTS_ENABLED` (Default: `false`)
- **What it does**: Enables "nearby events" feature showing local activities
- **Used by**: Events discovery, local events display
- **What breaks if missing**: Nearby events feature hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_LOCAL_TIPS_ENABLED` / `LOCAL_TIPS_ENABLED` (Default: `false`)
- **What it does**: Enables local tips and advice on city pages
- **Used by**: City pages, local content
- **What breaks if missing**: Local tips feature hidden
- **Safe default for dev**: `false` (disabled until content is ready)

#### `NEXT_PUBLIC_LOCAL_PARTNERS_ENABLED` / `LOCAL_PARTNERS_ENABLED` (Default: `false`)
- **What it does**: Enables local partner listings on city pages
- **Used by**: City pages, partner directory
- **What breaks if missing**: Local partners feature hidden
- **Safe default for dev**: `false` (disabled until ready)

### Advanced Features

#### `NEXT_PUBLIC_FAMILY_WALLET_ENABLED` / `FAMILY_WALLET_ENABLED` (Default: `false`)
- **What it does**: Enables Family Wallet system allowing parents, grandparents, and guardians to share booking credits, manage household members, and gift points
- **Used by**: Wallet system, family account management, gifting features
- **What breaks if missing**: Family wallet features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `FEATURE_BOOKINGS` (Default: `false`)
- **What it does**: Enables booking system for classes
- **Used by**: Class booking flow, booking management
- **What breaks if missing**: Booking features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `REVIEWS_FEATURE_ENABLED` (Default: `false`)
- **What it does**: Enables review system for classes
- **Used by**: Class reviews, rating system
- **What breaks if missing**: Review features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `CLASS_QA_ENABLED` (Default: `false`)
- **What it does**: Enables Q&A feature on class pages
- **Used by**: Class Q&A, question/answer system
- **What breaks if missing**: Q&A features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `TOPIC_HUBS_ENABLED` (Default: `false`)
- **What it does**: Enables topic hub pages (e.g., `/topics/music`, `/topics/swimming`)
- **Used by**: Topic pages, topic-based discovery
- **What breaks if missing**: Topic hub features hidden
- **Safe default for dev**: `false` (disabled until ready)

### AI & Analytics

#### `NEXT_PUBLIC_AI_INSIGHTS_ENABLED` / `AI_INSIGHTS_ENABLED` (Default: `false`)
- **What it does**: Enables AI insights dashboard for admins
- **Used by**: Admin AI insights, analytics dashboard
- **What breaks if missing**: AI insights features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_AI_PERFORMANCE_COACH_ENABLED` / `AI_PERFORMANCE_COACH_ENABLED` (Default: `false`)
- **What it does**: Enables AI performance coach for providers
- **Used by**: Provider AI coaching, performance recommendations
- **What breaks if missing**: AI coaching features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `GROWTH_AUTOMATION_DASHBOARD_ENABLED` (Default: `false`)
- **What it does**: Enables Growth Automation Control Center for admins with AI insights, automated provider reports, and performance coaching
- **Used by**: Admin growth dashboard, automation features
- **What breaks if missing**: Growth automation features hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `TRACKING_ENABLED` / `NEXT_PUBLIC_TRACKING_ENABLED` (Default: `false`)
- **What it does**: Enables lightweight analytics tracking for personalized experiences
- **Used by**: Analytics system, user behavior tracking
- **What breaks if missing**: Analytics tracking disabled (privacy-first, so this is fine)
- **Safe default for dev**: `false` (disabled for privacy by default)

#### `ANALYTICS_RETENTION_ENABLED` (Default: `false`)
- **What it does**: Enables engagement score calculation and retention intelligence
- **Used by**: Retention system, engagement scoring
- **What breaks if missing**: Retention analytics disabled
- **Safe default for dev**: `false` (disabled until ready)

#### `MARKETING_AUTOMATION_ENABLED` (Default: `false`)
- **What it does**: Enables marketing automation features
- **Used by**: Marketing automation, campaign management
- **What breaks if missing**: Marketing automation features hidden
- **Safe default for dev**: `false` (disabled until ready)

### UI Features

#### `NEXT_PUBLIC_WEATHER_WIDGET_ENABLED` / `WEATHER_WIDGET_ENABLED` (Default: `false`)
- **What it does**: Enables weather widget on relevant pages
- **Used by**: Weather display, outdoor activity recommendations
- **What breaks if missing**: Weather widget hidden
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_PWA_PUSH_ENABLED` / `PWA_PUSH_ENABLED` (Default: `false`)
- **What it does**: Enables PWA push notifications
- **Used by**: Push notification system, PWA features
- **What breaks if missing**: Push notifications disabled
- **Safe default for dev**: `false` (disabled until ready)

#### `NEXT_PUBLIC_WELLNESS_ENABLED` (Default: `true`)
- **What it does**: Controls visibility of the "Health & Wellness" navigation menu and wellness hub pages
- **Used by**: Wellness navigation, wellness pages
- **What breaks if missing**: Wellness section hidden if set to `"false"`
- **Safe default for dev**: `true` (enabled)

#### `NEXT_PUBLIC_EXPERIMENTS_ENABLED` (Default: `false`)
- **What it does**: Enables A/B testing for hero copy and CTA placement
- **Used by**: Experiment system, A/B testing
- **What breaks if missing**: A/B testing disabled
- **Safe default for dev**: `false` (disabled until ready)

### Authentication

#### `MAGIC_LINK_SIGNIN_ENABLED` (Default: `false`)
- **What it does**: Enables magic link (passwordless) sign-in
- **Used by**: Authentication flow, sign-in options
- **What breaks if missing**: Magic link sign-in disabled
- **Safe default for dev**: `false` (disabled until ready)

### Recommendation Tuning

#### `RECS_WEIGHTS` (Optional)
- **What it does**: JSON string with recommendation algorithm weights
- **Used by**: Recommendation engine, personalized suggestions
- **What breaks if missing**: Uses default weights (usually fine)
- **Safe default for dev**: `'{"w_age_fit":0.35,"w_distance":0.2,"w_pop":0.2,"w_quality":0.2,"w_novelty":0.05}'`

#### `RECS_MAX_RADIUS_KM` (Default: `20`)
- **What it does**: Maximum radius in kilometers for location-based recommendations
- **Used by**: Recommendation engine, location filtering
- **What breaks if missing**: Uses default of 20km (usually fine)
- **Safe default for dev**: `20`

---

## Safe Defaults for Local Development

Here's a minimal `.env.local` file that will get you running locally (you'll need to fill in your actual values):

```bash
# ⚠️ REQUIRED - Core Infrastructure
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ⚠️ REQUIRED - Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ⚠️ REQUIRED - Email
SENDGRID_API_KEY=SG....

# ⚠️ REQUIRED - AI
OPENAI_API_KEY=sk-proj-...

# ⚠️ REQUIRED - Security
ADMIN_SECRET=your-random-secret-here

# Optional - URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Optional - Email Configuration
SENDGRID_FROM_EMAIL=notification@parenthelper.co.uk
SENDGRID_FROM_NAME=Parent Helper
SENDGRID_REPLY_TO=notification@parenthelper.co.uk
ADMIN_EMAIL=your-email@example.com

# Feature Flags (all default to false, set to "true" to enable)
# Most features are disabled by default - enable as needed
NEXT_PUBLIC_ACCOUNT_ENABLED=true
NEXT_PUBLIC_MEMBERS_ENABLED=true
NEXT_PUBLIC_WELLNESS_ENABLED=true
```

---

## Environment-Specific Recommendations

### Development
- Use Stripe test mode keys (`pk_test_...`, `sk_test_...`)
- Use a separate Supabase project or local development database
- Enable only features you're actively developing
- Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Staging
- Use Stripe test mode keys
- Use a staging Supabase project
- Enable features you're testing
- Set `NEXT_PUBLIC_APP_URL` to your staging domain
- Set `CRON_SECRET` to secure scheduled jobs

### Production
- Use Stripe live mode keys (`pk_live_...`, `sk_live_...`)
- Use production Supabase project
- Enable only production-ready features
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- **Always** set `CRON_SECRET` to prevent abuse
- Use strong, randomly generated `ADMIN_SECRET`
- Monitor API usage (OpenAI, SendGrid) to avoid unexpected costs

---

## Quick Reference: What Breaks Without Each Variable

| Variable | Severity | What Breaks |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 🔴 Critical | Entire app fails to load |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔴 Critical | No database access, no authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | 🟡 Important | Admin features, migrations fail |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 🟡 Important | Payment buttons don't work |
| `STRIPE_SECRET_KEY` | 🟡 Important | Payments won't process |
| `STRIPE_WEBHOOK_SECRET` | 🟡 Important | Subscription renewals fail |
| `SENDGRID_API_KEY` | 🟡 Important | No emails sent |
| `OPENAI_API_KEY` | 🟡 Important | AI features disabled |
| `ADMIN_SECRET` | 🟡 Important | Admin features inaccessible |
| Feature flags | 🟢 Optional | Specific features hidden (app still works) |

---

## Notes

- All feature flags are **opt-in** (default to `false`) - you must explicitly enable features
- `NEXT_PUBLIC_*` variables are exposed to the browser - never put secrets here
- Server-only variables (without `NEXT_PUBLIC_`) are safe for API keys
- Most features gracefully degrade if disabled - the app still works, just without that feature
- Test mode Stripe keys work fine for development and staging
- Always use strong, randomly generated secrets for `ADMIN_SECRET` and `CRON_SECRET`

---

## Getting Help

If you're missing required variables, the app will show errors in the console or fail to start. Check:
1. Your `.env.local` file exists in the project root
2. All required variables are set (see ⚠️ **REQUIRED** markers above)
3. No typos in variable names
4. Values are properly quoted if they contain special characters

Run `npm run check-env` (if available) to verify your environment setup.

