# Load Testing Scripts

Load testing scripts for high-traffic API endpoints without requiring external tools.

## Scripts

### Individual Tests

1. **`search.ts`** - Tests `/api/search` endpoint
   - Default: 200 requests, 10 concurrent
   - Tests various search queries and filters

2. **`blog-generate.ts`** - Tests `/api/blog/generate` endpoint
   - Default: 100 requests, 5 concurrent
   - Note: May return 404 if no topics available

3. **`provider-dashboard.ts`** - Tests `/api/provider/metrics` endpoint
   - Default: 150 requests, 10 concurrent
   - Requires `provider_id` parameter (defaults to 1)

4. **`bookings.ts`** - Tests booking-related endpoints
   - Default: 200 requests, 10 concurrent
   - Tests `/api/book/start` endpoint availability

### Run All Tests

**`run-all.ts`** - Runs all load tests and generates a summary report

## Usage

### Run Individual Test

```bash
# Set base URL (optional, defaults to http://localhost:3000)
export NEXT_PUBLIC_APP_URL=http://localhost:3000

# Run search test
npx tsx scripts/load/search.ts

# Customize request count and concurrency
LOAD_TEST_REQUESTS=500 CONCURRENT_REQUESTS=20 npx tsx scripts/load/search.ts
```

### Run All Tests

```bash
npx tsx scripts/load/run-all.ts
```

## Environment Variables

- `NEXT_PUBLIC_APP_URL` - Base URL for API (default: `http://localhost:3000`)
- `LOAD_TEST_REQUESTS` - Number of requests to make (default varies by script)
- `CONCURRENT_REQUESTS` - Number of concurrent requests (default: 10)

## Output

Each script outputs:
- Success/failure ratio
- Latency distribution (min, max, mean, median, P50, P95, P99)
- Status code breakdown
- Sample errors (if any)
- Requests per second

The `run-all.ts` script generates:
- Overall statistics
- Per-endpoint results
- Performance ranking
- Recommendations
- Saved report file: `scripts/load/load-test-report.txt`

## Notes

- Tests are designed to be non-destructive
- Some endpoints may require authentication (will show 401/403 errors)
- Blog generate endpoint may return 404 if no topics are available
- Provider dashboard requires valid `provider_id` parameter
- Bookings endpoint tests validation errors (expected 400 responses)

