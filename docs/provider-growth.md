# Provider Growth Score System

## Overview

The Provider Growth Score is a unified metric (0-100) that measures overall provider performance and determines visibility boosts in search results. It combines five key components:

- **Profile Completion** (10% weight)
- **Listing Quality** (20% weight)
- **Booking Activity** (30% weight)
- **Reviews Score** (20% weight)
- **Referral Activity** (20% weight)

## Growth Score Formula

```
growth_score = 
  (profile_completion * 0.10) +
  (listing_quality * 0.20) +
  (booking_activity * 0.30) +
  (reviews_score * 0.20) +
  (referral_activity * 0.20)
```

## Tier System & Multipliers

Growth Score determines visibility boost tiers:

| Score Range | Tier | Multiplier | Visibility Boost |
|------------|------|------------|------------------|
| 80-100 | Gold | 1.30x | +30% exposure |
| 60-79 | Silver | 1.15x | +15% exposure |
| 40-59 | Bronze | 1.05x | +5% exposure |
| 0-39 | None | 1.0x | No boost |

## Component Scoring

### Profile Completion (0-100)

- Has description: +20 points
- Has contact info: +20 points
- Has classes: +25 points
- Has photos: +20 points
- Has social links: +15 points

### Listing Quality (0-100)

- Active class ratio: up to 30 points
- Average class rating: up to 30 points
- Classes with photos: up to 20 points
- Classes with descriptions: up to 20 points

### Booking Activity (0-100)

- Total bookings: up to 30 points
- Recent bookings (30 days): up to 30 points
- Revenue (30 days): up to 20 points
- Conversion rate: up to 20 points

### Reviews Score (0-100)

- Review count: up to 40 points
- Average rating: up to 40 points
- Recent reviews: up to 20 points

### Referral Activity (0-100)

- Referral registration: +5 points each
- Listing created: +15 points each
- First booking: +30 points each
- Capped at 100 points

## Visibility Boosts

Visibility boosts are automatically assigned based on Growth Score tiers and applied to:

- Search ranking
- Home page "suggested" surfacing
- "Popular classes in your area" sort

Boosts expire after 7 days and are recalculated weekly.

## Next Best Action

The system uses AI (OpenAI GPT-4o-mini) to suggest the single highest-impact action a provider should take next. Suggestions are based on:

- Current Growth Score components
- Weak performance areas
- Provider context (classes, activity)

Each suggestion includes:
- **Title**: Short action title
- **Explanation**: Why this matters
- **Estimated Impact**: Expected improvement
- **Suggested Deadline**: When to complete
- **Dashboard Link**: Direct link to relevant section

## Weekly Email Report

Every Sunday at midnight, providers receive a weekly email with:

1. **Growth Score Summary**: Current score, tier, and visibility boost status
2. **Referral Performance**: Clicks → bookings conversion
3. **Next Best Action**: AI-generated suggestion with CTA
4. **Special Offers**: Location-based promotions

### A/B Testing

Emails are A/B tested with two variants:
- **Variant A**: "Your Growth Score: X/100 - Y Tier"
- **Variant B**: "Improve Your Visibility: Y Tier Active"

Results are tracked in `provider_email_tests` table.

## API Endpoints

### GET `/api/providers/growth-score?provider_id={id}`

Returns current Growth Score and metrics.

**Response:**
```json
{
  "growthScore": 75.5,
  "tier": "Silver",
  "multiplier": 1.15,
  "metrics": {
    "profile_completion": 80,
    "listing_quality": 70,
    "booking_activity": 75,
    "reviews_score": 80,
    "referral_activity": 60
  },
  "weekStart": "2024-01-07"
}
```

### POST `/api/providers/next-action`

Generates AI-powered next best action suggestion.

**Request:**
```json
{
  "provider_id": 123
}
```

**Response:**
```json
{
  "title": "Complete your profile",
  "explanation": "A complete profile helps families trust your classes...",
  "estimatedImpact": "+20% more profile views",
  "suggestedDeadline": "This week",
  "dashboardLink": "/provider/profile"
}
```

### GET `/api/providers/visibility-boost?provider_id={id}`

Returns current visibility boost status.

**Response:**
```json
{
  "boost_type": "Silver",
  "multiplier": 1.15,
  "expires_at": "2024-01-14T00:00:00Z"
}
```

## Cron Jobs

### Weekly Growth Score Recalculation

**Endpoint:** `POST /api/cron/weekly-growth-score`

**Schedule:** Every Sunday at 00:00 UTC

**Actions:**
1. Recalculates Growth Score for all active providers
2. Assigns visibility boosts based on tiers
3. Updates `provider_growth_score` table
4. Updates `provider_visibility_boosts` table

### Weekly Analytics & Email

**Endpoint:** `POST /api/cron/provider-weekly-analytics`

**Schedule:** Every Sunday at 00:00 UTC

**Actions:**
1. Aggregates weekly metrics
2. Calculates Growth Score
3. Generates Next Best Action
4. Sends weekly email with unified insights
5. Tracks A/B test variants

## Database Tables

### `provider_growth_score`

Stores weekly Growth Score calculations.

- `provider_id`: Provider ID
- `week_start`: Sunday of the week
- `growth_score`: Calculated score (0-100)
- `metrics_json`: Component scores
- `next_best_action`: JSON string of next action

### `provider_visibility_boosts`

Stores active visibility boosts.

- `provider_id`: Provider ID
- `boost_type`: "Bronze" | "Silver" | "Gold"
- `multiplier`: Boost multiplier (1.05, 1.15, 1.30)
- `expires_at`: When boost expires

### `provider_referral_analytics`

Tracks referral events for Growth Score calculation.

- `provider_id`: Provider ID
- `referral_id`: Reference to referrals table
- `event_type`: "registration" | "listing_created" | "first_booking"
- `points`: Points awarded (5, 15, or 30)

### `provider_email_tests`

Tracks A/B test results for weekly emails.

- `provider_id`: Provider ID
- `variant_id`: "A" or "B"
- `sent_at`: When email was sent
- `open_rate`: Email open rate (0.0-1.0)
- `click_rate`: Email click rate (0.0-1.0)
- `conversion`: Whether provider took action

## Dashboard Components

### Growth Score Widget

Displays:
- Current Growth Score (0-100)
- Tier badge (Bronze/Silver/Gold)
- Visibility boost status
- Component breakdown with contribution scores
- Next Best Action card

### Visibility Boost Badge

Shows active boost status with:
- Boost tier
- Multiplier percentage
- Expiration date

## Integration with Search

To apply visibility boosts to search results, update your search query to include:

```sql
SELECT 
  c.*,
  COALESCE(pvb.multiplier, 1.0) as visibility_multiplier,
  (base_ranking_score * COALESCE(pvb.multiplier, 1.0)) as boosted_score
FROM classes c
LEFT JOIN providers p ON c.provider_id = p.id
LEFT JOIN provider_visibility_boosts pvb ON p.id = pvb.provider_id
WHERE pvb.expires_at > NOW() OR pvb.expires_at IS NULL
ORDER BY boosted_score DESC
```

## Testing

### Unit Tests

Test files:
- `lib/growth-score.test.ts`: Growth Score calculation logic
- `lib/visibility-boost.test.ts`: Boost assignment logic

### Integration Tests

Test files:
- `tests/integration/growth-score.test.ts`: Full pipeline test
- `tests/integration/visibility-boost.test.ts`: Boost assignment and search integration

### E2E Tests

Test files:
- `tests/e2e/provider-growth-dashboard.spec.ts`: Dashboard UI tests
- `tests/e2e/weekly-email.spec.ts`: Email rendering tests

## Examples

### Example Growth Score Calculation

Provider with:
- Profile completion: 80/100
- Listing quality: 70/100
- Booking activity: 75/100
- Reviews score: 80/100
- Referral activity: 60/100

Calculation:
```
(80 * 0.10) + (70 * 0.20) + (75 * 0.30) + (80 * 0.20) + (60 * 0.20)
= 8 + 14 + 22.5 + 16 + 12
= 72.5
```

Result: **Silver Tier** (1.15x visibility boost)

### Example Next Best Action

For a provider with low referral activity:

```json
{
  "title": "Share your referral link",
  "explanation": "Refer other providers to Parent Helper and earn rewards. Every referral helps grow the platform.",
  "estimatedImpact": "+10% growth score boost",
  "suggestedDeadline": "This week",
  "dashboardLink": "/provider/referrals"
}
```

## Troubleshooting

### Growth Score Not Updating

1. Check cron job is running: `POST /api/cron/weekly-growth-score`
2. Verify `provider_referral_analytics` has data
3. Check provider metrics are being tracked

### Visibility Boost Not Applied

1. Verify Growth Score is >= 40
2. Check `provider_visibility_boosts` table has active record
3. Ensure boost hasn't expired (`expires_at > NOW()`)
4. Verify search query includes multiplier

### Next Best Action Not Generating

1. Check OpenAI API key is set (`OPENAI_API_KEY`)
2. Verify Growth Score exists for provider
3. Check fallback logic is working

## Future Enhancements

- Historical trend charts (7/30 day sparklines)
- Referral funnel visualization
- Growth Score leaderboard
- Tier-based rewards program
- Multi-language support for emails

