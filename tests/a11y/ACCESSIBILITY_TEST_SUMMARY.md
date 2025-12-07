# Page-Level Accessibility Tests Summary

## Overview
Page-level accessibility tests using `@axe-core/playwright` that fail only on critical WCAG 2.1 Level A violations.

## Test Coverage

### Routes Tested

1. **`/search`** ✅
   - Search page with filters and results
   - Tests: Form labels, keyboard navigation, ARIA attributes

2. **`/class/[id]`** ✅
   - Class detail page (dynamically finds a class from search)
   - Tests: Image alt text, booking forms, interactive elements

3. **`/search?category=music`** ✅
   - Category-filtered search results
   - Tests: Filtered content accessibility, dynamic updates

4. **`/account/searches`** ✅
   - Saved searches page (handles authentication redirect)
   - Tests: List accessibility, form controls, authenticated content

5. **`/book/checkout`** ✅
   - Booking checkout page
   - Tests: Form accessibility, payment forms, required fields

6. **`/providers`** ✅ (Additional)
   - Providers landing page
   - Tests: Landing page structure, CTAs, navigation

### Route Notes

- **`/provider/[slug]`**: This route doesn't exist in the codebase. Testing `/providers` landing page instead.
- **`/category/[id]`**: Categories are query parameters, not routes. Testing `/search?category=music` instead.
- **`/account/saved`**: Route is `/account/searches` (saved searches). Testing that instead.
- **`/book/[id]`**: Route is `/book/checkout`. Testing that instead.

## Critical Issues Only

### What Fails the Test (Critical):
- ✅ **WCAG 2.1 Level A violations**
- ✅ **Critical impact** violations
- ✅ **Missing alt text** on images
- ✅ **Missing form labels**
- ✅ **Missing ARIA labels** on interactive elements
- ✅ **Keyboard navigation blockers**
- ✅ **Color contrast failures** (WCAG AA minimum)
- ✅ **Missing page titles**
- ✅ **Missing HTML lang attribute**
- ✅ **Focus order issues**
- ✅ **Hidden focusable elements**

### What Doesn't Fail (Warnings Only):
- ⚠️ **WCAG 2.1 Level AA violations** (logged but don't fail)
- ⚠️ **Moderate/Minor impact** violations
- ⚠️ **Best practice** suggestions

## Running Tests

```bash
# Run page-level accessibility tests
npm run test:a11y:pages

# Run all accessibility tests
npm run test:a11y
```

## Test Configuration

- **Tool**: `@axe-core/playwright` v4.11.0
- **Standard**: WCAG 2.1 Level A (minimum)
- **Wait Strategy**: Network idle + 1s for client-side rendering
- **Failure Mode**: Critical issues only

## Expected Behavior

### Success Case
- Tests pass if no critical violations found
- Non-critical violations are logged but don't fail tests

### Failure Case
- Tests fail if any critical violations are detected
- Full violation details are logged to console
- Violations include: rule ID, description, impact, nodes affected

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run accessibility tests
  run: |
    npm run dev &
    sleep 10
    npm run test:a11y:pages
```

## Maintenance

### Adding New Routes
1. Add test case to `page-level-accessibility.spec.ts`
2. Use `getCriticalViolations()` helper to filter violations
3. Update this summary document

### Updating Critical Rules
Modify the `criticalRuleIds` array in `getCriticalViolations()` function.

## Related Files

- `tests/a11y/page-level-accessibility.spec.ts` - Test file
- `tests/a11y/playwright.config.ts` - Playwright configuration
- `tests/a11y/accessibility.spec.ts` - General accessibility tests
- `tests/a11y/README.md` - Full documentation

