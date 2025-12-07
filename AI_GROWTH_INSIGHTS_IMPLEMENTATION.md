# AI Growth Insights Engine Implementation

This document outlines the complete implementation of the AI Growth Insights Engine for Parent Helper.

## Overview

The AI Growth Insights Engine automatically generates weekly human-readable summaries and recommendations based on growth metrics from the Growth Loop Dashboard. It uses OpenAI (GPT-4o-mini or GPT-5-turbo) to analyze metrics and provide actionable insights.

## Database Structure

### Migration: `supabase/migrations/20250122_ai_growth_insights.sql`

**Table Created:**

**insights_reports**
- `id` (uuid, primary key)
- `week_start` (date) - Monday of the week
- `summary_text` (text) - AI-generated 5-bullet summary
- `ai_actions` (text) - JSON array of recommended actions
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS Policies:**
- Service role can manage all reports
- Authenticated users can view reports (for admin dashboard)

## API Endpoints

### 1. `/api/admin/insights` (GET)
- **Purpose**: Fetch latest 4 insight reports
- **Authentication**: Admin cookie required
- **Response**: `{ reports: InsightReport[] }`
- **Features**: Parses JSON `ai_actions` for frontend consumption

### 2. `/api/admin/insights` (POST)
- **Purpose**: Manually trigger insight generation
- **Authentication**: Admin cookie required
- **Response**: `{ success: true, report: InsightReport }`
- **Behavior**: Generates insights for current week, updates if exists

### 3. `/api/admin/insights/generate` (GET)
- **Purpose**: Cron job endpoint to generate weekly insights
- **Authentication**: CRON_SECRET or Vercel Cron header
- **Schedule**: Every Monday at 9:00 AM UTC
- **Behavior**: Same as POST `/api/admin/insights` but for automated runs

### 4. `/api/admin/insights/digest` (POST)
- **Purpose**: Send weekly email digest
- **Authentication**: CRON_SECRET or Vercel Cron header
- **Schedule**: Every Monday at 10:00 AM UTC (1 hour after generation)
- **Recipients**: 
  - Admin email (from `ADMIN_EMAIL` or `SENDGRID_ADMIN_EMAIL`)
  - Opted-in providers (from `providers` table where `insights_email_opt_in = true`)
- **Email Content**: 
  - Week start date
  - Key insights (summary bullets)
  - Top recommendation
  - Link to admin dashboard

## Admin UI

### Page: `/admin/analytics/insights`

**Components:**
- `AIInsightsClient` - Main client component with:
  - Latest report display with animated bullets
  - "Regenerate" button for manual generation
  - Previous reports list
  - Loading and error states
  - Framer Motion animations

**Features:**
- Real-time updates after regeneration
- Animated list items with staggered delays
- Icons for insights (TrendingUp) and actions (Target)
- Responsive design matching Parent Helper design system

## Data Flow

1. **Weekly Cron Job** (Monday 9 AM):
   - `/api/admin/insights/generate` is triggered
   - Fetches latest metrics from `growth_metrics_view`
   - Calculates derived metrics (conversion rates, changes)
   - Calls OpenAI API with formatted prompt
   - Stores result in `insights_reports` table

2. **Email Digest** (Monday 10 AM):
   - `/api/admin/insights/digest` is triggered
   - Fetches latest report
   - Sends formatted email via SendGrid
   - Includes summary and top recommendation

3. **Manual Generation**:
   - Admin clicks "Regenerate" in UI
   - POST to `/api/admin/insights`
   - Same flow as cron job
   - UI updates automatically

## Metrics Analyzed

The system analyzes the following metrics from `growth_metrics_view`:

- **total_revenue** - Total booking revenue
- **active_users** - Distinct users with bookings
- **wallet_credits** - Total wallet credits issued
- **referral_conversion_rate** - Calculated from referrals/conversions
- **avg_wallet_balance** - Average wallet balance
- **campaign_open_rate** - Email open rate
- **total_referrals** - Number of referrals
- **conversions** - Number of converted referrals
- **emails_sent/opened/clicked** - Email campaign metrics
- **marketing_conversions** - Marketing campaign conversions

**Week-over-week comparisons:**
- Revenue change percentage
- Active users change percentage

## OpenAI Integration

**Model**: `gpt-4o-mini` (configurable via `OPENAI_MODEL` env var)

**Prompt Structure:**
- System message: Growth analyst persona
- User message: Formatted metrics with current and previous week data
- Response format: JSON with `summary` and `actions` fields

**Response Format:**
```json
{
  "summary": "Bullet 1\nBullet 2\nBullet 3\nBullet 4\nBullet 5",
  "actions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}
```

## Feature Flag

**Environment Variable**: `AI_INSIGHTS_ENABLED=true`

**Function**: `isAIInsightsEnabled()` in `lib/env.ts`

**Behavior**: 
- When disabled, API returns empty results
- UI shows disabled message
- Cron jobs skip execution

## Cron Job Configuration

**File**: `vercel.json`

**Jobs**:
1. Generate insights: Monday 9:00 AM UTC (`/api/admin/insights/generate`)
2. Send digest: Monday 10:00 AM UTC (`/api/admin/insights/digest`)

**Authentication**: 
- Vercel Cron jobs include `x-vercel-cron` header
- Manual triggers require `CRON_SECRET` Bearer token

## Email Template

**Subject**: "Weekly Growth Insights - Week of [Date]"

**Content**:
- Week start date
- Key insights (bulleted list)
- Top recommendation (highlighted)
- Link to admin dashboard

**Styling**: HTML email with Parent Helper branding colors (#2d5016)

## Environment Variables

Required:
```bash
# Feature Flag
AI_INSIGHTS_ENABLED=true

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini

# Email
ADMIN_EMAIL=admin@parenthelper.co.uk
SENDGRID_API_KEY=...
EMAIL_FROM=...

# Cron Security (optional)
CRON_SECRET=your-secret-token

# Supabase (already configured)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   # Apply migration to Supabase
   # File: supabase/migrations/20250122_ai_growth_insights.sql
   ```

2. **Set Environment Variables**:
   - Add `AI_INSIGHTS_ENABLED=true`
   - Ensure `OPENAI_API_KEY` is set
   - Configure `ADMIN_EMAIL` for digest recipients

3. **Deploy**:
   - Push changes to repository
   - Vercel will automatically configure cron jobs
   - First insights will be generated next Monday

4. **Optional: Provider Opt-in**:
   - Add `insights_email_opt_in` boolean column to `providers` table
   - Set to `true` for providers who want weekly insights

## Testing

### Manual Testing Checklist

1. **Generate Insights**:
   - [ ] Visit `/admin/analytics/insights`
   - [ ] Click "Regenerate" or "Generate First Report"
   - [ ] Verify report appears with insights and actions
   - [ ] Check database for new entry in `insights_reports`

2. **View Reports**:
   - [ ] Verify latest report displays correctly
   - [ ] Check previous reports list
   - [ ] Verify animations work smoothly

3. **Email Digest**:
   - [ ] Manually trigger `/api/admin/insights/digest` (POST)
   - [ ] Check email logs for sent digest
   - [ ] Verify email content matches report

4. **Cron Jobs**:
   - [ ] Wait for Monday 9 AM UTC or manually trigger
   - [ ] Verify insights generated
   - [ ] Wait for Monday 10 AM UTC or manually trigger
   - [ ] Verify email sent

## Error Handling

- **No metrics available**: Returns error message
- **OpenAI API failure**: Logs error, returns 500
- **Database errors**: Logs error, returns 500
- **Email send failure**: Logs error but doesn't fail request
- **Missing env vars**: Returns appropriate error messages

## Performance Considerations

- **Caching**: Reports are stored in database, no real-time generation needed
- **Rate Limiting**: OpenAI API calls are rate-limited by OpenAI
- **Database**: Indexed on `week_start` for fast lookups
- **Email**: Batch sending to multiple recipients via SendGrid

## Future Enhancements

- Daily insights option
- Customizable prompt templates
- Historical trend analysis
- Provider-specific insights
- Slack/Teams integration
- Export to PDF/CSV
- A/B testing of AI prompts

## Notes

- The system uses the existing `growth_metrics_view` materialized view
- Make sure to refresh the view before generating insights: `SELECT refresh_growth_metrics();`
- OpenAI costs are minimal (~$0.01 per report with gpt-4o-mini)
- Reports are unique per week (Monday start)
- Regenerating updates existing report for the week

