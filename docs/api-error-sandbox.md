# API Error Sandbox

## Overview

The Error Sandbox is a **debug-only endpoint** for experimenting with error responses without touching real production routes. It provides a safe playground for testing error shapes, status codes, and error handling logic.

**Important**: This endpoint always returns v1 (legacy) error shapes externally, even though it may build v2 error structures internally. This ensures no production contract changes while allowing experimentation.

## Endpoint

```
POST /api/error-sandbox
```

## Usage

### Basic Example

```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -d '{"scenario": "VALIDATION_ERROR"}'
```

### Request Body

```typescript
{
  scenario?: string;              // Required: One of the supported scenarios
  fieldErrors?: Record<string, string[]>;  // Optional: Custom field errors for validation scenarios
  codeOverride?: string;          // Optional: Custom error code (for CUSTOM scenario)
  message?: string;               // Optional: Custom message (for CUSTOM scenario)
  details?: Record<string, unknown>; // Optional: Custom details (for CUSTOM scenario)
  meta?: Record<string, unknown>; // Optional: Custom metadata (for CUSTOM scenario)
}
```

## Supported Scenarios

### 1. VALIDATION_ERROR
**Status**: 400

Returns a validation error with field-level errors.

**Example**:
```json
{
  "scenario": "VALIDATION_ERROR"
}
```

**Response**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "details": {
    "fieldErrors": {
      "email": ["Email is required", "Email is invalid"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### 2. AUTH_REQUIRED
**Status**: 401

Returns an authentication required error.

**Example**:
```json
{
  "scenario": "AUTH_REQUIRED"
}
```

**Response**:
```json
{
  "error": "AUTH_REQUIRED",
  "message": "You must be logged in to access this resource."
}
```

### 3. FORBIDDEN
**Status**: 403

Returns a forbidden/authorization error.

**Example**:
```json
{
  "scenario": "FORBIDDEN"
}
```

**Response**:
```json
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to perform this action."
}
```

### 4. NOT_FOUND
**Status**: 404

Returns a resource not found error.

**Example**:
```json
{
  "scenario": "NOT_FOUND"
}
```

**Response**:
```json
{
  "error": "NOT_FOUND",
  "message": "The requested resource was not found."
}
```

### 5. CONFLICT
**Status**: 409

Returns a conflict error (e.g., resource already exists).

**Example**:
```json
{
  "scenario": "CONFLICT"
}
```

**Response**:
```json
{
  "error": "CONFLICT",
  "message": "Resource already exists."
}
```

### 6. RATE_LIMITED
**Status**: 429

Returns a rate limit error with retry information.

**Example**:
```json
{
  "scenario": "RATE_LIMITED"
}
```

**Response**:
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please slow down.",
  "details": {
    "retryAfterSeconds": 60
  }
}
```

### 7. SERVER_ERROR
**Status**: 500

Returns an internal server error.

**Example**:
```json
{
  "scenario": "SERVER_ERROR"
}
```

**Response**:
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred."
}
```

### 8. MULTI_ERROR
**Status**: 400

Returns multiple errors in a single response.

**Example**:
```json
{
  "scenario": "MULTI_ERROR"
}
```

**Response**:
```json
{
  "error": "MULTIPLE_ERRORS",
  "message": "Multiple errors occurred.",
  "details": {
    "errors": [
      { "code": "VALIDATION_ERROR", "message": "Invalid email." },
      { "code": "FORBIDDEN", "message": "You cannot edit this resource." }
    ]
  }
}
```

### 9. FIELD_VALIDATION_ERROR
**Status**: 422 (Unprocessable Entity)

Returns field-level validation errors.

**Example**:
```json
{
  "scenario": "FIELD_VALIDATION_ERROR",
  "fieldErrors": {
    "email": ["Email is required"]
  }
}
```

**Response**:
```json
{
  "error": "FIELD_VALIDATION_ERROR",
  "message": "Some fields failed validation.",
  "details": {
    "fieldErrors": {
      "email": ["Email is required"]
    }
  }
}
```

### 10. CUSTOM
**Status**: 400 (default)

Allows custom error codes, messages, and details for experimentation.

**Example**:
```json
{
  "scenario": "CUSTOM",
  "codeOverride": "MY_CUSTOM_ERROR",
  "message": "Custom error from sandbox.",
  "details": {
    "foo": "bar"
  }
}
```

**Response**:
```json
{
  "error": "MY_CUSTOM_ERROR",
  "message": "Custom error from sandbox.",
  "details": {
    "foo": "bar"
  }
}
```

## Error Responses

### Invalid JSON
**Status**: 400

```json
{
  "error": "Invalid JSON body"
}
```

### Invalid Scenario
**Status**: 400

```json
{
  "error": "INVALID_SCENARIO",
  "message": "Supported scenarios are: VALIDATION_ERROR, AUTH_REQUIRED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, SERVER_ERROR, MULTI_ERROR, FIELD_VALIDATION_ERROR, CUSTOM."
}
```

## Usage Guidelines

### For Development

When refactoring API error handling, use `/api/error-sandbox` to:
- Test assumptions about error shapes
- Verify error handling logic in frontend code
- Experiment with new error structures before implementing in real routes

### For Testing

The sandbox is useful for:
- Integration testing of error handling
- Manual testing of error UI components
- Verifying error contract compliance

### Important Notes

1. **Always returns v1 shapes**: Even though the sandbox may use v2 error structures internally, it always returns legacy v1 shapes externally.

2. **No production use**: This endpoint should never be used in production flows or called by production clients.

3. **No database/external calls**: The sandbox is completely self-contained and makes no external API or database calls.

4. **Auth-agnostic**: The sandbox does not require authentication and does not check sessions.

5. **Contract stability**: Do NOT change this route's external behavior; it defines the contract for error experiments.

## Examples

### Testing Validation Errors

```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "VALIDATION_ERROR",
    "fieldErrors": {
      "email": ["Invalid email format"],
      "age": ["Must be 18 or older"]
    }
  }'
```

### Testing Custom Error

```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "CUSTOM",
    "codeOverride": "PAYMENT_FAILED",
    "message": "Payment processing failed",
    "details": {
      "paymentId": "pay_123",
      "reason": "Insufficient funds"
    }
  }'
```

### Testing Rate Limiting

```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -d '{"scenario": "RATE_LIMITED"}'
```

