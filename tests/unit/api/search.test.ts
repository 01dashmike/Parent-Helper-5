/**
 * API Contract Tests for /api/search
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 * 
 * NOTE: This route has a special error pattern: { results: [], error: "..." }
 */

import { GET } from "@/app/api/search/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseServerEnv } from "@/lib/env";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/env");
jest.mock("@/lib/security/rate-limit-wrapper", () => ({
  withRateLimit: (handler: any) => handler,
}));
jest.mock("@/lib/server-logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockHasSupabaseServerEnv = hasSupabaseServerEnv as jest.MockedFunction<
  typeof hasSupabaseServerEnv
>;

describe("/api/search - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasSupabaseServerEnv.mockReturnValue(true);
  });

  describe("Error response shape", () => {
    it("should return 500 with { results: [], error: '...' } on internal error", async () => {
      // Mock an error that would trigger the catch block
      mockCreateClient.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/search?q=test",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(500);
      // Special pattern: search route returns { results: [], error: "..." }
      expect(response.body).toMatchObject({
        results: [],
        error: expect.any(String),
      });
    });
  });

  // Note: The search route doesn't have explicit validation errors for missing query
  // It just returns empty results. So we test the error shape pattern instead.
  describe("Error shape preservation", () => {
    it("should preserve the { results: [], error: '...' } pattern in error responses", async () => {
      // Force an error by making createClient throw
      mockCreateClient.mockImplementation(() => {
        throw new Error("Test error");
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/search",
      });

      const response = await callRouteHandler(GET, request);

      // Verify the special error pattern is preserved
      expect(response.body).toHaveProperty("results");
      expect(response.body).toHaveProperty("error");
      expect(Array.isArray(response.body?.results)).toBe(true);
      expect(response.body?.results.length).toBe(0);
    });
  });
});

