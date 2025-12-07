# Load Test Scripts Summary

## Scripts Created

### 1. `/scripts/load/search.ts`
- **Endpoint**: `/api/search`
- **Method**: GET
- **Default**: 200 requests, 10 concurrent
- **Features**:
  - Tests various search queries (yoga, music, dance, etc.)
  - Tests different town filters
  - Measures latency distribution
  - Tracks success/failure ratio

### 2. `/scripts/load/blog-generate.ts`
- **Endpoint**: `/api/blog/generate`
- **Method**: POST
- **Default**: 100 requests, 5 concurrent
- **Features**:
  - Tests blog post generation
  - Lower concurrency due to CPU-intensive nature
  - Handles 404 responses (no topics available)

### 3. `/scripts/load/provider-dashboard.ts`
- **Endpoint**: `/api/provider/metrics`
- **Method**: GET
- **Default**: 150 requests, 10 concurrent
- **Features**:
  - Tests provider dashboard metrics
  - Requires `provider_id` parameter (defaults to 1)
  - May require authentication

### 4. `/scripts/load/bookings.ts`
- **Endpoint**: `/api/book/start`
- **Method**: POST
- **Default**: 200 requests, 10 concurrent
- **Features**:
  - Tests booking endpoint availability
  - Sends minimal valid payload
  - Expects validation errors (400) as "success" (endpoint working)

### 5. `/scripts/load/run-all.ts`
- **Purpose**: Run all tests and generate summary
- **Features**:
  - Runs all 4 load tests sequentially
  - Generates comprehensive summary report
  - Saves report to `scripts/load/load-test-report.txt`
  - Provides performance rankings and recommendations

## Usage Examples

### Run Individual Test
```bash
# Search API
npx tsx scripts/load/search.ts

# Blog Generate
npx tsx scripts/load/blog-generate.ts

# Provider Dashboard
npx tsx scripts/load/provider-dashboard.ts

# Bookings
npx tsx scripts/load/bookings.ts
```

### Run All Tests
```bash
npx tsx scripts/load/run-all.ts
```

### Customize Parameters
```bash
# Increase request count
LOAD_TEST_REQUESTS=500 npx tsx scripts/load/search.ts

# Increase concurrency
CONCURRENT_REQUESTS=20 npx tsx scripts/load/search.ts

# Set custom base URL
NEXT_PUBLIC_APP_URL=https://staging.example.com npx tsx scripts/load/search.ts
```

## Metrics Collected

Each script measures:
- **Success Rate**: Percentage of successful requests (2xx status codes)
- **Failure Rate**: Percentage of failed requests (5xx, network errors)
- **Latency Distribution**:
  - Min, Max, Mean, Median
  - P50, P95, P99 percentiles
- **Status Codes**: Breakdown of all HTTP status codes
- **Throughput**: Requests per second
- **Errors**: Sample error messages

## Sample Output

```
📊 Results for /api/search
============================================================
Total requests: 200
Successful: 195 (97.5%)
Failed: 5 (2.5%)
Total time: 12.34s
Requests/sec: 16.21

📈 Latency Distribution (ms):
   Min: 45
   Max: 1200
   Mean: 234
   Median: 189
   P50: 189
   P95: 567
   P99: 890

📋 Status Codes:
   200: 195
   500: 5
```

## Notes

1. **Authentication**: Some endpoints may require authentication. Tests will show 401/403 errors if not authenticated.

2. **Database State**: Tests assume database has some data. Empty databases may return different results.

3. **Rate Limiting**: If endpoints have rate limiting, tests may show higher failure rates.

4. **Network**: Tests use `fetch()` API. Ensure Node.js version supports it (18+) or use a polyfill.

5. **Concurrency**: Adjust `CONCURRENT_REQUESTS` based on server capacity. Too high may overwhelm the server.

## Files Created

- `scripts/load/search.ts` - Search API load test
- `scripts/load/blog-generate.ts` - Blog generate load test
- `scripts/load/provider-dashboard.ts` - Provider dashboard load test
- `scripts/load/bookings.ts` - Bookings endpoint load test
- `scripts/load/run-all.ts` - Test runner and report generator
- `scripts/load/README.md` - Documentation

## Next Steps

1. Run tests against your development environment
2. Adjust request counts and concurrency based on your needs
3. Add authentication if required for protected endpoints
4. Integrate into CI/CD pipeline for continuous monitoring
5. Set up alerts for performance degradation

