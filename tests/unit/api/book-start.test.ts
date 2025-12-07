/**
 * API Contract Tests for /api/book/start
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { POST } from "@/app/api/book/start/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { getSupabaseServer } from "@/lib/supabase.server";
import { isBookingsFeatureEnabled } from "@/lib/env";

// Mock dependencies
jest.mock("@/lib/supabase.server");
jest.mock("@/lib/env");
jest.mock("@/lib/stripe", () => ({
  getStripe: jest.fn().mockReturnValue({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }),
}));

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockIsBookingsFeatureEnabled = isBookingsFeatureEnabled as jest.MockedFunction<
  typeof isBookingsFeatureEnabled
>;

describe("/api/book/start - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBookingsFeatureEnabled.mockReturnValue(true);
  });

  describe("Feature disabled", () => {
    it("should return 403 with { error: 'Bookings feature is disabled' } when feature is disabled", async () => {
      mockIsBookingsFeatureEnabled.mockReturnValue(false);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/book/start",
        body: {},
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: "Bookings feature is disabled" });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 with { error: '...' } when classId is missing", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/book/start",
        body: {
          // Missing classId
          occurrenceId: 1,
          parentName: "Test Parent",
          parentEmail: "test@example.com",
          parentPhone: "1234567890",
          childName: "Test Child",
          childAge: 5,
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body?.error).toBe("string");
    });

    it("should return 400 with { error: '...' } when required fields are missing", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/book/start",
        body: {
          classId: 1,
          // Missing other required fields
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(typeof response.body?.error).toBe("string");
    });
  });

  describe("Server error", () => {
    it("should return 500 with { error: 'Server error' } when Supabase is unavailable", async () => {
      mockGetSupabaseServer.mockReturnValue(null);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/book/start",
        body: {
          classId: 1,
          occurrenceId: 1,
          parentName: "Test Parent",
          parentEmail: "test@example.com",
          parentPhone: "1234567890",
          childName: "Test Child",
          childAge: 5,
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: "Server error" });
    });
  });
});

