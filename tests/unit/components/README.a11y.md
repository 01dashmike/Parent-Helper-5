# Accessibility Testing with axe-core

This directory contains accessibility tests for major components using `@axe-core/react` and `jest-axe`.

## Test Files

- `Header.a11y.test.tsx` - Tests for Header component
- `Footer.a11y.test.tsx` - Tests for Footer component  
- `SearchBar.a11y.test.tsx` - Tests for SearchBar component
- `CategoryRail.a11y.test.tsx` - Tests for CategoryRail component
- `BookingButton.a11y.test.tsx` - Tests for BookingButton component
- `a11y-index.test.tsx` - Batch test that runs all component accessibility checks

## Page-Level Tests

Page-level accessibility tests are in `tests/unit/pages/`:
- `HomePage.a11y.test.tsx` - Tests for Home page
- `SearchPage.a11y.test.tsx` - Tests for Search page

## Test Utilities

The accessibility test harness is in `tests/utils/a11y-test-utils.tsx`:

- `testA11y(component, options)` - Test a single component for accessibility violations
- `testA11yDetailed(component, options)` - Test and return detailed results
- `testA11yBatch(components, options)` - Test multiple components in batch

## Running Tests

Run all accessibility tests:
```bash
npm test
```

Run specific component tests:
```bash
npm test -- tests/unit/components/Header.a11y.test.tsx
```

Run all accessibility tests:
```bash
npm test -- tests/unit/components/*.a11y.test.tsx tests/unit/pages/*.a11y.test.tsx
```

## What Gets Tested

The tests check for:
- WCAG 2.1 Level A and AA violations
- Proper semantic HTML structure
- ARIA labels and attributes
- Keyboard navigation support
- Color contrast issues
- Missing alt text on images
- Form accessibility
- Link accessibility

## Configuration

Accessibility testing is configured in:
- `tests/setup/jest.setup.ts` - Extends Jest with `toHaveNoViolations` matcher
- `jest.config.cjs` - Jest configuration (already includes test files in `tests/unit/**/*.test.tsx`)

