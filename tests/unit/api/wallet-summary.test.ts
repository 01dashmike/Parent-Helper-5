/**
 * API Contract Tests for /api/wallet/summary
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { GET } from "@/app/api/wallet/summary/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { createSupabaseServerActionClient } from "@/lib/supabase/ssr";

// Mock dependencies
jest.mock("@/lib/supabase/ssr");
jest.mock("@/shared/db", () => ({
  db: {
    select: jest.fn(),
  },
}));
jest.mock("@/lib/server-logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockCreateSupabaseServerActionClient = createSupabaseServerActionClient as jest.MockedFunction<
  typeof createSupabaseServerActionClient
>;

describe("/api/wallet/summary - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Unauthorized access", () => {
    it("should return 401 with { error: 'Unauthorized' } when no session", async () => {
      // Mock no session
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      };
      mockCreateSupabaseServerActionClient.mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/wallet/summary",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: "Unauthorized" });
    });
  });

  describe("Wallet not found", () => {
    it("should return 404 with { error: 'Wallet not found' } when wallet is missing", async () => {
      // Mock authenticated session but no wallet
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
      mockCreateSupabaseServerActionClient.mockReturnValue(mockSupabase as any);

      // Mock database to return no wallet (empty arrays for both owner and member queries)
      const { db } = require("@/shared/db");
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          // First call: walletAsOwner query
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Second call: member query
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });
      db.select = mockSelect;

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/wallet/summary",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: "Wallet not found" });
    });
  });

  // TODO: Test internal server error (500) scenario
  // This would require more complex mocking of database errors
  // and is skipped to keep tests simple and focused on contract validation
});

