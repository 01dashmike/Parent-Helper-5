/**
 * API Contract Tests for /api/wallet/credit
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { POST } from "@/app/api/wallet/credit/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/ssr";
import { isFamilyWalletEnabled } from "@/lib/env";

// Mock dependencies
jest.mock("@/lib/supabase/ssr");
jest.mock("@/lib/env");
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const mockCreateSupabaseRouteHandlerClient = createSupabaseRouteHandlerClient as jest.MockedFunction<
  typeof createSupabaseRouteHandlerClient
>;
const mockIsFamilyWalletEnabled = isFamilyWalletEnabled as jest.MockedFunction<
  typeof isFamilyWalletEnabled
>;

describe("/api/wallet/credit - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFamilyWalletEnabled.mockReturnValue(true);
  });

  describe("Feature disabled", () => {
    it("should return 503 with { error: 'Wallet feature is disabled' } when feature is disabled", async () => {
      mockIsFamilyWalletEnabled.mockReturnValue(false);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/wallet/credit",
        body: {},
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({ error: "Wallet feature is disabled" });
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 with { error: 'Please sign in', message: 'Please sign in' } when no session", async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };
      mockCreateSupabaseRouteHandlerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/wallet/credit",
        body: {
          user_id: "user-123",
          amount_cents: 1000,
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: "Please sign in",
        message: "Please sign in",
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 400 with validation error details when body is invalid", async () => {
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
      mockCreateSupabaseRouteHandlerClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/wallet/credit",
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
});

