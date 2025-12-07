# Quality Assurance Testing

This directory contains automated tests for accessibility, performance, and SEO compliance.

## Quick Start

```bash
# Run all quality tests (a11y + performance)
npm run test:quality

# Run accessibility tests only
npm run test:a11y

# Run performance tests only
npm run test:perf
```

## Test Structure

```
tests/
├── a11y/              # Accessibility tests (WCAG 2.1 AA)
│   ├── accessibility.spec.ts
│   └── README.md
├── performance/       # Lighthouse performance audits
│   ├── lighthouse.test.mjs
│   └── README.md
└── reports/          # Generated test reports (gitignored)
```

## Prerequisites

### For Accessibility Tests
- No special setup required
- Tests use Playwright's built-in browser automation

### For Performance Tests
- **Development server must be running:**
  ```bash
  npm run dev
  ```
- Or use production build:
  ```bash
  npm run build && npm start
  ```

## CI Integration

Tests run automatically in CI via GitHub Actions (`.github/workflows/quality-checks.yml`).

The workflow:
1. Builds the application
2. Starts the server
3. Runs accessibility tests
4. Runs Lighthouse performance audits
5. Uploads reports as artifacts

## Thresholds

### Accessibility
- **WCAG 2.1 Level A**: Must pass
- **WCAG 2.1 Level AA**: Must pass
- **Best Practices**: Recommended

### Performance
- **Performance Score**: ≥ 90
- **Accessibility Score**: ≥ 90
- **SEO Score**: ≥ 90
- **Best Practices**: ≥ 85

## Reports

Test reports are saved to `tests/reports/`:
- `lighthouse-summary.json` - Performance audit summary
- `lighthouse-{url}.json` - Individual page reports
- Playwright trace files for failed accessibility tests

## Troubleshooting

### Tests fail with "ECONNREFUSED"
- Ensure the development server is running on `http://localhost:3000`
- Or set `PLAYWRIGHT_BASE_URL` environment variable

### Lighthouse tests timeout
- Increase timeout in `lighthouse.test.mjs`
- Check server is responding: `curl http://localhost:3000`

### Accessibility violations found
- Review violation details in test output
- Fix issues and re-run tests
- Check axe-core documentation for guidance

## Advanced Usage

### Using Lighthouse CI

For more advanced CI integration:

```bash
npm install -D @lhci/cli
npx lhci autorun
```

Configuration is in `lighthouserc.json` at project root.

### Custom Test URLs

Edit test files to add/remove URLs:
- Accessibility: `tests/a11y/accessibility.spec.ts`
- Performance: `tests/performance/lighthouse.test.mjs`

## Resources

- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Playwright Testing](https://playwright.dev/docs/intro)

