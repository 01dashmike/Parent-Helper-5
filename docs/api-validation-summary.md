# API Response Validation Implementation

## Overview

All API responses are now validated using Zod schemas before being used by the UI. This ensures type safety and graceful fallback on schema mismatches.

## Schemas Created

### 1. Search Results Schema (`lib/schemas/api-responses.ts`)

- **ClassResultSchema**: Validates individual search result items
  - Fields: id, title, description, latitude, longitude, category, town, age_range, featured info, etc.
  
- **SearchResultsResponseSchema**: Validates search API response
  - Fields: results array, count, error

### 2. Class Details Schema

- **ClassDetailsSchema**: Validates detailed class information
  - Fields: id, name, description, venue, address, schedule, booking info, pricing, etc.
  
- **ClassDetailsResponseSchema**: Validates class detail API response

### 3. Wallet Summary Schema

- **WalletTransactionSchema**: Validates individual transactions
  - Fields: id, type, amount_cents, description, created_at, metadata
  
- **WalletSummarySchema**: Validates wallet summary
  - Fields: balance_cents, transactions array
  
- **WalletResponseSchema**: Validates wallet API response

### 4. Provider Dashboard Metrics Schema

- **ProviderMetricSchema**: Validates individual metric records
  - Fields: providerId, metricDate, views, websiteClicks, phoneClicks, emailClicks
  
- **ProviderDashboardMetricsSchema**: Validates provider dashboard API response
  - Fields: totalViews, totalWebsiteClicks, metrics array, period

## Validation Utility

### `lib/validation/api-validation.ts`

Provides two main functions:

1. **`validateApiResponse<T>`**: Validates a single API response
   - Returns validated data or fallback
   - Logs warnings on schema mismatches
   - Supports partial data extraction

2. **`validateArrayResponse<T>`**: Validates array responses
   - Validates each item individually
   - Returns array of valid items
   - Skips invalid items with warnings

## Files Updated

### Components Updated

1. **`components/search/SearchPageClient.tsx`**
   - Validates search results using `ClassResultSchema`
   - Falls back to empty array on validation failure
   - Logs warnings for invalid items

2. **`app/account/wallet/WalletClient.tsx`**
   - Validates wallet response using `WalletResponseSchema`
   - Validates wallet summary using `WalletSummarySchema`
   - Falls back to empty balance and transactions on failure

3. **`app/provider/(console)/analytics/ProviderAnalyticsClient.tsx`**
   - Validates provider metrics using `ProviderDashboardMetricsSchema`
   - Falls back to empty metrics on validation failure

## Example Validation Result

### Successful Validation

```typescript
const validation = validateApiResponse(ClassResultSchema, apiData);

// Result:
{
  success: true,
  data: {
    id: 123,
    title: "Music Class",
    description: "Fun music class for toddlers",
    // ... other validated fields
  }
}
```

### Schema Mismatch (Graceful Fallback)

```typescript
const validation = validateApiResponse(
  ClassResultSchema,
  { id: 123, title: "Music" }, // Missing required fields
  { fallback: { id: 0, title: "Unknown", description: null } }
);

// Result:
{
  success: false,
  data: {
    id: 0,
    title: "Unknown",
    description: null
  },
  error: "description: Required",
  warnings: ["Using fallback data due to validation errors"]
}
```

### Array Validation (Partial Success)

```typescript
const validation = validateArrayResponse(
  ClassResultSchema,
  [
    { id: 1, title: "Valid Class", description: "Good" },
    { id: 2, title: "Invalid" }, // Missing description
    { id: 3, title: "Another Valid", description: "Also good" }
  ]
);

// Result:
{
  success: false,
  data: [
    { id: 1, title: "Valid Class", description: "Good" },
    { id: 3, title: "Another Valid", description: "Also good" }
  ],
  warnings: ["Item 1: description: Required"]
}
```

## Benefits

1. **Type Safety**: All API responses are validated at runtime
2. **Graceful Degradation**: Invalid data doesn't crash the UI
3. **Debugging**: Validation errors are logged with details
4. **Consistency**: All components use the same validation approach
5. **Fallback Support**: Safe defaults prevent UI errors

## Usage Pattern

```typescript
// 1. Import schemas and validation utility
import { ClassResultSchema } from "@/lib/schemas/api-responses";
import { validateArrayResponse } from "@/lib/validation/api-validation";

// 2. Fetch API data
const response = await fetch("/api/search");
const result = await response.json();

// 3. Validate response
const validation = validateArrayResponse(
  ClassResultSchema,
  result.results ?? [],
  { logErrors: true }
);

// 4. Use validated data with fallback
const data = validation.data ?? [];

// 5. Log warnings if needed
if (validation.warnings) {
  console.warn("Validation warnings:", validation.warnings);
}
```

## Next Steps

- Add validation to remaining API endpoints
- Create schemas for other response types (referrals, bookings, etc.)
- Consider adding validation to API route handlers for server-side validation
- Add unit tests for validation schemas

