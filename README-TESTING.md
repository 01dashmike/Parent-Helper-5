# Testing Framework Documentation

This document describes the comprehensive testing framework for the Parent Helper platform.

## Overview

The testing framework consists of:
- **Unit Tests**: Jest-based tests for individual functions and components
- **E2E Tests**: Playwright-based tests for end-to-end user flows
- **Test Mocks**: Reusable mocks for Supabase, Stripe, and external APIs
- **Test Seeds**: Scripts to populate test data

## Quick Start

```bash
# Install dependencies (includes Jest and Playwright)
npm install

# Run unit tests
npm run test:unit

# Run E2E tests (requires app to be running)
npm run test:e2e

# Run all tests
npm run test:full

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Seed test data
npm run seed:test
```

## Test Structure

```
tests/
├── config/
│   └── playwright.config.ts    # Playwright E2E configuration
├── setup/
│   └── jest.setup.ts           # Jest global setup and mocks
├── mocks/
│   ├── supabaseClient.mock.ts  # Supabase client mock
│   ├── stripe.mock.ts          # Stripe client mock
│   ├── openweather.mock.ts     # OpenWeather API mock
│   ├── eventbrite.mock.ts      # Eventbrite API mock
│   └── localStorage.mock.ts     # localStorage mock
├── unit/                        # Unit test suites
│   ├── analytics.test.ts
│   ├── loyalty-engine.test.ts
│   ├── wallet.test.ts
│   ├── referrals.test.ts
│   ├── seo-metadata.test.ts
│   ├── community-qa.test.ts
│   ├── email-templates.test.ts
│   └── saved-search.test.ts
└── e2e/                         # E2E test suites
    ├── booking-flow.spec.ts
    ├── member-funnel.spec.ts
    ├── loyalty-and-retention.spec.ts
    ├── localization-city-pages.spec.ts
    ├── community-engagement.spec.ts
    ├── wallet-referral.spec.ts
    ├── admin-analytics-dashboard.spec.ts
    └── pwa-push.spec.ts
```

## Configuration Files

### Jest Configuration (`jest.config.js`)

- Uses `next/jest` for Next.js integration
- Test environment: `jsdom` for React component testing
- Setup file: `tests/setup/jest.setup.ts`
- Coverage thresholds: 70% for branches, functions, lines, statements

### Playwright Configuration (`tests/config/playwright.config.ts`)

- Base URL: `http://localhost:3000`
- Headless mode: enabled
- Screenshots: on failure only
- Traces: on first retry
- Default timeout: 10 seconds
- Browsers: Chromium, Firefox, WebKit

## Unit Test Suites

### 1. Analytics (`analytics.test.ts`)
- Verifies `track()` sends correct payload
- Mocks fetch to `/api/track`
- Confirms `analytics_events` row inserted
- Tests batching and session ID handling

### 2. Loyalty Engine (`loyalty-engine.test.ts`)
- Mocks `calculate_engagement_scores()`
- Checks tier upgrade logic (bronze → silver → gold)
- Tests streak tracking and badge progression

### 3. Wallet (`wallet.test.ts`)
- Simulates credit transfer between linked family accounts
- Verifies balance update and transaction log
- Tests amount formatting (cents to pounds)

### 4. Referrals (`referrals.test.ts`)
- Creates referral → confirms referral credit applied
- Checks conversion metrics calculation
- Tests referral code generation

### 5. SEO Metadata (`seo-metadata.test.ts`)
- Renders city pages with SSR → validates dynamic `<title>` and meta description
- Tests search page metadata generation
- Verifies canonical URLs

### 6. Community Q&A (`community-qa.test.ts`)
- Posts a question → provider answers → verifies render
- Tests question validation and status tracking
- Mocks email notifications

### 7. Email Templates (`email-templates.test.ts`)
- Loads `booking_confirmation.html` → asserts placeholders replaced correctly
- Simulates SendGrid send function with mocked payload
- Tests currency formatting

### 8. Saved Search (`saved-search.test.ts`)
- Simulates search save event pre/post-login
- Ensures record created in `saved_searches`
- Tests search alert triggering

## E2E Test Suites

### 1. Booking Flow (`booking-flow.spec.ts`)
- Visit class page → Click "Book Now"
- Complete mock Stripe checkout
- Redirect → `/thank-you`
- Confirm confirmation email logged

### 2. Member Funnel (`member-funnel.spec.ts`)
- Anonymous user clicks "Save Search"
- Prompt → Magic Link sign-in flow (mocked)
- Completes profile → verifies `/member/alerts` loads

### 3. Loyalty and Retention (`loyalty-and-retention.spec.ts`)
- Log in as demo family
- Complete 3 bookings + 1 review
- Confirm loyalty badge upgraded to "Silver Family"
- Wait 14 days simulated → triggers reactivation email

### 4. Localization - City Pages (`localization-city-pages.spec.ts`)
- Visit `/london` → confirm hero, meta title, weather chip render
- Prefetch tips carousel cards visible
- Check top 5 classes listed

### 5. Community Engagement (`community-engagement.spec.ts`)
- Ask provider question
- Verify provider email notification
- Reload → answer visible under class

### 6. Wallet & Referral (`wallet-referral.spec.ts`)
- Provider logs in → generate referral link
- New provider joins via link
- Simulate one paid booking
- Verify referral credit + analytics event recorded

### 7. Admin Analytics Dashboard (`admin-analytics-dashboard.spec.ts`)
- Log in as admin
- View `/admin/analytics`
- Assert graphs render, data matches Supabase seeds
- Trigger `growth_recommendations()` → verify suggestions visible

### 8. PWA Push (`pwa-push.spec.ts`)
- Register push notification mock
- Trigger new class near user → verify service worker notification displays

## Mock Utilities

### Supabase Client Mock (`tests/mocks/supabaseClient.mock.ts`)
Provides a mock Supabase client with:
- `from()` method for table access
- `select()`, `insert()`, `update()`, `delete()` methods
- Mock data storage for testing

### Stripe Mock (`tests/mocks/stripe.mock.ts`)
Mocks Stripe API calls:
- Checkout sessions
- Customers
- Subscriptions
- Webhooks

### External API Mocks
- **OpenWeather**: Returns fixed temperature (21°C)
- **Eventbrite**: Returns demo events
- **localStorage**: Browser storage mock

## Test Data Seeding

Run `npm run seed:test` to populate test data:

- **3 Demo Families**: Bronze, Silver, Gold tiers
- **2 Providers**: With contact information
- **Sample Classes**: London, Manchester, Birmingham
- **City Data**: London with expert tips
- **Analytics Events**: Mock events for dashboards

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Lint**: ESLint checks
2. **Build**: Next.js production build
3. **Unit Tests**: Jest test suite
4. **E2E Tests**: Playwright tests (requires app running)
5. **Full Test Suite**: Complete test run on main branch

## Environment Variables

Required for testing:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Playwright
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Feature Flags
FEATURE_BOOKINGS=true
```

## Best Practices

1. **Unit Tests**: Test individual functions in isolation
2. **E2E Tests**: Test complete user flows
3. **Mocks**: Use provided mocks for external services
4. **Cleanup**: Clean up test data after each test
5. **Isolation**: Each test should be independent
6. **Naming**: Use descriptive test names that explain what is being tested

## Troubleshooting

### Tests failing locally
- Ensure app is running: `npm run dev`
- Check environment variables are set
- Verify test data is seeded: `npm run seed:test`

### Playwright browser issues
- Install browsers: `npx playwright install`
- Check browser permissions
- Verify base URL is accessible

### Jest module resolution issues
- Check `jest.config.js` module name mapper
- Verify `@/` alias is correctly configured
- Ensure TypeScript paths match Jest config

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Run `npm run test:coverage` to generate coverage report.

