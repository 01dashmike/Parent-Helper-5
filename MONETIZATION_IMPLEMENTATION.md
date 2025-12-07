# Monetization Layer Implementation

This document describes the monetization features implemented for Parent Helper.

## Overview

The monetization layer includes:
1. **Class Boosts** - Providers can pay to boost their classes in search results
2. **Membership Subscriptions** - Parents can subscribe to PLUS or PREMIUM tiers for benefits
3. **Affiliate Links** - Partner offers with click tracking and rewards
4. **Booking Revenue Tracking** - Track all booking payments for analytics

## Database Schema

### New Tables

1. **class_boosts** - Tracks paid boosts for classes
   - `provider_id`, `class_id`, `plan` (BOOST_WEEKLY/BOOST_MONTHLY)
   - `amount_cents`, `status`, `expires_at`
   - `stripe_checkout_session_id`, `stripe_subscription_id`

2. **user_subscriptions** - Tracks parent membership subscriptions
   - `user_id`, `subscription_tier` (FREE/PLUS/PREMIUM)
   - `stripe_customer_id`, `stripe_subscription_id`
   - `status`, `current_period_start`, `current_period_end`

3. **affiliate_clicks** - Tracks affiliate link clicks
   - `user_id` (optional), `partner`, `url`
   - `reward_points`, `wallet_credit_cents`
   - `status` (pending/awarded/expired)

4. **booking_payments** - Tracks booking revenue
   - `booking_id`, `provider_id`
   - `amount_cents`, `fee_cents`, `net_cents`
   - `stripe_charge_id`, `stripe_payment_intent_id`

## API Endpoints

### Class Boosts
- `POST /api/boosts/checkout` - Create Stripe checkout for boost purchase
  - Body: `{ classId, plan: "BOOST_WEEKLY" | "BOOST_MONTHLY" }`
  - Returns: `{ sessionId, url }`

### Membership Subscriptions
- `POST /api/membership/checkout` - Create Stripe checkout for subscription
  - Body: `{ tier: "PLUS" | "PREMIUM" }`
  - Returns: `{ sessionId, url }`

### Affiliate Tracking
- `POST /api/affiliate/click` - Record affiliate link click
  - Body: `{ partner, url, rewardPoints?, walletCreditCents? }`
  - Returns: `{ success, clickId }`

### Webhooks
- `POST /api/monetization/webhook` - Handles Stripe webhooks for:
  - Boost purchase completion
  - Subscription updates (created/updated/deleted)
  - User tier synchronization

## Stripe Configuration

### Required Products & Prices

Create these in Stripe Dashboard:

1. **BOOST_WEEKLY** (Product)
   - Set `STRIPE_BOOST_WEEKLY_PRODUCT_ID` env var

2. **BOOST_MONTHLY** (Product)
   - Set `STRIPE_BOOST_MONTHLY_PRODUCT_ID` env var

3. **PLUS Membership** (Subscription)
   - Price: £4.99/month
   - Set `STRIPE_PLUS_PRICE_ID` env var

4. **PREMIUM Membership** (Subscription)
   - Price: £9.99/month
   - Set `STRIPE_PREMIUM_PRICE_ID` env var

### Webhook Configuration

Configure Stripe webhook endpoint:
- URL: `https://your-domain.com/api/monetization/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

## Membership Benefits

### FREE Tier
- No benefits

### PLUS Tier (£4.99/month)
- +10% wallet credit bonus on each booking
- Access to standard features

### PREMIUM Tier (£9.99/month)
- +20% wallet credit bonus on each booking
- Exclusive blog content
- Discounted classes
- All PLUS benefits

## Search Ranking

Classes are ranked by:
1. **Paid Boosts** (highest priority)
   - BOOST_MONTHLY: +2000 score
   - BOOST_WEEKLY: +1500 score
2. **Plan Boosts** (subscription-based)
   - +1000 score + plan boost value
3. **Featured Flag**
   - +500 score
4. **Popularity & Reviews**
   - Base score calculation

## Usage Examples

### Provider Buying a Boost

```typescript
const response = await fetch("/api/boosts/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    classId: 123,
    plan: "BOOST_MONTHLY",
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

### Parent Subscribing to PLUS

```typescript
const response = await fetch("/api/membership/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tier: "PLUS",
  }),
});

const { url } = await response.json();
window.location.href = url;
```

### Applying Subscription Benefits at Checkout

```typescript
import { getUserSubscriptionTier, calculateWalletCreditBonus } from "@/lib/membership-benefits";

const tier = await getUserSubscriptionTier(userId);
const bookingAmountCents = 5000; // £50.00
const bonusCents = calculateWalletCreditBonus(bookingAmountCents, tier);
// PLUS: 500 cents (£5.00), PREMIUM: 1000 cents (£10.00)
```

### Displaying Affiliate Offers

```tsx
import { AffiliateGrid } from "@/components/affiliate/AffiliateCard";

const offers = [
  {
    partner: "partner-name",
    title: "Special Offer",
    description: "Get 10% off",
    url: "https://partner.com/offer",
    rewardPoints: 100,
    walletCreditCents: 500,
  },
];

<AffiliateGrid offers={offers} />
```

## Testing

### E2E Test Scenarios

1. **Provider Boost Purchase**
   - Provider logs in
   - Selects class to boost
   - Completes Stripe checkout
   - Verifies class appears first in search results

2. **Parent Subscription Benefits**
   - Parent subscribes to PLUS
   - Makes a booking
   - Verifies 10% wallet credit bonus applied
   - Upgrades to PREMIUM
   - Verifies 20% bonus on next booking

3. **Affiliate Tracking**
   - User clicks affiliate link
   - Verifies click recorded in database
   - Verifies reward points/wallet credit pending

## Environment Variables

```bash
# Stripe Product IDs
STRIPE_BOOST_WEEKLY_PRODUCT_ID=prod_xxx
STRIPE_BOOST_MONTHLY_PRODUCT_ID=prod_xxx

# Stripe Price IDs
STRIPE_PLUS_PRICE_ID=price_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx

# Webhook Secret (shared with existing webhook)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Next Steps

1. Create Stripe products and prices in dashboard
2. Configure webhook endpoint in Stripe
3. Add UI components for boost purchase in provider dashboard
4. Add membership subscription UI in parent account area
5. Create affiliate offers management interface
6. Build admin analytics dashboard for revenue tracking
7. Implement cron job to award affiliate rewards
8. Add E2E tests using Playwright

## Notes

- Booking payment tracking currently works for `bookings` table (integer IDs)
- `simple_bookings` uses UUIDs and needs mapping for payment tracking
- Subscription tier is synced via webhook to `user_subscriptions` table
- Boost expiration is handled automatically (expired boosts don't affect ranking)
- Platform fee defaults to 7% but can be customized per provider

