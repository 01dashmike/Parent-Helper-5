/**
 * Unit tests for reward redemption with Stripe coupon creation
 */

import { POST } from "@/app/api/rewards/redeem/route";
import { NextRequest } from "next/server";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase.server";
import { getStripe } from "@/lib/stripe";

// Mock dependencies
const mockCouponCreate = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getStripe: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  createSupabaseServerComponentClient: jest.fn(),
}));

jest.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: jest.fn(),
}));

const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockCreateSupabaseServerComponentClient = createSupabaseServerComponentClient as jest.MockedFunction<
  typeof createSupabaseServerComponentClient
>;
const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;

describe("Reward Redemption - Stripe Coupon Creation", () => {
  const mockUserId = "user-123";
  const mockRewardId = "reward-456";

  let mockSupabase: any;
  let mockServerSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment
    process.env.REWARDS_ENABLED = "true";

    // Mock Stripe client
    mockGetStripe.mockReturnValue({
      coupons: {
        create: mockCouponCreate,
      },
    } as any);

    // Mock Supabase client (for auth)
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: mockUserId,
                email: "test@example.com",
              },
            },
          },
        }),
      },
      from: jest.fn(),
    };

    // Mock server Supabase (for database queries)
    mockServerSupabase = {
      from: jest.fn(),
    };

    mockCreateSupabaseServerComponentClient.mockReturnValue(mockSupabase as any);
    mockGetSupabaseServer.mockReturnValue(mockServerSupabase as any);
  });

  const createMockRequest = (body: any): NextRequest => {
    const request = {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
    } as unknown as NextRequest;
    return request;
  };

  describe("Stripe Coupon Creation", () => {
    it("should create Stripe coupon with correct parameters when reward is redeemed", async () => {
      const valueCents = 500; // £5
      const mockCouponId = "coupon_test_123";
      const now = new Date();
      const expectedRedeemBy = Math.floor((now.getTime() + 90 * 24 * 60 * 60 * 1000) / 1000);

      mockCouponCreate.mockResolvedValueOnce({
        id: mockCouponId,
        amount_off: valueCents,
        currency: "gbp",
        duration: "once",
        redeem_by: expectedRedeemBy,
      });

      // Mock reward fetch
      const mockReward = {
        id: mockRewardId,
        user_id: mockUserId,
        value_cents: valueCents,
        status: "available",
        source: "referral",
        metadata: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockReward,
        error: null,
      });
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ ...mockReward, status: "redeemed" }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
        update: mockUpdate,
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stripe_coupon_id).toBe(mockCouponId);

      // Verify Stripe coupon was created with correct parameters
      expect(mockCouponCreate).toHaveBeenCalledTimes(1);
      expect(mockCouponCreate).toHaveBeenCalledWith({
        amount_off: valueCents,
        currency: "gbp",
        duration: "once",
        redeem_by: expect.any(Number),
      });

      // Verify redeem_by is approximately 90 days from now (within 1 minute tolerance)
      const actualRedeemBy = mockCouponCreate.mock.calls[0][0].redeem_by;
      const difference = Math.abs(actualRedeemBy - expectedRedeemBy);
      expect(difference).toBeLessThan(60); // Within 60 seconds
    });

    it("should use expires_at from metadata for redeem_by when available", async () => {
      const valueCents = 1000; // £10
      const mockCouponId = "coupon_test_456";
      const expiresAt = new Date("2024-12-31T23:59:59Z");
      const expectedRedeemBy = Math.floor(expiresAt.getTime() / 1000);

      mockCouponCreate.mockResolvedValueOnce({
        id: mockCouponId,
        amount_off: valueCents,
        currency: "gbp",
        duration: "once",
        redeem_by: expectedRedeemBy,
      });

      const mockReward = {
        id: mockRewardId,
        user_id: mockUserId,
        value_cents: valueCents,
        status: "available",
        source: "referral",
        metadata: {
          expires_at: expiresAt.toISOString(),
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockReward,
        error: null,
      });
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ ...mockReward, status: "redeemed" }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
        update: mockUpdate,
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify redeem_by uses expires_at from metadata
      expect(mockCouponCreate).toHaveBeenCalledWith({
        amount_off: valueCents,
        currency: "gbp",
        duration: "once",
        redeem_by: expectedRedeemBy,
      });
    });

    it("should store stripe_coupon_id in reward metadata", async () => {
      const valueCents = 500;
      const mockCouponId = "coupon_test_789";

      mockCouponCreate.mockResolvedValueOnce({
        id: mockCouponId,
        amount_off: valueCents,
        currency: "gbp",
        duration: "once",
      });

      const mockReward = {
        id: mockRewardId,
        user_id: mockUserId,
        value_cents: valueCents,
        status: "available",
        source: "referral",
        metadata: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockReward,
        error: null,
      });
      const mockUpdate = jest.fn().mockResolvedValue({
        data: [{ ...mockReward, status: "redeemed" }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
        update: mockUpdate,
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      await POST(request);

      // Verify update was called with stripe_coupon_id in metadata
      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0];
      const updateData = updateCall[1];

      expect(updateData.status).toBe("redeemed");
      expect(updateData.metadata).toHaveProperty("stripe_coupon_id", mockCouponId);
    });
  });

  describe("Duplicate Redemption Prevention", () => {
    it("should NOT create a second coupon if stripe_coupon_id already exists in metadata", async () => {
      const existingCouponId = "coupon_existing_123";
      const mockReward = {
        id: mockRewardId,
        user_id: mockUserId,
        value_cents: 500,
        status: "available",
        source: "referral",
        metadata: {
          stripe_coupon_id: existingCouponId,
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockReward,
        error: null,
      });
      const mockUpdate = jest.fn();

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
        update: mockUpdate,
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stripe_coupon_id).toBe(existingCouponId);

      // Verify Stripe coupon creation was NOT called
      expect(mockCouponCreate).not.toHaveBeenCalled();

      // Verify update was NOT called (early return)
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should return error if Stripe coupon creation fails", async () => {
      const valueCents = 500;
      const stripeError = new Error("Stripe API error");

      mockCouponCreate.mockRejectedValueOnce(stripeError);

      const mockReward = {
        id: mockRewardId,
        user_id: mockUserId,
        value_cents: valueCents,
        status: "available",
        source: "referral",
        metadata: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockReward,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create Stripe coupon");
    });

    it("should return 401 if user is not authenticated", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if reward is not found", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        }),
      });

      const request = createMockRequest({ reward_id: mockRewardId });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Reward not found or not available");
    });
  });
});

