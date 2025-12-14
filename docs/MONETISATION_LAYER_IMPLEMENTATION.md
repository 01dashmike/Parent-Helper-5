# Monetisation Layer - Complete Implementation Guide

## ✅ Implementation Status

**Complete monetisation system** for Parent Helper platform, including Featured Listings, Verified Badges, Premium Analytics, and Franchise Bulk Boosting.

---

## 📁 Database Schema

### Tables Created

1. **`provider_subscriptions`** - Main subscription records
   - Links providers to Stripe customers/subscriptions
   - Tracks status, billing periods, trials

2. **`provider_subscription_items`** - Line items within subscriptions
   - Individual products (featured_listing, verified_badge, etc.)
   - Pricing and billing period info

3. **`provider_features`** - Active entitlements
   - Tracks which features are active for each provider
   - Expiration dates and metadata

4. **`provider_featured_listings`** - Featured listing details
   - Priority, targeting (town/category/age)
   - Budget caps and spending

5. **`provider_verified_status`** - Verified badge status
   - Verification timestamp and notes
   - Admin who verified

6. **`franchise_bulk_products`** - Franchisor-level products
   - Bulk featured listing allocations
   - Quantity and allocation tracking

7. **`franchise_provider_allocations`** - Which providers get bulk boosts
   - Links bulk products to specific providers
   - Allocation expiration

8. **`analytics_preview_locks`** - Free preview mode controls
   - Locks/unlocks specific analytics metrics
   - Enables "blurred preview" UX

9. **`monetisation_logs`** - Audit trail
   - All monetisation events
   - Stripe event IDs for reconciliation

10. **`revenue_events`** - ARR/MRR calculations
    - Subscription lifecycle events
    - Revenue tracking by period

### Migration File

`supabase/migrations/20250222000300_monetisation_layer.sql`

---

## 🔌 Stripe Integration

### Products Configuration

**File:** `lib/stripe/products.ts`

Products defined:
- **Featured Listing**: £49/month, £132.30/quarter, £470.40/year
- **Verified Badge**: £19.90/month, £53.73/quarter, £191.04/year
- **Premium Analytics**: £29.90/month, £80.73/quarter, £287.04/year
- **Franchise Boost**: £490/month for 10 locations

### Stripe Client

**File:** `lib/stripe/client.ts`

Functions:
- `getOrCreateStripeCustomer()` - Get/create Stripe customer
- `createCheckoutSession()` - Create checkout session
- `createPortalSession()` - Create customer portal session
- `verifyWebhookSignature()` - Verify webhook signatures

### Webhook Handlers

**File:** `app/api/billing/webhooks/stripe/route.ts`

Handles:
- `customer.subscription.created/updated` - Sync subscription state
- `customer.subscription.deleted` - Deactivate features
- `invoice.payment_succeeded` - Create revenue events
- `invoice.payment_failed` - Mark subscription as past_due
- `checkout.session.completed` - Log checkout completion

---

## 🛠️ API Routes

### Billing Routes

1. **`POST /api/billing/create-checkout-session`**
   - Creates Stripe checkout session
   - Links to provider and product type

2. **`POST /api/billing/create-portal-session`**
   - Creates Stripe customer portal session
   - Allows providers to manage subscriptions

3. **`POST /api/billing/webhooks/stripe`**
   - Handles all Stripe webhooks
   - Signature verification
   - Idempotent processing

### Provider Features Routes

4. **`POST /api/provider/features/assign-featured`** (Admin only)
   - Manually assign featured listing
   - Set priority and targeting

5. **`POST /api/provider/features/assign-verified`** (Admin only)
   - Manually assign verified badge
   - Add verification notes

6. **`GET /api/provider/features/list-active-features`**
   - Get all active features for a provider
   - Returns entitlements object

### Franchise Routes

7. **`POST /api/franchise/create`** (Admin only)
   - Create new franchise
   - Set default discount and slug

8. **`POST /api/franchise/assign-bulk-featured`** (Admin only)
   - Allocate bulk featured listing to providers
   - Tracks allocation capacity

---

## 🎨 UI Components

### Provider Components

**Location:** `components/provider/monetisation/`

1. **`GrowthHubPanel.tsx`** ✅
   - Main upsell panel
   - Shows current ranking and missed views
   - Three upsell cards (Featured, Verified, Analytics)

2. **`FeaturedListingCard.tsx`** (To be created)
   - Featured listing upgrade card
   - Pricing and benefits

3. **`VerifiedBadgeCard.tsx`** (To be created)
   - Verified badge upgrade card
   - Trust signals

4. **`AnalyticsProCard.tsx`** (To be created)
   - Premium analytics card
   - Free preview mode with blurred charts

5. **`FranchiseBoostCard.tsx`** (To be created)
   - Franchise bulk boost card
   - Allocation management

6. **`RankingPreviewBlurred.tsx`** (To be created)
   - Blurred ranking preview
   - "Unlock exact data" CTA

### Admin Components

**Location:** `components/admin/monetisation/`

1. **`AdminSubscriptionsTable.tsx`** (To be created)
   - List all subscriptions
   - Filter by status, provider, product

2. **`AdminProviderFeatureManager.tsx`** (To be created)
   - Assign/remove features
   - Set expiration dates

3. **`AdminRevenueDashboard.tsx`** (To be created)
   - ARR/MRR metrics
   - Revenue trends

---

## 📄 Pages

### Provider Pages

1. **`/provider/grow`** (To be created)
   - Growth Hub main page
   - Uses `GrowthHubPanel` component

2. **`/provider/upgrade/featured`** (To be created)
   - Featured listing upgrade page
   - Checkout flow

3. **`/provider/upgrade/verified`** (To be created)
   - Verified badge upgrade page

4. **`/provider/upgrade/analytics`** (To be created)
   - Premium analytics upgrade page
   - Free preview mode

5. **`/provider/upgrade/franchise`** (To be created)
   - Franchise bulk boost page

### Admin Pages

6. **`/admin/monetisation`** (To be created)
   - Main monetisation dashboard

7. **`/admin/monetisation/providers/[id]`** (To be created)
   - Provider monetisation details

8. **`/admin/monetisation/franchises/[id]`** (To be created)
   - Franchise monetisation details

9. **`/admin/monetisation/revenue`** (To be created)
   - Revenue dashboard

---

## 🔧 Core Logic

### Entitlement Resolver

**File:** `lib/monetisation/entitlements.ts`

Functions:
- `getProviderEntitlements()` - Get all active features
- `hasFeature()` - Check specific feature
- `isAnalyticsLocked()` - Check if metric is in preview mode

### Feature Management

**File:** `lib/monetisation/features.ts`

Functions:
- `activateFeature()` - Activate a feature for provider
- `deactivateFeature()` - Deactivate a feature
- `logMonetisationEvent()` - Log events to audit trail
- `createRevenueEvent()` - Create revenue tracking event

### Ranking Integration

**File:** `lib/monetisation/ranking.ts`

Functions:
- `getProviderMonetisationBoosts()` - Get Featured/Verified boosts for ranking

**Updated:** `lib/search/ranking.ts`
- Added `hasFeaturedListing` and `hasVerifiedBadge` to `RankingInput`
- Featured Listing: 1.5x to 2.5x boost (based on priority)
- Verified Badge: 1.3x boost

---

## 📊 Analytics Preview/Masking

### Implementation

**File:** `lib/monetisation/entitlements.ts` - `isAnalyticsLocked()`

Logic:
1. If provider has `premium_analytics` feature → nothing is locked
2. Otherwise, check `analytics_preview_locks` table
3. Default: all metrics locked (preview mode)

### Preview Mode Features

- **Ranking**: "You rank between 10–50 for Baby Music in London"
- **Comparison**: Blurred competitor graphs
- **Traffic**: Masked competitor names
- **CTAs**: "Unlock exact data" buttons throughout

---

## 🎯 Ranking Algorithm Updates

### Boost Multipliers

1. **Featured Listing** (Highest Priority)
   - Base: 1.5x
   - With priority: up to 2.5x (1.5 + priority * 0.1)

2. **Verified Badge**
   - 1.3x boost

3. **Legacy Boosts** (Fallback)
   - Active paid boost: 2.0x
   - Plan boost: 1.5x
   - Legacy featured: 1.2x to 2.2x

### Integration Points

- Search API (`/api/search/classes`)
- Server-side search (`lib/search/runServerSearch.ts`)
- Ranking calculation (`lib/search/ranking.ts`)

---

## 🧪 Testing Checklist

### API Routes

- [ ] Create checkout session
- [ ] Create portal session
- [ ] Webhook signature verification
- [ ] Subscription sync
- [ ] Feature activation/deactivation
- [ ] Franchise bulk allocation

### UI Components

- [ ] Growth Hub panel displays correctly
- [ ] Upsell cards show active status
- [ ] Checkout flow works
- [ ] Portal access works

### Ranking

- [ ] Featured listing boost applied
- [ ] Verified badge boost applied
- [ ] Priority affects boost multiplier
- [ ] No double-boosting

### Analytics Preview

- [ ] Preview mode shows blurred data
- [ ] Unlock CTA works
- [ ] Premium users see full data

---

## 🚀 Deployment Steps

1. **Run Migration**
   ```bash
   # Apply database migration
   supabase migration up
   ```

2. **Set Stripe Environment Variables**
   ```
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_FEATURED_LISTING_MONTHLY=price_...
   STRIPE_PRICE_FEATURED_LISTING_QUARTERLY=price_...
   STRIPE_PRICE_FEATURED_LISTING_ANNUALLY=price_...
   # ... (repeat for all products)
   ```

3. **Create Stripe Products**
   - Create products in Stripe Dashboard
   - Set price IDs in environment variables
   - Configure webhook endpoint: `/api/billing/webhooks/stripe`

4. **Test Webhook**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe`
   - Test events: `stripe trigger customer.subscription.created`

---

## 📝 Next Steps

### To Complete Implementation

1. **Create Remaining UI Components**
   - FeaturedListingCard
   - VerifiedBadgeCard
   - AnalyticsProCard
   - FranchiseBoostCard
   - Admin components

2. **Create Pages**
   - Provider upgrade pages
   - Admin monetisation pages

3. **Add Analytics Preview Components**
   - RankingPreviewBlurred
   - Blurred comparison charts
   - Masked competitor names

4. **Integrate with Provider Dashboard**
   - Add Growth Hub link
   - Show current entitlements
   - Display expiration countdowns

5. **Add Revenue Dashboard**
   - ARR/MRR calculations
   - Revenue trends
   - Provider LTV metrics

---

## ✅ Completed

- ✅ Database schema and migration
- ✅ Stripe integration utilities
- ✅ Webhook handlers
- ✅ Billing API routes
- ✅ Provider features API routes
- ✅ Franchise API routes
- ✅ Entitlement resolver
- ✅ Feature management
- ✅ Ranking algorithm updates
- ✅ Growth Hub panel component
- ✅ Documentation

---

**The monetisation layer foundation is complete!** The system is ready for UI components and pages to be built on top of this infrastructure.








