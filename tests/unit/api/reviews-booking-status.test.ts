/**
 * API Contract Tests for /api/reviews/booking-status/[bookingId]
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { GET } from "@/app/api/reviews/booking-status/[bookingId]/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { createServerClient } from "@/lib/supabase/server";
import { isReviewsFeatureEnabled } from "@/lib/env";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/env");
jest.mock("@/lib/server-logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;
const mockIsReviewsFeatureEnabled = isReviewsFeatureEnabled as jest.MockedFunction<
  typeof isReviewsFeatureEnabled
>;

describe("/api/reviews/booking-status/[bookingId] - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReviewsFeatureEnabled.mockReturnValue(true);
  });

  describe("Feature disabled", () => {
    it("should return 403 with { error: 'Reviews feature is not enabled' } when feature is disabled", async () => {
      mockIsReviewsFeatureEnabled.mockReturnValue(false);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/reviews/booking-status/booking-123",
      });

      const params = Promise.resolve({ bookingId: "booking-123" });
      const response = await callRouteHandler(GET, request, { params });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: "Reviews feature is not enabled" });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 with { error: 'bookingId is required' } when bookingId is missing", async () => {
      const mockSupabase = {
        from: jest.fn(),
      };
      mockCreateServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/reviews/booking-status/",
      });

      const params = Promise.resolve({ bookingId: "" });
      const response = await callRouteHandler(GET, request, { params });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: "bookingId is required" });
    });
  });

  describe("Booking not found", () => {
    it("should return 404 with { error: 'Booking not found' } when booking does not exist", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        }),
      };
      mockCreateServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/reviews/booking-status/nonexistent-booking",
      });

      const params = Promise.resolve({ bookingId: "nonexistent-booking" });
      const response = await callRouteHandler(GET, request, { params });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: "Booking not found" });
    });
  });
});

