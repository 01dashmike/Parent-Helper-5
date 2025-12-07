# AI Personalisation System

AI-powered personalisation across web and email, powered by saved family profiles and activity.

## Features

- ✅ **Personalized Home Page**: Server-rendered `/home` with age-appropriate, nearby, and popular classes
- ✅ **Recommendation Engine**: Multi-factor scoring (age fit, distance, popularity, quality, novelty)
- ✅ **Weekly Tailored Newsletter**: Dynamic email with personalized content blocks
- ✅ **Saved Search Digests**: Automated emails when new classes match saved searches
- ✅ **Family Profiles**: Household and child profiles with interests, allergies, accessibility needs
- ✅ **Admin Controls**: Dashboard for managing weights, rebuilding recs, and monitoring
- ✅ **Privacy & Consent**: Full control over data usage and opt-in/opt-out

## Setup

### 1. Enable Feature Flags

Add to your `.env.local`:

```bash
PERSONALIZATION_ENABLED=true
AUTO_RECS_ON_SIGNIN=true
NEWSLETTER_ENABLED=true
RECS_WEIGHTS='{"w_age_fit":0.35,"w_distance":0.2,"w_pop":0.2,"w_quality":0.2,"w_novelty":0.05}'
RECS_MAX_RADIUS_KM=20
NEWSLETTER_BATCH_SIZE=500
```

### 2. Run Database Migration

```bash
psql $DATABASE_URL -f supabase/migrations/20250117_ai_personalisation.sql
```

### 3. Set Up Cron Jobs

**Refresh Provider Quality Cache** (hourly):
```bash
curl -X POST https://yourdomain.com/api/personalisation/refresh-quality \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Send Weekly Newsletters** (weekly, e.g., Monday 9am):
```bash
curl -X POST https://yourdomain.com/api/personalisation/newsletter/weekly \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Send Saved Search Digests** (daily):
```bash
curl -X POST https://yourdomain.com/api/personalisation/saved-search-digest \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Database Schema

### family_profiles
- Stores household information, location, and marketing preferences
- One per user (unique constraint on user_id)

### child_profiles
- Stores child information with computed age_months field
- Multiple children per family

### user_preferences
- Stores search preferences, radius, preferred days/times/categories
- Newsletter frequency settings

### recommendations
- Stores generated recommendations with scores and rationales
- 7-day TTL (expires_at)
- Unique constraint on (user_id, class_id, generated_at)

### provider_quality_cache
- Cached provider quality scores (reviews, completion rate)
- Refreshed hourly

## Recommendation Engine

### Scoring Formula

```
score = w_age_fit * age_fit_score
      + w_distance * distance_score
      + w_pop * popularity_score
      + w_quality * quality_score
      + w_novelty * novelty_score
```

**Default Weights:**
- Age Fit: 0.35
- Distance: 0.2
- Popularity: 0.2
- Quality: 0.2
- Novelty: 0.05

### Factors

1. **Age Fit**: 1.0 if class age range includes child age, else decays with distance
2. **Distance**: 1.0 at 0km → 0.0 at max radius (linear decay)
3. **Popularity**: Min-max normalized booking counts (last 30 days)
4. **Quality**: Provider quality score normalized to 0-1 (from provider_quality_cache)
5. **Novelty**: 1.0 for unseen classes, 0.2 for previously viewed/booked

### Building Recommendations

Recommendations are built:
- On user sign-in (if AUTO_RECS_ON_SIGNIN enabled)
- When profile is created/updated
- When saved search is created/updated
- Manually via admin dashboard

## Personalized Home Page

Route: `/home` (server-rendered)

**Sections:**
1. **Header**: Greeting with household name, location chip, child age chips
2. **Age-Appropriate**: Classes matching child's age
3. **Close to You**: Distance-sorted classes
4. **Popular**: Popularity + quality-weighted classes
5. **Continue Where Left Off**: Recent bookings/views

**Fallbacks:**
- If no profile: Shows QuickStartProfile modal
- If no recommendations: Shows "Building recommendations..." message
- If no location: Falls back to national popular classes

## Quick Profile Flow

Component: `QuickStartProfile`

**Step 1:**
- Household name (required)
- Postcode (optional)
- Marketing opt-in checkbox

**Step 2:**
- Child name (optional)
- Birthdate (required)
- Interests (chips)
- Allergies (chips)

**Entry Points:**
- After OTP/magic-link sign-in
- On first "Save Alert" if no profile
- Manual trigger from account settings

## Weekly Newsletter

**Content Blocks:**
- "For {child_name}, this week" - Age-appropriate classes
- "Near {postcode_area}" - Local classes
- "Editor's Picks" - Quality + popularity weighted
- "Because you looked at {category}" - Category-based

**Sending:**
- Only to users with `newsletter_frequency='weekly'` and `marketing_opt_in=true`
- Respects unsubscribe preferences
- Includes unsubscribe footer

## Saved Search Digests

**Trigger:**
- Based on `cadence` field (default: 'weekly')
- Checks `last_sent_at` to determine if due

**Content:**
- Top 6 new classes since last digest
- Links to view all matching classes
- Unsubscribe link for specific search

## Admin Dashboard

Route: `/admin/personalisation`

**Features:**
- Stats cards (profiles, recommendations, 24h recs, newsletter status)
- Feature flag toggles (read-only, set via ENV)
- Recommendation weight sliders
- Rebuild recommendations for specific user
- Refresh provider quality cache

## Privacy & Consent

**Privacy Page:** `/privacy/personalisation`

Explains:
- What data is used
- How it's used
- User controls
- Data security

**Consent:**
- `family_profiles.marketing_opt_in` controls email sending
- `user_preferences.newsletter_frequency` controls frequency ('off'|'weekly'|'biweekly')
- All emails include unsubscribe links

## Integration Hooks

Call these from your existing flows:

```typescript
import { onUserSignin, onProfileUpdate, onSavedSearchChange } from "@/lib/personalisation/integrations";

// After sign-in
await onUserSignin(userId);

// After profile update
await onProfileUpdate(userId);

// After saved search change
await onSavedSearchChange(userId);
```

## API Endpoints

- `GET /api/personalisation/recommendations` - Get recommendations for current user
- `POST /api/personalisation/recommendations` - Build recommendations (current user or admin)
- `POST /api/personalisation/refresh-quality` - Refresh provider quality cache
- `POST /api/personalisation/newsletter/weekly` - Send weekly newsletters (cron)
- `POST /api/personalisation/saved-search-digest` - Send saved search digests (cron)

## Testing

**Unit Tests:**
```bash
npm test -- personalisation
```

**Test Utilities:**
```typescript
import { createTestProfile, testBuildRecommendations } from "@/lib/personalisation/test-utils";

// Create test profile
await createTestProfile({
  userId: "user-uuid",
  householdName: "Test Family",
  postcode: "SW1A 1AA",
  childBirthdate: "2023-01-15",
});

// Test recommendation building
await testBuildRecommendations("user-uuid");
```

**E2E Tests:**
- Sign-in → quick profile → see personalized sections
- Create saved search → receive digest
- Toggle newsletter off → ensure not sent

## Guardrails & Fallbacks

1. **Missing Location**: Infers city from postcode or falls back to national popular
2. **No Children**: Shows interest-based + location-weighted popular classes
3. **Engine Failure**: Returns empty recs silently; UI shows helpful placeholders
4. **Server Actions**: Zod validation, try/catch with error logs; never crashes page
5. **RLS**: All tables have proper RLS policies; users can only access their own data

## Environment Variables

```bash
# Feature Flags
PERSONALIZATION_ENABLED=true
AUTO_RECS_ON_SIGNIN=true
NEWSLETTER_ENABLED=true

# Recommendation Engine
RECS_WEIGHTS='{"w_age_fit":0.35,"w_distance":0.2,"w_pop":0.2,"w_quality":0.2,"w_novelty":0.05}'
RECS_MAX_RADIUS_KM=20

# Newsletter
NEWSLETTER_BATCH_SIZE=500

# Cron
CRON_SECRET=your_secret_here
```

## Troubleshooting

### Recommendations not generating
- Check `PERSONALIZATION_ENABLED=true`
- Verify user has family profile
- Check `recommendations` table for errors
- Review server logs for scoring errors

### Newsletter not sending
- Check `NEWSLETTER_ENABLED=true`
- Verify user has `marketing_opt_in=true`
- Check `newsletter_frequency='weekly'`
- Review cron job logs

### Home page not personalized
- Verify user is signed in
- Check if profile exists
- Ensure recommendations table has data
- Check `expires_at` hasn't passed

