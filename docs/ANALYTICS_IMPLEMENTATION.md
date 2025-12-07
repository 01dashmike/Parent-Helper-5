# Analytics Abstraction Implementation

## Summary

A minimal analytics abstraction layer has been implemented that can be easily replaced with any analytics provider (Google Analytics, Mixpanel, PostHog, etc.) without changing tracking calls throughout the codebase.

---

## Files Created

### 1. `lib/analytics/index.ts`
**Purpose:** Core analytics abstraction with SSR-safe no-op fallbacks

**Exports:**
- `track(eventName, payload)` - Track custom events
- `identify(userId, traits)` - Identify users
- `page(path?, title?)` - Track page views
- `reset()` - Reset user identification (on logout)

**Features:**
- ✅ SSR-safe: No-op when `window` is undefined
- ✅ Development logging: Console logs in dev mode
- ✅ Easy replacement: TODO comments show how to swap providers
- ✅ Type-safe: TypeScript types for payloads

---

## Tracking Points Added

### 1. Search Interactions
**Location:** `components/search/SearchPageClient.tsx`
- **Event:** `search_performed`
- **Payload:**
  - `query` - Search query string
  - `location` - Town/location filter
  - `ageRange` - Age range filter
  - `resultCount` - Number of results
  - `featuredCount` - Number of featured results

**When:** After search results are loaded

---

### 2. Class Page Views
**Location:** `app/class/[id]/ClassPageClient.tsx`
- **Event:** `class_page_viewed`
- **Page View:** `/class/{id}`
- **Payload:**
  - `classId` - Class ID
  - `className` - Class name/title
  - `category` - Class category
  - `location` - Class location

**When:** Component mounts (client-side only)

---

### 3. Class Views from Search
**Location:** `components/search/ResultsSplit.tsx`
- **Event:** `class_viewed`
- **Payload:**
  - `classId` - Class ID
  - `title` - Class title
  - `category` - Class category
  - `location` - Class location
  - `isFeatured` - Whether class is featured

**When:** User clicks on a class result in search

---

### 4. Wallet Opens
**Location:** `app/account/wallet/WalletClient.tsx`
- **Event:** `wallet_opened`
- **Payload:** None

**When:** Wallet component mounts

---

### 5. Booking Start
**Location:** `components/BookingButton.tsx`
- **Event:** `booking_started`
- **Payload:**
  - `occurrenceId` - Booking occurrence ID

**When:** User clicks "Book now" button

---

### 6. Booking Finish
**Location:** `app/booking/thanks/BookingThanksClient.tsx`
- **Event:** `booking_finished`
- **Payload:**
  - `bookingId` - Booking ID
  - `amountCents` - Amount in cents
  - `currency` - Currency code
  - `amount` - Amount in decimal
  - `classId` - Class ID (if available)
  - `occurrenceId` - Occurrence ID (if available)

**When:** Booking confirmation page loads

---

### 7. Provider Dashboard Loads
**Location:** 
- `app/provider/(console)/ProviderDashboardClient.tsx` (main dashboard)
- `app/provider/(console)/analytics/ProviderAnalyticsClient.tsx` (analytics page)

- **Event:** `provider_dashboard_loaded`
- **Page View:** `/provider` or `/provider/analytics`
- **Payload:**
  - `providerId` - Provider ID

**When:** Dashboard component mounts

---

## Implementation Details

### SSR Safety
All analytics functions check for `typeof window === "undefined"` and return early during server-side rendering. This prevents errors and ensures analytics only run on the client.

### Development Mode
In development (`NODE_ENV === "development"`), all events are logged to the console for debugging:
```
[Analytics] search_performed { query: "music", location: "London", ... }
[Analytics] Page View /class/123 "Baby Music Class"
```

### Easy Provider Replacement
The abstraction includes TODO comments showing how to replace with common providers:

```typescript
// Google Analytics example:
gtag('event', eventName, payload);

// Mixpanel example:
mixpanel.track(eventName, payload);

// PostHog example:
posthog.capture(eventName, payload);
```

---

## Files Modified

1. `lib/analytics/index.ts` - **Created** (core abstraction)
2. `components/search/SearchPageClient.tsx` - Added search tracking
3. `components/search/ResultsSplit.tsx` - Added class view tracking
4. `app/class/[id]/ClassPageClient.tsx` - **Created** (class page tracking)
5. `app/class/[id]/page.tsx` - Added ClassPageClient component
6. `app/account/wallet/WalletClient.tsx` - Added wallet open tracking
7. `components/BookingButton.tsx` - Added booking start tracking
8. `app/booking/thanks/BookingThanksClient.tsx` - **Created** (booking finish tracking)
9. `app/booking/thanks/page.tsx` - Added BookingThanksClient component
10. `app/provider/(console)/ProviderDashboardClient.tsx` - **Created** (dashboard tracking)
11. `app/provider/(console)/page.tsx` - Added ProviderDashboardClient component
12. `app/provider/(console)/analytics/ProviderAnalyticsClient.tsx` - Added analytics page tracking

---

## Next Steps

To replace the analytics provider:

1. **Update `lib/analytics/index.ts`:**
   - Replace TODO comments with actual provider calls
   - Remove development console.log statements
   - Add provider initialization if needed

2. **Test all tracking points:**
   - Verify events fire correctly
   - Check payload structure matches provider requirements
   - Ensure SSR safety is maintained

3. **Optional: Add provider initialization:**
   - Create `lib/analytics/init.ts` for provider setup
   - Call from `app/layout.tsx` or root component

---

## Event Summary

| Event Name | Location | When |
|------------|----------|------|
| `search_performed` | Search page | After search results load |
| `class_viewed` | Search results | User clicks class result |
| `class_page_viewed` | Class detail page | Page loads |
| `wallet_opened` | Wallet page | Component mounts |
| `booking_started` | Booking button | User clicks "Book now" |
| `booking_finished` | Booking thanks page | Confirmation page loads |
| `provider_dashboard_loaded` | Provider dashboard | Dashboard loads |
| `page_view` | All pages | Automatic (via `page()` function) |

---

## Testing

In development mode, check the browser console to see all analytics events:
```
[Analytics] search_performed { query: "music", ... }
[Analytics] class_viewed { classId: 123, ... }
[Analytics] Page View /class/123 "Baby Music Class"
```

All events are currently no-ops in production until a provider is configured.

