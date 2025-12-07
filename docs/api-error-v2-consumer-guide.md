# API Error v2 Consumer Guide

## Overview

This document describes the Error v2 system for Parent Helper API. The Error v2 system provides a structured, machine-readable error format while maintaining backwards compatibility with existing v1 (legacy) error responses.

## Current Status: Phase 0 (Infrastructure Only)

**Important**: As of now, all API routes continue to return v1 (legacy) error shapes. The v2 infrastructure is in place, but no routes have been migrated yet. This ensures zero breaking changes for existing clients.

## Error Version Negotiation

Clients can request Error v2 format using one of two methods:

### Method 1: Custom Header (Recommended)
```
x-error-version: 2
```
or
```
x-error-version: v2
```

### Method 2: Accept Header
```
Accept: application/vnd.parenthelper.error+v2
```

The API will respond with an `x-error-version` header indicating which version was used:
- `x-error-version: v1` (default, legacy format)
- `x-error-version: v2` (when v2 is enabled for a route)

## Error Response Formats

### v1 (Legacy) Format

The current format varies by route, but common patterns include:

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Invalid request",
  "message": "Please sign in",
  "details": { ... }
}
```

```json
{
  "results": [],
  "error": "Unable to fetch classes"
}
```

**Status**: This is what all routes currently return.

### v2 Format (Future)

When v2 is enabled for a route, the response will follow this structure:

```typescript
interface ApiErrorShapeV2 {
  code: string;                // Machine-readable error code (e.g., "UNAUTHORIZED", "WALLET_NOT_FOUND")
  message: string;             // Human-readable error message
  status: number;              // HTTP status code
  details?: {                  // Optional additional context
    [key: string]: unknown;
  };
  fieldErrors?: {              // Optional validation errors (field-level)
    [field: string]: string[];
  };
  retryable?: boolean;         // Whether the client can safely retry
  requestId?: string;         // Request ID for tracing/support
  userId?: string;            // User ID associated with the error (if applicable)
  meta?: {                    // Additional metadata
    [key: string]: unknown;
  };
}
```

**Example v2 Response**:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "status": 400,
  "fieldErrors": {
    "email": ["Invalid email format"],
    "age": ["Age must be between 0 and 18"]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": false
}
```

## Error Codes

Error v2 uses machine-readable codes. Common codes include:

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INVALID_REQUEST` - Malformed request
- `VALIDATION_ERROR` - Validation failed
- `INTERNAL_ERROR` - Server error
- `RATE_LIMITED` - Rate limit exceeded
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `FEATURE_DISABLED` - Feature not enabled
- `WALLET_NOT_FOUND` - Wallet not found
- `BOOKING_NOT_FOUND` - Booking not found
- `CLASS_NOT_FOUND` - Class not found
- `REVIEW_NOT_FOUND` - Review not found
- `COUPON_INVALID` - Invalid coupon
- `COUPON_EXPIRED` - Coupon expired
- `NO_SPOTS_AVAILABLE` - No spots available
- `INVALID_PRICE` - Invalid price
- And more...

## Migration Strategy

### Phase 0: Infrastructure Only (Current)
- ✅ Error v2 infrastructure is in place
- ✅ Version negotiation helpers exist
- ✅ All routes continue to return v1 (legacy) shapes
- ✅ No breaking changes

### Phase 1: Internal Routes (Future)
- New internal-only routes may start returning v2 bodies
- Behind feature flags
- Updated tests verify behavior

### Phase 2: Public Routes (Future)
- Public routes gradually migrate to v2
- Careful coordination with frontend teams
- Updated tests ensure backwards compatibility
- Deprecation notices for v1 (if applicable)

## Guidance for Frontend Engineers

### Current Approach (v1 Only)

For now, all routes return v1 format. Handle errors like this:

```typescript
try {
  const response = await fetch('/api/wallet/summary');
  if (!response.ok) {
    const error = await response.json();
    // Handle legacy format
    const errorMessage = error.error || error.message || 'An error occurred';
    showError(errorMessage);
  }
} catch (error) {
  // Network or other errors
  showError('Network error');
}
```

### Future Approach (v2 Support)

When v2 is enabled for a route, you can branch behavior:

```typescript
try {
  const response = await fetch('/api/wallet/summary', {
    headers: {
      'x-error-version': '2',  // Request v2 format
    },
  });
  
  if (!response.ok) {
    const errorVersion = response.headers.get('x-error-version');
    const error = await response.json();
    
    if (errorVersion === 'v2') {
      // Handle v2 format
      const errorCode = error.code;
      const errorMessage = error.message;
      const fieldErrors = error.fieldErrors;
      
      // Use code for programmatic handling
      if (errorCode === 'WALLET_NOT_FOUND') {
        // Show wallet creation prompt
      } else if (errorCode === 'VALIDATION_ERROR' && fieldErrors) {
        // Show field-specific errors
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          showFieldError(field, messages[0]);
        });
      } else {
        // Fallback to human-readable message
        showError(errorMessage);
      }
      
      // Use requestId for support/debugging
      if (error.requestId) {
        console.log('Error requestId:', error.requestId);
      }
    } else {
      // Fallback to v1 handling
      const errorMessage = error.error || error.message || 'An error occurred';
      showError(errorMessage);
    }
  }
} catch (error) {
  // Network or other errors
  showError('Network error');
}
```

### Best Practices

1. **Always have a fallback**: Even when requesting v2, be prepared to handle v1 responses
2. **Use error codes for logic**: Use `code` for programmatic error handling, `message` for user display
3. **Leverage fieldErrors**: When available, use `fieldErrors` for field-specific validation feedback
4. **Store requestId**: When available, store `requestId` for support/debugging purposes
5. **Check retryable**: Use `retryable` flag to determine if an operation can be safely retried

## Testing

All error responses are covered by contract tests in `tests/unit/api/**`. These tests ensure:
- Status codes remain stable
- JSON response shapes remain stable
- No breaking changes are introduced

When routes migrate to v2, tests will be updated to verify both v1 and v2 formats.

## Support

For questions or issues related to error handling:
- Check route-specific documentation
- Review test files in `tests/unit/api/**` for expected error shapes
- Contact the backend team for migration timelines

