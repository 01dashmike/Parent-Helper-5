# Performance Testing

This directory contains Lighthouse performance audits for measuring and ensuring site quality.

## Running Tests

```bash
# Run Lighthouse audits (requires server running)
npm run test:perf

# Run with custom base URL
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:perf
```

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Or use production build:**
   ```bash
   npm run build
   npm start
   ```

## Test Coverage

Lighthouse audits are run on:
- Homepage (`/`)
- Search pages (`/search?q=music`)
- Location pages (`/london`)
- Blog pages (`/blog`)

## Thresholds

Tests will fail if scores drop below:
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **SEO**: ≥ 90
- **Best Practices**: ≥ 85

## Reports

Reports are saved to `tests/reports/`:
- `lighthouse-summary.json` - Overall summary
- `lighthouse-{url}.json` - Individual page reports
- `lighthouse-full-{url}.json` - Complete Lighthouse JSON reports

## Metrics Tracked

- **First Contentful Paint (FCP)** - Time to first content
- **Largest Contentful Paint (LCP)** - Time to largest content
- **Total Blocking Time (TBT)** - Main thread blocking time
- **Cumulative Layout Shift (CLS)** - Visual stability

## CI Integration

These tests run automatically in CI as part of `npm run test:quality`.

## Using Lighthouse CI

For advanced CI integration, use Lighthouse CI:

```bash
npm install -D @lhci/cli
npx lhci autorun
```

Configuration is in `lighthouserc.json` at the project root.

