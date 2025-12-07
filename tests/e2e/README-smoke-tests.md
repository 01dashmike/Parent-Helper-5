# Smoke Tests - Core Flows

Simple E2E smoke tests for critical user flows. These tests verify that pages load and key elements are visible, without heavy setup or complex interactions.

## Test Coverage

### ✅ Search + Open Class Flow
- Search page loads
- Can search and open a class
- Class detail page displays

### ✅ Blog AI Generate + Save Draft Flow
- Admin blogs page loads
- Blog generate API endpoint exists

### ✅ Provider Dashboard Metrics
- Provider analytics page loads
- Metrics content displays

### ✅ Wallet Summary
- Wallet summary API endpoint responds
- Wallet page loads (if exists)

### ✅ Booking Flow Skeleton
- Booking page/flow loads
- Checkout page loads
- No real payment processing (skeleton only)

### ✅ Onboarding Flow
- Onboarding start page loads
- Form elements are visible
- Can navigate through steps

## Running Tests

### Run all smoke tests:
```bash
npm run test:e2e tests/e2e/smoke-core-flows.spec.ts
```

### Run specific test suite:
```bash
npx playwright test tests/e2e/smoke-core-flows.spec.ts --grep "Search"
```

### Run in headed mode (see browser):
```bash
npx playwright test tests/e2e/smoke-core-flows.spec.ts --headed
```

### Run with UI:
```bash
npx playwright test tests/e2e/smoke-core-flows.spec.ts --ui
```

## Prerequisites

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Set base URL (optional):**
   ```bash
   export PLAYWRIGHT_BASE_URL=http://localhost:3000
   ```

## Test Behavior

- Tests will **skip** if features are disabled or require authentication
- Tests use **timeouts** to handle slow-loading content
- Tests check for **key elements** but don't require exact matches
- Tests are **non-destructive** - they don't create/modify data

## Notes

- Some tests require authentication and will skip if not logged in
- Tests may skip if test data is not available
- Tests are designed to be fast and lightweight
- Focus is on "page loads, key element visible" style checks

## Adding New Smoke Tests

When adding new smoke tests:

1. Keep tests simple - focus on page loads and key elements
2. Use `.skip()` for features that require auth or special setup
3. Add helpful skip messages explaining why test was skipped
4. Use timeouts appropriately (5 seconds default)
5. Don't create/modify data unless absolutely necessary

## Example Test Structure

```typescript
test("feature page loads", async ({ page }) => {
  await page.goto(`${baseURL}/feature`);
  await page.waitForLoadState("networkidle");
  
  const heading = page.getByRole("heading").first();
  await expect(heading).toBeVisible({ timeout: 5000 });
});
```

