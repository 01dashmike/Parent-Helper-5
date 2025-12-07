# Accessibility Testing Setup

This document describes the accessibility testing infrastructure added to the project.

## Overview

Accessibility testing has been integrated into the test suite using `@axe-core/react` and `jest-axe`. All major components and pages now have accessibility tests that run as part of `npm test`.

## What Was Added

### 1. Dependencies
- `@axe-core/react` - React integration for axe-core accessibility testing
- `jest-axe` - Jest matchers for axe-core (already installed)

### 2. Test Utilities (`tests/utils/a11y-test-utils.tsx`)
A reusable test harness providing:
- `testA11y(component, options)` - Test a single component
- `testA11yDetailed(component, options)` - Test and get detailed results
- `testA11yBatch(components, options)` - Test multiple components

### 3. Component Tests
Accessibility tests for major components in `tests/unit/components/`:
- ✅ `Header.a11y.test.tsx` - Header component
- ✅ `Footer.a11y.test.tsx` - Footer component
- ✅ `SearchBar.a11y.test.tsx` - SearchBar component
- ✅ `CategoryRail.a11y.test.tsx` - CategoryRail component
- ✅ `BookingButton.a11y.test.tsx` - BookingButton component
- ✅ `a11y-index.test.tsx` - Batch test for all components

### 4. Page-Level Tests
Accessibility tests for pages in `tests/unit/pages/`:
- ✅ `HomePage.a11y.test.tsx` - Home page
- ✅ `SearchPage.a11y.test.tsx` - Search page

### 5. Jest Configuration
Updated `tests/setup/jest.setup.ts` to include `toHaveNoViolations` matcher from jest-axe.

## Running Tests

### Run All Tests (includes accessibility)
```bash
npm test
```

### Run Only Accessibility Tests
```bash
npm test -- tests/unit/components/*.a11y.test.tsx tests/unit/pages/*.a11y.test.tsx
```

### Run Specific Component Test
```bash
npm test -- tests/unit/components/Header.a11y.test.tsx
```

### Run Batch Test
```bash
npm test -- tests/unit/components/a11y-index.test.tsx
```

## What Gets Tested

The accessibility tests check for:
- ✅ WCAG 2.1 Level A and AA compliance
- ✅ Proper semantic HTML structure
- ✅ ARIA labels and attributes
- ✅ Keyboard navigation support
- ✅ Color contrast issues
- ✅ Missing alt text on images
- ✅ Form accessibility
- ✅ Link accessibility
- ✅ Focus management
- ✅ Screen reader compatibility

## Test Structure

Each test file follows this pattern:

```tsx
import { testA11y } from "../../utils/a11y-test-utils";
import Component from "@/components/Component";

describe("Component Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<Component />);
  });

  it("should have proper semantic structure", () => {
    // Additional specific checks
  });
});
```

## Adding New Tests

To add accessibility tests for a new component:

1. Create `tests/unit/components/ComponentName.a11y.test.tsx`
2. Import the component and `testA11y` utility
3. Add necessary mocks (Next.js router, framer-motion, etc.)
4. Write tests using the pattern above

Example:
```tsx
import { testA11y } from "../../utils/a11y-test-utils";
import MyComponent from "@/components/MyComponent";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("MyComponent Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testA11y(<MyComponent />);
  });
});
```

## Configuration Options

The `testA11y` function accepts options:

```tsx
await testA11y(<Component />, {
  skipRules: ["color-contrast"], // Skip specific rules
  tags: ["wcag2a", "wcag2aa"],  // Only test specific tags
});
```

## Integration with CI/CD

These tests automatically run as part of:
- `npm test` - Standard test command
- `npm run test:unit` - Unit tests only
- `npm run test:full` - Full test suite

## Notes

- Tests use mocked versions of Next.js components (Image, router, etc.)
- Framer Motion animations are mocked to avoid test issues
- Supabase clients are mocked for components that use them
- Tests are designed to not modify component logic - only test accessibility

## Troubleshooting

If tests fail:
1. Check the error message for specific accessibility violations
2. Review the component's HTML structure and ARIA attributes
3. Use `testA11yDetailed` to get more information about violations
4. Consider if certain rules should be skipped for specific components

