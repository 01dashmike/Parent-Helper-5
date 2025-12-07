/**
 * API Contract Tests for /api/error-sandbox
 * Tests error response scenarios to verify legacy v1 shapes are returned
 * 
 * These tests ensure the sandbox contract remains stable and can be used
 * as a reference for implementing errors in real routes.
 */

import { POST } from "@/app/api/error-sandbox/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { NextRequest } from "next/server";

/**
 * Helper to get full response with headers for snapshot testing
 */
async function getFullResponse(
  handler: (req: NextRequest) => Promise<Response>,
  request: NextRequest
): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const response = await handler(request);
  const body = await response.json().catch(() => null);
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return {
    status: response.status,
    headers,
    body,
  };
}

describe("/api/error-sandbox - Error Contract Tests", () => {
  describe("Invalid requests", () => {
    it("should return 400 with { error: 'Invalid JSON body' } when JSON is malformed", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: null,
      });
      // Simulate JSON parse error
      request.json = jest.fn().mockRejectedValue(new SyntaxError("Unexpected token"));

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: "Invalid JSON body" });
    });

    it("should return 400 with INVALID_SCENARIO when scenario is missing", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {},
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "INVALID_SCENARIO",
      });
      expect(response.body?.message).toContain("Supported scenarios are");
    });

    it("should return 400 with INVALID_SCENARIO when scenario is unrecognized", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "UNKNOWN_SCENARIO",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "INVALID_SCENARIO",
      });
    });
  });

  describe("VALIDATION_ERROR scenario", () => {
    it("should return 400 with validation error details", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "VALIDATION_ERROR",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "VALIDATION_ERROR",
        message: "One or more fields are invalid",
      });
      expect(response.body).toHaveProperty("details");
      expect(response.body?.details).toHaveProperty("fieldErrors");
      expect(response.body?.details?.fieldErrors).toHaveProperty("email");
      expect(response.body?.details?.fieldErrors).toHaveProperty("password");
    });

    it("should include required headers and status code", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "VALIDATION_ERROR",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse.status).toBe(400);
      expect(fullResponse.headers["content-type"]).toContain("application/json");
      expect(fullResponse.body).toHaveProperty("error");
      expect(fullResponse.body).toHaveProperty("message");
    });

    it("should match snapshot for VALIDATION_ERROR", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "VALIDATION_ERROR",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });

    it("should use custom fieldErrors when provided", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "VALIDATION_ERROR",
          fieldErrors: {
            username: ["Username is required"],
          },
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body?.details?.fieldErrors).toHaveProperty("username");
      expect(response.body?.details?.fieldErrors?.username).toEqual(["Username is required"]);
    });
  });

  describe("AUTH_REQUIRED scenario", () => {
    it("should return 401 with auth error", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "AUTH_REQUIRED",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: "AUTH_REQUIRED",
        message: "You must be logged in to access this resource.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should match snapshot for AUTH_REQUIRED", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "AUTH_REQUIRED",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("FORBIDDEN scenario", () => {
    it("should return 403 with forbidden error", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "FORBIDDEN",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should match snapshot for FORBIDDEN", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "FORBIDDEN",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("NOT_FOUND scenario", () => {
    it("should return 404 with not found error", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "NOT_FOUND",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: "NOT_FOUND",
        message: "The requested resource was not found.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should match snapshot for NOT_FOUND", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "NOT_FOUND",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("CONFLICT scenario", () => {
    it("should return 409 with conflict error", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CONFLICT",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        error: "CONFLICT",
        message: "Resource already exists.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should match snapshot for CONFLICT", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CONFLICT",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("RATE_LIMITED scenario", () => {
    it("should return 429 with rate limit error and retryAfterSeconds", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "RATE_LIMITED",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        error: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body?.details).toHaveProperty("retryAfterSeconds");
      expect(response.body?.details?.retryAfterSeconds).toBe(60);
    });

    it("should match snapshot for RATE_LIMITED", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "RATE_LIMITED",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("SERVER_ERROR scenario", () => {
    it("should return 500 with server error", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "SERVER_ERROR",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });

    it("should match snapshot for SERVER_ERROR", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "SERVER_ERROR",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("MULTI_ERROR scenario", () => {
    it("should return 400 with multiple errors in details", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "MULTI_ERROR",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "MULTIPLE_ERRORS",
        message: "Multiple errors occurred.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body?.details).toHaveProperty("errors");
      expect(Array.isArray(response.body?.details?.errors)).toBe(true);
      expect(response.body?.details?.errors.length).toBeGreaterThan(0);
    });

    it("should match snapshot for MULTI_ERROR", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "MULTI_ERROR",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("FIELD_VALIDATION_ERROR scenario", () => {
    it("should return 422 with field validation errors", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "FIELD_VALIDATION_ERROR",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        error: "FIELD_VALIDATION_ERROR",
        message: "Some fields failed validation.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body?.details).toHaveProperty("fieldErrors");
      expect(response.body?.details?.fieldErrors).toHaveProperty("childName");
      expect(response.body?.details?.fieldErrors).toHaveProperty("age");
    });

    it("should use custom fieldErrors when provided", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "FIELD_VALIDATION_ERROR",
          fieldErrors: {
            email: ["Email is required"],
          },
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(422);
      expect(response.body?.details?.fieldErrors).toHaveProperty("email");
      expect(response.body?.details?.fieldErrors?.email).toEqual(["Email is required"]);
    });

    it("should match snapshot for FIELD_VALIDATION_ERROR", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "FIELD_VALIDATION_ERROR",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("CUSTOM scenario", () => {
    it("should return 400 with custom error code and message", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CUSTOM",
          codeOverride: "MY_CUSTOM_ERROR",
          message: "Custom error from sandbox.",
          details: { foo: "bar" },
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "MY_CUSTOM_ERROR",
        message: "Custom error from sandbox.",
      });
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body?.details).toHaveProperty("foo");
      expect(response.body?.details?.foo).toBe("bar");
    });

    it("should echo arbitrary custom fields without filtering", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CUSTOM",
          codeOverride: "TEST_ERROR",
          message: "Test",
          details: {
            arbitraryKey: "arbitraryValue",
            nested: { deep: "value" },
            array: [1, 2, 3],
          },
          meta: {
            customMeta: "metaValue",
          },
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body?.details).toHaveProperty("arbitraryKey");
      expect(response.body?.details?.arbitraryKey).toBe("arbitraryValue");
      expect(response.body?.details).toHaveProperty("nested");
      expect(response.body?.details?.nested).toEqual({ deep: "value" });
      expect(response.body?.details).toHaveProperty("array");
      expect(response.body?.details?.array).toEqual([1, 2, 3]);
    });

    it("should use default message when not provided", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CUSTOM",
          codeOverride: "ANOTHER_ERROR",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "ANOTHER_ERROR",
        message: "Custom error from sandbox.",
      });
    });

    it("should match snapshot for CUSTOM", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CUSTOM",
          codeOverride: "SNAPSHOT_TEST",
          message: "Snapshot test",
          details: { test: "value" },
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse).toMatchSnapshot();
    });
  });

  describe("Response headers contract", () => {
    it("should always include content-type header", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "AUTH_REQUIRED",
        },
      });

      const fullResponse = await getFullResponse(POST, request);

      expect(fullResponse.headers["content-type"]).toContain("application/json");
    });

    it("should return JSON body for all scenarios", async () => {
      const scenarios = [
        "VALIDATION_ERROR",
        "AUTH_REQUIRED",
        "FORBIDDEN",
        "NOT_FOUND",
        "CONFLICT",
        "RATE_LIMITED",
        "SERVER_ERROR",
        "MULTI_ERROR",
        "FIELD_VALIDATION_ERROR",
        "CUSTOM",
      ];

      for (const scenario of scenarios) {
        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/error-sandbox",
          body: { scenario },
        });

        const fullResponse = await getFullResponse(POST, request);

        expect(fullResponse.headers["content-type"]).toContain("application/json");
        expect(typeof fullResponse.body).toBe("object");
        expect(fullResponse.body).toHaveProperty("error");
      }
    });
  });

  describe("Negative tests", () => {
    it("should return 400 for missing body", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: null,
      });
      request.json = jest.fn().mockRejectedValue(new Error("Unexpected end of JSON"));

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid JSON in custom payload", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/error-sandbox",
        body: {
          scenario: "CUSTOM",
          details: "not-valid-json-object", // This should be an object, not a string
        },
      });

      // The route should handle this gracefully
      const response = await callRouteHandler(POST, request);

      // Should still return a valid response (the route parses JSON at the top level)
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});

