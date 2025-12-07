/**
 * API Contract Tests for /api/stripe/webhook
 * Tests error responses to lock in current behavior (status codes + JSON shape)
 */

import { POST } from "@/app/api/stripe/webhook/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";
import { getStripe } from "@/lib/stripe";
import { headers } from "next/headers";

// Mock dependencies
jest.mock("@/lib/stripe");
jest.mock("next/headers");
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));
jest.mock("@/lib/server-logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;

describe("/api/stripe/webhook - Error Contract Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FEATURE_BOOKINGS = "true";
  });

  afterEach(() => {
    delete process.env.FEATURE_BOOKINGS;
  });

  describe("Feature disabled", () => {
    it("should return 404 with { error: 'Not found' } when bookings feature is disabled", async () => {
      process.env.FEATURE_BOOKINGS = "false";

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/stripe/webhook",
        body: "test body",
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: "Not found" });
    });
  });

  describe("Webhook secret missing", () => {
    it("should return 500 with { error: 'Webhook secret not configured' } when STRIPE_WEBHOOK_SECRET is missing", async () => {
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      mockHeaders.mockResolvedValue({
        get: jest.fn().mockReturnValue(null),
      } as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/stripe/webhook",
        body: "test body",
        headers: {
          "stripe-signature": "test-signature",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: "Webhook secret not configured" });

      // Restore
      if (originalSecret) {
        process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      }
    });
  });

  describe("Invalid signature", () => {
    it("should return 400 with { error: 'Invalid signature' } when signature verification fails", async () => {
      process.env.STRIPE_WEBHOOK_SECRET = "test-secret";

      const mockStripe = {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error("Invalid signature");
          }),
        },
      };
      mockGetStripe.mockReturnValue(mockStripe as any);

      mockHeaders.mockResolvedValue({
        get: jest.fn().mockReturnValue("invalid-signature"),
      } as any);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/stripe/webhook",
        body: "test body",
        headers: {
          "stripe-signature": "invalid-signature",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: "Invalid signature" });
    });
  });
});

