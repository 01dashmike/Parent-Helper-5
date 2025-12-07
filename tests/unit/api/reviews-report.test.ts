/**
 * API Contract Tests for /api/reviews/report
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { POST } from "@/app/api/reviews/report/route";
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

describe("/api/reviews/report - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReviewsFeatureEnabled.mockReturnValue(true);
  });

  describe("Feature disabled", () => {
    it("should return 403 with { error: 'Reviews feature is not enabled' } when feature is disabled", async () => {
      mockIsReviewsFeatureEnabled.mockReturnValue(false);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/reviews/report",
        body: {},
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: "Reviews feature is not enabled" });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 with { error: 'review_id and report_type are required' } when required fields are missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
        from: jest.fn(),
      };
      mockCreateServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/reviews/report",
        body: {
          // Missing review_id and report_type
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "review_id and report_type are required",
      });
    });

    it("should return 400 with { error: 'report_type must be one of: ...' } when report_type is invalid", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
        from: jest.fn(),
      };
      mockCreateServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/reviews/report",
        body: {
          review_id: "review-123",
          report_type: "invalid-type",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body?.error).toContain("report_type must be one of");
    });
  });

  describe("Review not found", () => {
    it("should return 404 with { error: 'Review not found' } when review does not exist", async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };
      mockCreateServerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/reviews/report",
        body: {
          review_id: "nonexistent-review",
          report_type: "spam",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: "Review not found" });
    });
  });
});

