# Gamification Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the gamification and growth system, covering XP (Experience Points), badges, growth score, and provider analytics.

## Test Coverage

### Unit Tests

#### `tests/unit/gamification/badges.test.ts`
Tests for the badge system including:
- Badge creation and saving (`saveProviderBadges`)
- Badge awarding (`awardBadge`)
- Badge retrieval (`getProviderBadges`)
- Badge checking and auto-awarding (`checkAndAwardBadges`)
- Badge type definitions
- Edge cases: duplicate badges, database errors, missing data

**Key Test Scenarios:**
- Saving new badges successfully
- Skipping badges that already exist
- Handling database errors gracefully
- Awarding badges based on provider metrics (onboarding, SEO, ratings, response time, consistency)

#### `tests/unit/gamification/growth-score.test.ts`
Tests for growth score calculation including:
- Minimum scenario (provider with no data)
- Maximum scenario (provider with complete data)
- Mixed scenario (some strengths, some weaknesses)
- Individual component calculations:
  - Listing health score
  - SEO score
  - Response rate score
  - Bookings score
  - Reviews score
  - Engagement score
- Recommendation generation
- Trend tracking

**Key Test Scenarios:**
- Score calculation for empty provider (should be low)
- Score calculation for complete provider (should be high)
- Score boundaries (0-100 range)
- Component weight calculations
- Recommendation generation based on low scores

#### `tests/unit/gamification/xp.test.ts`
Tests for the XP system including:
- Level calculation (`calculateLevel`)
- XP required for next level (`getXpForNextLevel`)
- XP event recording (`recordXpEvent`)
- XP awarding (`awardXp`)
- Level retrieval (`getProviderLevel`)
- Recent XP events (`getRecentXpEvents`)
- XP weights and level thresholds

**Key Test Scenarios:**
- Level progression (bronze → silver → gold → platinum)
- XP event recording with success and error cases
- Level up detection
- XP weights for different event types
- Edge cases: unknown event types, database errors

#### `tests/unit/provider-analytics/helpers.test.ts`
Tests for provider analytics helper functions including:
- View counting (`getProviderViews`)
- Booking counting (`getProviderBookings`)
- Conversion rate calculation (`getProviderConversionRate`)
- Recent reviews counting (`getProviderRecentReviews`)
- Combined metrics (`getProviderAnalyticsMetrics`)
- 30-day window calculations

**Key Test Scenarios:**
- Unique view counting (prevents double-counting)
- Test booking exclusion
- Conversion rate calculation with edge cases (zero views)
- 30-day window filtering
- Parallel metric calculation

### Integration Tests

#### `tests/integration/api/providers-growth-score.test.ts`
Tests for the `/api/providers/growth-score` API endpoint including:
- Missing parameter validation
- Server error handling
- Cached score retrieval
- Fresh score calculation
- Tier and multiplier calculations
- Error responses

**Key Test Scenarios:**
- 400 error for missing `provider_id`
- 500 error when Supabase is unavailable
- Cached score return with correct tier/multiplier
- Fresh score calculation and caching
- Tier boundaries (None, Bronze, Silver, Gold)

#### `tests/integration/api/provider-xp-award.test.ts`
Tests for the `/api/provider/xp/award` API endpoint including:
- Authentication and authorization
- Parameter validation
- Provider access verification
- XP awarding and badge checking
- Error handling

**Key Test Scenarios:**
- 401 error for unauthenticated requests
- 400 error for missing parameters
- 403 error for unauthorized provider access
- Successful XP award with badge checking
- Level up detection
- All valid event types

### Behavioral / E2E Flow Tests

#### `tests/integration/gamification/provider-growth-flow.test.ts`
End-to-end flow tests simulating complete provider journey:
- **Phase 1: Provider Onboarding** - Low score, no badges
- **Phase 2: Content Improvement** - Score increases after adding content
- **Phase 3: Engagement and Growth** - High score after bookings and reviews
- **Complete Journey Flow** - Full progression from onboarding to high growth

**Key Test Scenarios:**
- Initial state verification (low score, no badges)
- Score progression through content improvements
- XP accumulation and level progression
- Badge awarding at different stages
- Complete journey from onboarding to high growth

## Running the Tests

### Run All Gamification Tests
```bash
pnpm test -- gamification
```

### Run Specific Test Suites
```bash
# Unit tests only
pnpm test tests/unit/gamification
pnpm test tests/unit/provider-analytics/helpers.test.ts

# Integration tests only
pnpm test tests/integration/api/providers-growth-score.test.ts
pnpm test tests/integration/api/provider-xp-award.test.ts

# E2E flow tests
pnpm test tests/integration/gamification/provider-growth-flow.test.ts
```

### Run with Coverage
```bash
pnpm test:coverage -- gamification
```

## Test Architecture

### Mocking Strategy

All tests use mocks for external dependencies:
- **Supabase Client**: Mocked using Jest to avoid real database calls
- **Type Helpers**: Mocked `castDb` function
- **Date Functions**: Mocked for consistent test results

### Test Data

Tests use in-memory fixtures and mock data:
- No real database connections
- No external API calls
- Deterministic test results

### Test Patterns

Tests follow existing patterns from the codebase:
- Use `@jest/globals` for test utilities
- Follow existing test structure from `tests/unit/api/`
- Use `createMockRequest` and `callRouteHandler` from `tests/api/testClient.ts`
- Consistent error handling and edge case coverage

## Known Limitations and TODOs

### Current Limitations

1. **Weekly Aggregation**: Complex weekly aggregation flows are not fully tested. The tests focus on individual score calculations rather than weekly batch processing.

2. **Real Database**: Tests use mocks, so they don't verify actual database schema compatibility. Schema changes should be tested separately.

3. **Concurrent Operations**: Tests don't cover race conditions or concurrent XP/badge awarding scenarios.

4. **Performance**: Tests don't measure performance or load testing for high-volume scenarios.

### Future Enhancements (TODOs)

1. **Weekly Batch Processing**: Add tests for cron-style weekly growth score aggregation
2. **Concurrent Operations**: Add tests for race conditions in XP/badge awarding
3. **Performance Tests**: Add load tests for growth score calculation with large datasets
4. **Integration with Real Database**: Consider adding a small set of integration tests with a test database
5. **Badge Edge Cases**: Add more tests for complex badge eligibility scenarios
6. **Growth Score Caching**: Add tests for cache invalidation and refresh logic

## Test Maintenance

### Adding New Tests

When adding new gamification features:

1. **Unit Tests**: Add tests to the appropriate `tests/unit/gamification/` file
2. **Integration Tests**: Add API route tests to `tests/integration/api/`
3. **Flow Tests**: Update `provider-growth-flow.test.ts` if the journey changes

### Updating Tests

When modifying gamification logic:

1. Update corresponding unit tests
2. Verify integration tests still pass
3. Update flow tests if behavior changes
4. Run full test suite: `pnpm test -- gamification`

### Test Dependencies

Tests depend on:
- Jest (test framework)
- `@jest/globals` (test utilities)
- `tests/api/testClient.ts` (API test helpers)
- Mock implementations of Supabase and other dependencies

## Verification

### Pre-Commit Checklist

Before committing changes:
- [ ] All tests pass: `pnpm test -- gamification`
- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint` (warnings acceptable, no new errors)
- [ ] No production code behavior changed
- [ ] No API response shapes modified
- [ ] No database schema changes

### Test Results

All tests should:
- ✅ Pass consistently
- ✅ Run quickly (< 5 seconds for full suite)
- ✅ Be deterministic (no flaky tests)
- ✅ Cover edge cases
- ✅ Use mocks (no external dependencies)

## Summary

The gamification test suite provides comprehensive coverage of:
- **4 unit test files** covering core gamification logic
- **2 integration test files** covering API endpoints
- **1 E2E flow test file** covering complete provider journey
- **100+ test cases** covering happy paths, edge cases, and error scenarios

All tests use mocks and fixtures, ensuring fast, reliable, and deterministic test execution without requiring a real database or external services.

