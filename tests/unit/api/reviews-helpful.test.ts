/**
 * API Contract Tests for /api/reviews/helpful
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { POST, GET } from "@/app/api/reviews/helpful/route";
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

describe("/api/reviews/helpful - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsReviewsFeatureEnabled.mockReturnValue(true);
  });

  describe("POST /api/reviews/helpful", () => {
    describe("Feature disabled", () => {
      it("should return 403 with { error: 'Reviews feature is not enabled' } when feature is disabled", async () => {
        mockIsReviewsFeatureEnabled.mockReturnValue(false);

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/reviews/helpful",
          body: {},
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ error: "Reviews feature is not enabled" });
      });
    });

    describe("Validation errors", () => {
      it("should return 400 with { error: 'review_id and is_helpful (boolean) are required' } when review_id is missing", async () => {
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
          url: "http://localhost:3000/api/reviews/helpful",
          body: {
            // Missing review_id
            is_helpful: true,
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          error: "review_id and is_helpful (boolean) are required",
        });
      });

      it("should return 400 when is_helpful is not a boolean", async () => {
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
          url: "http://localhost:3000/api/reviews/helpful",
          body: {
            review_id: "review-123",
            is_helpful: "not-a-boolean",
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          error: "review_id and is_helpful (boolean) are required",
        });
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
          url: "http://localhost:3000/api/reviews/helpful",
          body: {
            review_id: "nonexistent-review",
            is_helpful: true,
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ error: "Review not found" });
      });
    });
  });

  describe("GET /api/reviews/helpful", () => {
    describe("Feature disabled", () => {
      it("should return 403 with { error: 'Reviews feature is not enabled' } when feature is disabled", async () => {
        mockIsReviewsFeatureEnabled.mockReturnValue(false);

        const request = createMockRequest({
          method: "GET",
          url: "http://localhost:3000/api/reviews/helpful",
        });

        const response = await callRouteHandler(GET, request);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ error: "Reviews feature is not enabled" });
      });
    });

    describe("Validation errors", () => {
      it("should return 400 with { error: 'review_id is required' } when review_id query param is missing", async () => {
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
          method: "GET",
          url: "http://localhost:3000/api/reviews/helpful",
          // No review_id query param
        });

        const response = await callRouteHandler(GET, request);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: "review_id is required" });
      });
    });
  });
});

