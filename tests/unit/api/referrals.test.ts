/**
 * API Contract Tests for /api/referrals
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { GET, POST } from "@/app/api/referrals/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { createSupabaseServerComponentClient } from "@/lib/supabase";

// Mock dependencies
jest.mock("@/lib/supabase");
jest.mock("@/lib/server-logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock environment variable
const originalEnv = process.env.REFERRALS_ENABLED;

const mockCreateSupabaseServerComponentClient = createSupabaseServerComponentClient as jest.MockedFunction<
  typeof createSupabaseServerComponentClient
>;

describe("/api/referrals - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REFERRALS_ENABLED = "true";
  });

  afterAll(() => {
    process.env.REFERRALS_ENABLED = originalEnv;
  });

  describe("GET /api/referrals", () => {
    describe("Feature disabled", () => {
      it("should return 403 with { error: 'Referrals feature is not enabled' } when feature is disabled", async () => {
        process.env.REFERRALS_ENABLED = "false";

        const request = createMockRequest({
          method: "GET",
          url: "http://localhost:3000/api/referrals",
        });

        const response = await callRouteHandler(GET, request);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ error: "Referrals feature is not enabled" });
      });
    });

    describe("Unauthorized access", () => {
      it("should return 401 with { error: 'Unauthorized' } when no session", async () => {
        const mockSupabase = {
          auth: {
            getSession: jest.fn().mockResolvedValue({
              data: { session: null },
            }),
          },
        };
        mockCreateSupabaseServerComponentClient.mockReturnValue(mockSupabase as any);

        const request = createMockRequest({
          method: "GET",
          url: "http://localhost:3000/api/referrals",
        });

        const response = await callRouteHandler(GET, request);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ error: "Unauthorized" });
      });
    });
  });

  describe("POST /api/referrals", () => {
    describe("Feature disabled", () => {
      it("should return 403 with { error: 'Referrals feature is not enabled' } when feature is disabled", async () => {
        process.env.REFERRALS_ENABLED = "false";

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/referrals",
          body: {},
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ error: "Referrals feature is not enabled" });
      });
    });

    describe("Unauthorized access", () => {
      it("should return 401 with { error: 'Unauthorized' } when no session", async () => {
        const mockSupabase = {
          auth: {
            getSession: jest.fn().mockResolvedValue({
              data: { session: null },
            }),
          },
        };
        mockCreateSupabaseServerComponentClient.mockReturnValue(mockSupabase as any);

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/referrals",
          body: {
            referred_email: "test@example.com",
            referred_name: "Test User",
            referral_type: "member",
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ error: "Unauthorized" });
      });
    });

    describe("Validation errors", () => {
      it("should return 400 with { error: 'Invalid request', details: [...] } when body is invalid", async () => {
        const mockSupabase = {
          auth: {
            getSession: jest.fn().mockResolvedValue({
              data: {
                session: {
                  user: {
                    id: "user-123",
                  },
                },
              },
            }),
          },
        };
        mockCreateSupabaseServerComponentClient.mockReturnValue(mockSupabase as any);

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/referrals",
          body: {
            // Missing required fields
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: "Invalid request" });
        expect(response.body).toHaveProperty("details");
      });
    });

    describe("Invalid JSON", () => {
      it("should return 400 with { error: 'Invalid JSON in request body' } when JSON is malformed", async () => {
        const mockSupabase = {
          auth: {
            getSession: jest.fn().mockResolvedValue({
              data: {
                session: {
                  user: {
                    id: "user-123",
                  },
                },
              },
            }),
          },
        };
        mockCreateSupabaseServerComponentClient.mockReturnValue(mockSupabase as any);

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/referrals",
          body: null,
        });
        // Simulate JSON parse error
        request.json = jest.fn().mockRejectedValue(new SyntaxError("Unexpected token"));

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: "Invalid JSON in request body" });
      });
    });
  });
});

