# Accessibility Testing

This directory contains accessibility tests using Playwright and axe-core.

## Test Files

### `accessibility.spec.ts`
General accessibility tests for core pages (home, search, blog, etc.)

### `page-level-accessibility.spec.ts`
**Page-level accessibility tests for critical user flows**

Tests the following pages:
- `/search` - Search page
- `/class/[id]` - Class detail page (provider content)
- `/search?category=music` - Category filtered search
- `/account/searches` - Saved searches page
- `/book/checkout` - Booking checkout page
- `/providers` - Providers landing page

## Running Tests

### Run all accessibility tests
```bash
npm run test:a11y
```

### Run page-level tests only
```bash
npm run test:a11y:pages
```

### Run in CI
```bash
npm run test:a11y:pages
```

## Critical Issues Only

These tests are configured to **fail only on critical accessibility issues**:

### What Counts as Critical:
- **WCAG 2.1 Level A violations** (must pass)
- **Critical impact level** violations
- **Specific critical rules**:
  - Missing alt text on images
  - Missing form labels
  - Missing ARIA labels on interactive elements
  - Keyboard navigation blockers
  - Color contrast failures (WCAG AA minimum)
  - Missing page titles
  - Missing HTML lang attribute
  - Focus order issues
  - Hidden focusable elements

### What Doesn't Fail:
- **WCAG 2.1 Level AA violations** (warnings only)
- **Moderate/Minor impact** violations
- **Best practice** suggestions

## Test Configuration

Tests use:
- **axe-core/playwright** for accessibility scanning
- **WCAG 2.1 Level A** as minimum standard
- **Network idle** wait state for dynamic content
- **1 second additional wait** for client-side rendering

## Authentication

Some pages (like `/account/searches`) require authentication. The tests handle this by:
1. Attempting to access the page
2. If redirected to login, testing the login page accessibility
3. If authenticated, testing the actual page

For full coverage, consider:
- Setting up test authentication
- Using test fixtures with authenticated sessions
- Mocking authentication state

## Troubleshooting

### Tests Failing on Dynamic Content
If tests fail due to content loading after network idle:
- Increase the `waitForTimeout` value
- Wait for specific selectors instead of network idle
- Use `page.waitForSelector()` for critical elements

### False Positives
If tests report violations that aren't actually issues:
- Check if the violation is truly critical (Level A)
- Verify the element is actually visible/interactive
- Consider if the violation is in third-party code

### Authentication Issues
If tests fail on authenticated pages:
- Ensure test user credentials are set up
- Check if authentication cookies are being set
- Consider using Playwright's authentication fixtures

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run accessibility tests
  run: |
    npm run dev &
    sleep 10
    npm run test:a11y:pages
```

## Related Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
