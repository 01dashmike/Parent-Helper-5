# Unified Implementation Plan - All Remaining Features

This document outlines all features to be implemented, their current status, and implementation details.

## Status Overview

### ✅ Already Implemented (Schemas Exist)
- Provider SEO Tools (Marketing Booster) - ✅ Complete
- Family Profiles Schema - ✅ Exists
- Saved Searches Schema - ✅ Exists  
- Venue Marketplace Schema - ✅ Exists
- SEND Resources Schema - ✅ Exists
- Provider Growth Metrics Schema - ✅ Exists
- Provider Gamification (XP, Badges, Levels) - ✅ Exists

### 🔨 Needs Implementation
1. **Provider Analytics v2** - API routes, UI components, charts
2. **Family Profiles & Recommendations** - API routes, recommendation engine, UI
3. **Member Onboarding** - Flow, saved searches API, alerts API, weekly digest
4. **City Landing Pages** - SSR, weather API, local photos, featured providers
5. **SEND Hub** - Blog templates, resource lists, search index
6. **Venue Marketplace** - Matching algorithm, inquiry system, admin tools
7. **Admin Docs Hub** - Documentation pages for all features

---

## 1. Provider Analytics v2

### Status: Schema exists, needs API & UI

**Files to Create:**
- `app/api/provider/growth-score/route.ts` (may exist, check)
- `app/api/provider/next-action/route.ts` (may exist, check)
- `app/provider/(console)/analytics/v2/page.tsx`
- `components/provider/GrowthScoreChart.tsx`
- `components/provider/NextBestActionCard.tsx`

**Features:**
- Growth score calculation (0-100)
- AI-powered next-best-action suggestions
- Weekly email deep-links to specific insights
- Mobile-optimized charts (recharts)
- Trend visualization

---

## 2. Family Profiles & Recommendations

### Status: Schema exists, needs API & UI

**Files to Create:**
- `app/api/family/profile/route.ts`
- `app/api/family/recommendations/route.ts`
- `app/api/family/children/route.ts`
- `lib/utils/recommendation-engine.ts`
- `app/account/family/page.tsx`
- `components/family/ChildrenManager.tsx`
- `components/family/RecommendationsList.tsx`

**Features:**
- CRUD for family profiles
- Child management (add/edit/remove)
- Preference tracking
- Recommendation algorithm (age, location, interests)
- Personalized class suggestions

---

## 3. Member Onboarding & Saved Searches

### Status: Schema exists, needs API & UI

**Files to Create:**
- `app/api/member/saved-searches/route.ts`
- `app/api/member/alerts/route.ts`
- `app/api/member/onboarding/route.ts`
- `lib/emails/templates/weeklyDigest.ts`
- `app/account/onboarding/page.tsx`
- `components/member/SavedSearchCard.tsx`
- `components/member/AlertManager.tsx`

**Features:**
- Saved search creation/management
- Email alerts for new classes matching searches
- Onboarding flow (welcome, preferences, first search)
- Weekly digest email with personalized recommendations
- Lock/unlock UI for premium features

---

## 4. City Landing Pages

### Status: Partial (cities table exists)

**Files to Create:**
- `app/city/[slug]/page.tsx` (may exist, check)
- `app/api/weather/route.ts`
- `lib/utils/unsplash-photos.ts`
- `lib/utils/city-detection.ts`
- `components/city/CityHero.tsx`
- `components/city/WeatherChip.tsx`
- `components/city/LocalPhotos.tsx`

**Features:**
- SSR town detection from IP/postcode
- Weather API integration (OpenWeatherMap or similar)
- Local photo lookup (Unsplash with fallback)
- Pre-render popular categories
- Featured providers for city
- Localized meta tags

---

## 5. SEND Hub

### Status: Schema exists, needs content & UI

**Files to Create:**
- `app/send/page.tsx`
- `app/send/resources/page.tsx`
- `app/send/blog/page.tsx`
- `components/send/ResourceCard.tsx`
- `components/send/ResourceSearch.tsx`
- `lib/utils/send-resources.ts`

**Features:**
- Blog template for SEND topics
- Resource lists (legal, support, charities, councils)
- Support hub category filtering
- Internal search index for resources
- Region-based filtering

---

## 6. Venue Marketplace

### Status: Schema exists, needs matching & admin

**Files to Create:**
- `app/api/venues/match/route.ts`
- `app/api/venues/enquiries/route.ts`
- `app/api/admin/venues/moderation/route.ts`
- `lib/utils/venue-matching.ts`
- `app/provider/(console)/venues/marketplace/page.tsx`
- `components/venue/VenueCard.tsx`
- `components/venue/MatchingAlgorithm.tsx`

**Features:**
- Venue-to-provider matching algorithm
- Inquiry system (provider → venue owner)
- Admin moderation tools
- Approval workflow
- Venue search and filtering

---

## 7. Admin Docs Hub

### Status: Needs creation

**Files to Create:**
- `app/admin/docs/page.tsx`
- `app/admin/docs/seo-diagnostics/page.tsx`
- `app/admin/docs/migration-health/page.tsx`
- `app/admin/docs/city-config/page.tsx`
- `app/admin/docs/booking-engine/page.tsx`
- `app/admin/docs/provider-analytics/page.tsx`

**Features:**
- SEO diagnostics overview
- Migration health dashboard
- City landing page configuration
- Booking engine documentation
- Provider analytics v2 guide

---

## Implementation Order

1. **Critical APIs** (Provider Analytics, Family Recommendations, Saved Searches)
2. **UI Components** (Dashboards, Forms, Lists)
3. **City Landing Pages** (High SEO value)
4. **SEND Hub** (Content-driven)
5. **Venue Marketplace** (Business feature)
6. **Admin Docs** (Documentation)

---

## Testing Requirements

- Unit tests for recommendation engine
- E2E tests for onboarding flow
- API route tests
- Migration tests
- Build health checks

---

## Database Migrations Needed

Check existing migrations and create any missing ones:
- `20250127_unified_features.sql` - Any missing indexes or constraints

