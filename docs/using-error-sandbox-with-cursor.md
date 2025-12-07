# Using Error Sandbox with Cursor

## Why the Sandbox Exists

The Error Sandbox (`/api/error-sandbox`) is a debug-only endpoint designed to provide a safe playground for experimenting with error responses without touching real production routes. It allows you to:

- Test error shapes and status codes before implementing them in real routes
- Verify error handling logic in frontend code
- Experiment with new error structures safely
- Validate error contracts without risking breaking changes

**Important**: The sandbox always returns v1 (legacy) error shapes externally, even though it may build v2 error structures internally. This ensures no production contract changes while allowing experimentation.

## Recommended Workflow for Cursor

When working with API error handling, follow this workflow:

### 1. Try the Error You Intend to Return

Before modifying any real API route, first test what the error response should look like using the sandbox.

**Example**: If you need to return a `VALIDATION_ERROR` with field-level errors:

```bash
npm run debug:error VALIDATION_ERROR '{"fieldErrors": {"email": ["Invalid format"]}}'
```

Or use the web UI at `/debug/error-sandbox` to interactively test the error shape.

### 2. Use the Sandbox to Verify Shape

Examine the response from the sandbox to confirm:
- Status code is correct
- JSON structure matches expectations
- All required fields are present
- Field names match frontend expectations

### 3. Only Then Modify the Route

Once you've verified the error shape using the sandbox, you can confidently implement the same error structure in your real route using `createApiErrorShape` and `createLegacyErrorResponse` from `@/lib/api-errors`.

**Example**:
```typescript
// In your route handler
const errorShape = createApiErrorShape({
  code: "VALIDATION_ERROR",
  message: "One or more fields are invalid",
  status: 400,
  fieldErrors: {
    email: ["Invalid format"],
  },
});
return createLegacyErrorResponse(errorShape, {
  additionalFields: {
    error: "VALIDATION_ERROR",
    message: "One or more fields are invalid",
  },
});
```

## Version Negotiation

The sandbox currently always returns v1 (legacy) shapes. However, when Error v2 is enabled in the future, you can test version negotiation:

### Requesting v1 (Default)

No special headers needed. The API will return v1 shapes by default.

```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -d '{"scenario": "VALIDATION_ERROR"}'
```

### Requesting v2 (Future)

When v2 is enabled, you can request it using headers:

**Method 1: Custom Header**
```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -H "x-error-version: 2" \
  -d '{"scenario": "VALIDATION_ERROR"}'
```

**Method 2: Accept Header**
```bash
curl -X POST http://localhost:3000/api/error-sandbox \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.parenthelper.error+v2" \
  -d '{"scenario": "VALIDATION_ERROR"}'
```

The API will respond with an `x-error-version` header indicating which version was used.

## Using the CLI Tool

The CLI tool (`scripts/debug-error.js`) provides a quick way to test error scenarios from the command line.

### Basic Usage

```bash
npm run debug:error SCENARIO
```

**Examples**:
```bash
# Test validation error
npm run debug:error VALIDATION_ERROR

# Test custom error with JSON
npm run debug:error CUSTOM '{"codeOverride": "MY_ERROR", "message": "Test error"}'

# Test field validation with custom fields
npm run debug:error FIELD_VALIDATION_ERROR '{"fieldErrors": {"email": ["Required"]}}'
```

### Supported Scenarios

- `VALIDATION_ERROR` - Field-level validation errors (400)
- `AUTH_REQUIRED` - Authentication required (401)
- `FORBIDDEN` - Permission denied (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `RATE_LIMITED` - Rate limit exceeded (429)
- `SERVER_ERROR` - Internal server error (500)
- `MULTI_ERROR` - Multiple errors (400)
- `FIELD_VALIDATION_ERROR` - Unprocessable entity (422)
- `CUSTOM` - Custom error codes and messages (400)

### Error Handling

The CLI tool handles errors gracefully:
- **Invalid scenario**: Shows supported scenarios and exits
- **Invalid JSON**: Shows parse error and exits
- **Server not running**: Shows connection error with instructions
- **Network errors**: Shows error message and stack trace

## Using the Web UI

The web UI at `/debug/error-sandbox` provides an interactive interface for testing error responses.

### Features

1. **Scenario Dropdown**: Select from all supported error scenarios
2. **Custom JSON Input**: Add custom fields, fieldErrors, codeOverride, etc.
3. **Send Button**: Submit the request and view results
4. **Results Panel**: Shows:
   - Response status code and text
   - Response headers (content-type, x-error-version)
   - Pretty-printed JSON response body

### Example Workflow

1. Navigate to `http://localhost:3000/debug/error-sandbox`
2. Select a scenario from the dropdown (e.g., `VALIDATION_ERROR`)
3. Optionally add custom JSON:
   ```json
   {
     "fieldErrors": {
       "email": ["Invalid format"],
       "password": ["Too short"]
     }
   }
   ```
4. Click "Send"
5. Review the response to verify the error shape

## Important Notes

### Backwards Compatibility

- **Never break existing error shapes**: The sandbox always returns v1 shapes to maintain backwards compatibility
- **Test before changing**: Always use the sandbox to verify error shapes before modifying real routes
- **Contract stability**: The sandbox defines the contract for error experiments - don't change its external behavior

### Why the Sandbox Exists

1. **Safety**: Test error responses without touching production routes
2. **Speed**: Quickly iterate on error shapes without full route implementation
3. **Validation**: Verify error contracts match frontend expectations
4. **Documentation**: Provides examples of all error scenarios

### Why Cursor Must Always Validate Shapes First

1. **Prevent Breaking Changes**: Verifying shapes in the sandbox prevents accidentally breaking frontend error handling
2. **Consistency**: Ensures all routes return consistent error formats
3. **Confidence**: Knowing the exact error shape before implementation reduces bugs
4. **Testing**: Makes it easier to write tests that match actual error responses

### Do NOT Modify Real API Routes Until...

✅ You have tested the error shape in the sandbox  
✅ You have verified the status code is correct  
✅ You have confirmed the JSON structure matches expectations  
✅ You have checked that field names match frontend code  
✅ You understand how the error will be handled by clients  

Only then should you implement the same error structure in your real route using the helpers from `@/lib/api-errors`.

## Examples

### Example 1: Testing Validation Error

**Goal**: Return a validation error with field-level errors

**Step 1**: Test in sandbox
```bash
npm run debug:error VALIDATION_ERROR '{"fieldErrors": {"email": ["Invalid"], "age": ["Must be 18+"]}}'
```

**Step 2**: Verify response shape
```json
{
  "error": "VALIDATION_ERROR",
  "message": "One or more fields are invalid",
  "details": {
    "fieldErrors": {
      "email": ["Invalid"],
      "age": ["Must be 18+"]
    }
  }
}
```

**Step 3**: Implement in route
```typescript
const errorShape = createApiErrorShape({
  code: "VALIDATION_ERROR",
  message: "One or more fields are invalid",
  status: 400,
  fieldErrors: {
    email: ["Invalid"],
    age: ["Must be 18+"],
  },
});
return createLegacyErrorResponse(errorShape, {
  additionalFields: {
    error: "VALIDATION_ERROR",
    message: "One or more fields are invalid",
  },
});
```

### Example 2: Testing Custom Error

**Goal**: Return a custom error code for a specific use case

**Step 1**: Test in sandbox
```bash
npm run debug:error CUSTOM '{"codeOverride": "PAYMENT_FAILED", "message": "Payment processing failed", "details": {"paymentId": "pay_123"}}'
```

**Step 2**: Verify response shape
```json
{
  "error": "PAYMENT_FAILED",
  "message": "Payment processing failed",
  "details": {
    "paymentId": "pay_123"
  }
}
```

**Step 3**: Implement in route (using appropriate error code from ApiErrorCode type)

## Best Practices

1. **Always test first**: Use the sandbox before implementing errors in real routes
2. **Match the shape**: Ensure your route returns the exact same JSON structure as the sandbox
3. **Use helpers**: Always use `createApiErrorShape` and `createLegacyErrorResponse` from `@/lib/api-errors`
4. **Document changes**: If adding new error scenarios, document them in the sandbox and tests
5. **Keep it simple**: The sandbox is for testing, not for complex business logic

## Troubleshooting

### CLI: "Could not connect to dev server"

Make sure the dev server is running:
```bash
npm run dev
```

### CLI: "Invalid scenario"

Check that you're using one of the supported scenarios (see list above).

### CLI: "Invalid JSON argument"

Ensure your JSON is properly formatted and escaped for the shell:
```bash
# Use single quotes for the JSON string
npm run debug:error CUSTOM '{"codeOverride": "TEST"}'
```

### Web UI: Network Error

- Check that the dev server is running
- Verify you're accessing `http://localhost:3000`
- Check browser console for detailed error messages

### Web UI: Invalid JSON

The textarea will show an error if the JSON is malformed. Fix the JSON syntax and try again.

## Automatic Contract Drift Detection

### How Contract Tests Work

The error sandbox has comprehensive contract tests in `tests/unit/api/error-sandbox.test.ts` that verify:

- **Status codes** match expected values for each scenario
- **JSON response shapes** remain consistent (error, message, details, etc.)
- **Required headers** are present (content-type, x-error-version)
- **Field-level validation** structures are correct
- **Custom scenarios** echo arbitrary fields without filtering

The tests use **snapshot testing** to detect any accidental changes to response structures. Snapshots are stored in `tests/unit/api/__snapshots__/error-sandbox.test.ts.snap`.

### Why Cursor Must NEVER Update Real Routes if Contract Tests Fail

**Critical Rule**: If the sandbox contract tests are failing, it means the sandbox contract has changed. This is a **red flag** that indicates:

1. **Contract instability**: The reference implementation (sandbox) is no longer reliable
2. **Breaking changes risk**: If the sandbox contract changed, any route using it as a reference may also be broken
3. **Test reliability**: Other tests that depend on the sandbox contract may also fail

**Before modifying any real API route**:
1. ✅ Run `pnpm test:contracts` and ensure all tests pass
2. ✅ If tests fail, fix the sandbox first (or update tests if the change is intentional)
3. ✅ Only then proceed to modify real routes

**If contract tests fail during development**:
- **DO NOT** proceed with route modifications
- **DO** investigate why the contract changed
- **DO** update tests intentionally if the change is desired
- **DO NOT** ignore test failures

### How to Update Snapshots Intentionally

When you intentionally change the sandbox contract (e.g., adding a new field to error responses):

1. **Make the change** in `app/api/error-sandbox/route.ts`
2. **Run tests** to see snapshot failures:
   ```bash
   pnpm test:contracts
   ```
3. **Review the diff** to ensure the changes are correct
4. **Update snapshots**:
   ```bash
   pnpm test:contracts -u
   ```
5. **Verify** the updated snapshots match your intended changes
6. **Commit** both the code changes and snapshot updates together

**Important**: Only update snapshots when the change is intentional and documented. Never update snapshots to "fix" accidental breaking changes.

### Running Contract Tests Locally

Run the contract tests anytime to verify the sandbox is working correctly:

```bash
# Run all contract tests
pnpm test:contracts

# Run with watch mode (useful during development)
pnpm test:contracts --watch

# Update snapshots (use with caution)
pnpm test:contracts -u
```

### CI Integration

The contract tests run automatically in CI via the `contract-error-sandbox` job. This job:

- Runs after the main CI pipeline
- Executes `pnpm test:contracts`
- **Fails the CI** if any contract test fails
- Prints a clear error message: "Error sandbox contract drift detected — update tests or update implementation intentionally."

This ensures that any accidental changes to the sandbox contract are caught before merging.

### Reminder: Sandbox is the Only Safe Place to Experiment

The sandbox exists specifically to provide a **safe experimentation zone** before touching real routes. Always:

1. **Test in sandbox first** - Use the sandbox to verify error shapes
2. **Verify contract tests pass** - Ensure `pnpm test:contracts` passes
3. **Then implement in real routes** - Only after sandbox validation

This workflow prevents breaking changes and ensures consistency across all API error responses.

