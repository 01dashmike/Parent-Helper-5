# Pa11y-CI Accessibility Testing

This project uses [pa11y-ci](https://github.com/pa11y/pa11y-ci) for automated accessibility testing against local development pages.

## Configuration

The pa11y-ci configuration is stored in `.pa11yci.json` and tests the following pages:

1. **Home Page** - `http://localhost:3000/`
2. **Search Page** - `http://localhost:3000/search`
3. **Provider Page** - `http://localhost:3000/providers`
4. **Booking Checkout Page** - `http://localhost:3000/book/checkout`

## Thresholds

The configuration is set to fail builds only on **critical** and **serious** accessibility issues:

- ✅ **Critical**: 0 (build fails on any critical issues)
- ✅ **Serious**: 0 (build fails on any serious issues)
- ⚠️ **Moderate**: -1 (warnings only, does not fail build)
- ⚠️ **Minor**: -1 (warnings only, does not fail build)

## Usage

### Prerequisites

Before running pa11y-ci, ensure your local development server is running:

```bash
pnpm run dev
```

This starts the Next.js development server on `http://localhost:3000`.

### Run Accessibility Tests

```bash
pnpm run test:a11y:pa11y
```

Or use npx directly:

```bash
npx pa11y-ci --config .pa11yci.json
```

### Run in CI/CD

The tests are designed to run in CI/CD pipelines. Make sure to:

1. Start your development server before running tests
2. Wait for the server to be ready (tests include a 3-second wait)
3. The tests will fail if critical or serious issues are found

Example CI configuration:

```yaml
# GitHub Actions example
- name: Start dev server
  run: pnpm run dev &
  
- name: Wait for server
  run: npx wait-on http://localhost:3000
  
- name: Run accessibility tests
  run: pnpm run test:a11y:pa11y
```

## Configuration Details

### Default Settings

- **Standard**: WCAG2AA (WCAG 2.0 Level AA)
- **Timeout**: 30 seconds per page
- **Wait**: 3 seconds before testing (allows page to load)
- **Ignore**: Notice and warning level issues (only errors are reported)

### Chrome Launch Config

- HTTPS errors are ignored (useful for local development)
- Default Chrome/Chromium installation is used

### Per-Page Configuration

Each URL in the configuration inherits default settings but can override thresholds if needed.

## Understanding Results

### Critical Issues
These are the most severe accessibility problems that will cause the build to fail:
- Missing alt text on images
- Missing form labels
- Keyboard navigation blockers
- Color contrast failures that make text unreadable

### Serious Issues
Important accessibility problems that will cause the build to fail:
- Insufficient color contrast
- Missing ARIA labels where needed
- Form validation issues
- Missing page headings

### Moderate/Minor Issues
These are reported as warnings but do not fail the build:
- Color contrast that could be improved
- Semantic HTML suggestions
- Best practice recommendations

## Troubleshooting

### Tests fail because server isn't running

Ensure your dev server is running on port 3000:

```bash
pnpm run dev
```

### Tests timeout

If tests timeout, you can increase the timeout in `.pa11yci.json`:

```json
{
  "defaults": {
    "timeout": 60000  // Increase to 60 seconds
  }
}
```

### False positives

If pa11y-ci reports issues that are false positives, you can ignore specific rules:

```json
{
  "defaults": {
    "ignore": [
      "notice",
      "warning",
      "WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.InputText.Name"  // Example: ignore specific rule
    ]
  }
}
```

## Integration with Existing Tests

This complements the existing Playwright accessibility tests:

- **Playwright tests** (`test:a11y`): Functional accessibility testing with axe-core
- **Pa11y-CI tests** (`test:a11y:pa11y`): Automated WCAG compliance testing

Both can be run together:

```bash
pnpm run test:a11y && pnpm run test:a11y:pa11y
```

## Resources

- [Pa11y-CI Documentation](https://github.com/pa11y/pa11y-ci)
- [WCAG 2.0 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Pa11y Documentation](https://github.com/pa11y/pa11y)
