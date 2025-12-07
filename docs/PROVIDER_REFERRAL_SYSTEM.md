# Provider Referral System Documentation

## Overview

The Provider Referral System enables providers to invite other providers to join Parent Helper and earn rewards (free boosts or credits) when their referrals complete key milestones.

## Architecture

### Database Schema

#### `provider_referrals`
Tracks individual referral events and their progression through the funnel.

- `id` (uuid, PK)
- `provider_id` (integer, FK → providers.id)
- `referral_code` (text, unique) - Format: `PH-ABC123`
- `referred_provider_id` (integer, FK → providers.id, nullable)
- `status` (enum): `clicked`, `registered`, `listing_created`, `first_booking`
- `reward_issued` (boolean)
- `created_at`, `updated_at`

#### `provider_rewards`
Stores rewards issued to providers.

- `id` (uuid, PK)
- `provider_id` (integer, FK → providers.id)
- `reward_type` (enum): `credit`, `free_boost`, `discount`
- `reward_value` (numeric) - Amount in pence for credit, count for boosts, percentage for discount
- `reason` (text) - e.g., "Referral: first booking completed"
- `expires_at` (timestamp, nullable) - Default: 90 days
- `used_at` (timestamp, nullable)
- `created_at`

#### `provider_referral_analytics`
Aggregated statistics per provider (auto-updated via trigger).

- `provider_id` (integer, PK, FK → providers.id)
- `clicks` (integer)
- `registrations` (integer)
- `listings_created` (integer)
- `conversions` (integer) - First bookings
- `last_updated` (timestamp)

#### `provider_email_tests`
Tracks A/B test variants for email campaigns.

- `id` (uuid, PK)
- `provider_id` (integer, FK → providers.id)
- `email_type` (text) - e.g., `weekly_growth_report`
- `variant` (text) - `A` or `B`
- `sent_at`, `opened_at`, `clicked_at`, `converted_at`
- `metadata` (jsonb)

## Referral Flow

### 1. Code Generation
- Provider requests referral code via `/api/provider/referrals/generate`
- Server action `createReferralCode()` generates unique code: `PH-XXXXXX`
- Code stored in `provider_referrals` with initial status `clicked`
- Returns shareable URL: `https://parenthelper.co.uk/provider/ref/{code}`

### 2. Click Tracking
- User visits `/provider/ref/{code}`
- Page tracks click via `POST /api/referral/track` with `stage: "clicked"`
- Creates new record in `provider_referrals`
- Updates `provider_referral_analytics.clicks` (via trigger)
- Sets cookie `referral_code` for 30 days
- Redirects to provider signup

### 3. Registration Tracking
- When referred provider registers, call:
  ```typescript
  POST /api/referral/track
  {
    referral_code: "PH-ABC123",
    stage: "registered",
    referred_provider_id: 123
  }
  ```

### 4. Listing Creation Tracking
- When referred provider creates first listing:
  ```typescript
  POST /api/referral/track
  {
    referral_code: "PH-ABC123",
    stage: "listing_created",
    referred_provider_id: 123
  }
  ```

### 5. First Booking (Conversion)
- When referred provider completes first booking:
  ```typescript
  POST /api/referral/track
  {
    referral_code: "PH-ABC123",
    stage: "first_booking",
    referred_provider_id: 123
  }
  ```
- System automatically:
  - Updates referral status
  - Issues reward via `createReward()`
  - Sends email notification
  - Marks `reward_issued = true`

## Reward Logic

### Reward Determination
```typescript
if (provider.featured_listings_count < 3) {
  reward_type = "free_boost"
  reward_value = 1
} else {
  reward_type = "credit"
  reward_value = 1500 // £15 in pence
}
```

### Reward Expiration
- All rewards expire 90 days after issuance
- Tracked via `expires_at` field

## Provider Dashboard

### Component: `ReferralsDashboard`
Location: `components/provider/ReferralsDashboard.tsx`

**Features:**
- Display referral link with copy/share buttons
- Stats grid: Clicks, Registrations, Listings, Bookings
- Conversion funnel visualization (Framer Motion)
- Rewards list with expiration dates
- Generate referral code button

### API Endpoints

#### `GET /api/provider/referrals`
Returns provider's referral data:
```json
{
  "referral_code": "PH-ABC123",
  "referral_url": "https://parenthelper.co.uk/provider/ref/PH-ABC123",
  "analytics": {
    "clicks": 10,
    "registrations": 5,
    "listings_created": 3,
    "conversions": 1
  },
  "rewards": [...]
}
```

#### `POST /api/provider/referrals/generate`
Generates new referral code for provider.

#### `POST /api/referral/track`
Tracks referral progression (see flow above).

## Email Integration

### Weekly Growth Report

The referral section is automatically included in weekly growth emails via `generateReferralEmailSection()`.

**Logic:**
1. Fetch provider's referral analytics
2. Check for recent rewards (last 7 days)
3. Determine A/B variant: `provider_id % 2`
4. Generate HTML/text content based on activity

**Content Variants:**

**Variant A:** "Invite another provider → earn free boosts."
**Variant B:** "Grow your presence → help parents discover more classes."

**Email Sections:**

1. **Reward Celebration** (if reward earned):
   ```
   🎉 You earned a reward!
   [Reward details]
   ```

2. **Activity Stats** (if clicks > 0):
   ```
   Your referral link was clicked X times this week.
   [AI tip if conversions == 0]
   ```

3. **No Activity** (if clicks == 0):
   ```
   You haven't shared your referral link yet.
   Earn free boosts by inviting local class providers.
   ```

4. **CTA Button** (always shown if referral code exists)

### A/B Testing

- Variant assignment: `provider_id % 2`
- Tracked in `provider_email_tests` table
- Events: `sent`, `opened`, `clicked`, `converted`

## Health Checks

### Missing Index Check
```sql
-- Ensure fast lookups on referral_code
CREATE INDEX IF NOT EXISTS provider_referrals_code_idx 
ON provider_referrals(referral_code);
```

### Logging
All key events are logged:
- Referred provider registration
- First booking event
- Reward issuance
- Email opens/clicks

## Testing

### Unit Tests

**File:** `__tests__/referrals.test.ts`

```typescript
describe("createReferralCode", () => {
  it("generates unique codes", async () => {
    // Test uniqueness
  });
});

describe("referral tracking", () => {
  it("progresses through state machine correctly", () => {
    // Test state transitions
  });
});

describe("reward issuance", () => {
  it("issues free boost for providers with <3 boosts", () => {
    // Test reward logic
  });
  
  it("issues credit for providers with >=3 boosts", () => {
    // Test reward logic
  });
});
```

### Playwright Tests

**File:** `e2e/provider-referrals.spec.ts`

```typescript
test("provider referral flow", async ({ page }) => {
  // 1. Provider generates referral code
  // 2. Visit referral link
  // 3. Register referred provider
  // 4. Create listing
  // 5. Trigger booking API
  // 6. Verify reward visible in dashboard
});
```

## Recommended Sharing Channels

Providers should share referral links via:

1. **Facebook Groups**
   - Local parenting groups
   - Business networking groups
   - Expected: 2-4 leads per post

2. **WhatsApp**
   - Business contacts
   - Local provider networks

3. **Email**
   - Newsletter to existing contacts
   - Direct outreach to complementary businesses

4. **Instagram**
   - Stories with referral link
   - Bio link

5. **LinkedIn**
   - Business network posts
   - Direct messages

## Environment Variables

```bash
PROVIDER_REFERRALS_ENABLED=true
NEXT_PUBLIC_SITE_URL=https://parenthelper.co.uk
```

## Feature Flag

Enable via: `PROVIDER_REFERRALS_ENABLED=true`

## Database Migration

Run migration: `supabase/migrations/20250125_provider_referrals.sql`

## API Reference

### Create Referral Code
```typescript
POST /api/provider/referrals/generate
Authorization: Required (provider)
Response: { ok: true, code: "PH-ABC123", url: "..." }
```

### Track Referral
```typescript
POST /api/referral/track
Body: {
  referral_code: string,
  stage: "clicked" | "registered" | "listing_created" | "first_booking",
  referred_provider_id?: number
}
```

### Get Referral Data
```typescript
GET /api/provider/referrals
Authorization: Required (provider)
Response: {
  referral_code: string | null,
  referral_url: string | null,
  analytics: {...},
  rewards: [...]
}
```

## Future Enhancements

- QR code generation for referral links
- Referral leaderboard
- Tiered rewards (more conversions = better rewards)
- Social sharing buttons with pre-filled messages
- Referral analytics dashboard with charts
- Email templates customization

