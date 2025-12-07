/**
 * Unit tests for reward redemption during checkout flow
 * 
 * Tests:
 * - Coupon validation before checkout session creation
 * - Invalid coupons block checkout (expired, max redemptions, invalid)
 * - Stripe checkout session includes discounts array when coupon provided
 * - Coupon ID and reward ID passed to /api/book/start
 * - Metadata includes reward_id and coupon_id in checkout session
 * - Backward compatibility (checkout without coupon)
 * - Error handling for Stripe API failures
 * 
 * Note: UI component tests (RewardSelector showing discounted price) would be
 * in a separate component test file using React Testing Library.
 */

import { POST } from "@/app/api/book/start/route";
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import { getStripe } from "@/lib/stripe";
import { isBookingsFeatureEnabled } from "@/lib/env";

// Mock dependencies
jest.mock("@/lib/supabase.server");
jest.mock("@/lib/stripe");
jest.mock("@/lib/env", () => ({
  isBookingsFeatureEnabled: jest.fn().mockReturnValue(true),
}));

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockIsBookingsFeatureEnabled = isBookingsFeatureEnabled as jest.MockedFunction<typeof isBookingsFeatureEnabled>;

describe("Reward Redemption During Checkout", () => {
  const mockUserId = "user-123";
  const mockRewardId = "reward-456";
  const mockCouponId = "coupon_test_123";
  const mockClassId = 1;
  const mockOccurrenceId = 100;
  const mockProviderId = 10;
  const mockBookingRequestId = 999;

  let mockSupabase: any;
  let mockStripe: any;
  let mockCouponRetrieve: jest.Mock;
  let mockCheckoutSessionCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    mockIsBookingsFeatureEnabled.mockReturnValue(true);

    // Mock Stripe client
    mockCouponRetrieve = jest.fn();
    mockCheckoutSessionCreate = jest.fn();

    mockStripe = {
      coupons: {
        retrieve: mockCouponRetrieve,
      },
      checkout: {
        sessions: {
          create: mockCheckoutSessionCreate,
        },
      },
    };

    mockGetStripe.mockReturnValue(mockStripe as any);

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);
  });

  const createMockRequest = (body: any): NextRequest => {
    const request = {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
    } as unknown as NextRequest;
    return request;
  };

  const setupMockOccurrenceQuery = (bookable = true, availableSpots = 5) => {
    const mockOccurrence = {
      id: mockOccurrenceId,
      starts_at: "2024-12-01T10:00:00Z",
      ends_at: "2024-12-01T11:00:00Z",
      capacity: 10,
      available_spots: availableSpots,
      bookable,
      class_sessions: {
        id: 1,
        classes: {
          id: mockClassId,
          name: "Test Class",
          price: "£15.00",
          booking_price: "15.00",
          provider_id: mockProviderId,
          providers: {
            id: mockProviderId,
            name: "Test Provider",
            contact_email: "provider@example.com",
          },
        },
      },
    };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockOccurrence,
      error: null,
    });

    mockSupabase.from.mockReturnValueOnce({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq,
          single: mockSingle,
        }),
      }),
    });

    return { mockSelect, mockEq, mockSingle };
  };

  const setupMockBookingRequestInsert = () => {
    const mockBookingRequest = {
      id: mockBookingRequestId,
      class_id: mockClassId,
      provider_id: mockProviderId,
      parent_name: "Test Parent",
      parent_email: "parent@example.com",
      parent_phone: "07123456789",
      child_name: "Test Child",
      child_age: 5,
      total_amount: "15.00",
      status: "pending",
      payment_status: "pending",
    };

    const mockInsert = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockBookingRequest,
      error: null,
    });

    mockSupabase.from.mockReturnValueOnce({
      insert: mockInsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    const mockUpdate = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from.mockReturnValueOnce({
      update: mockUpdate,
    });

    return { mockInsert, mockUpdate };
  };

  describe("Coupon Validation", () => {
    it("should validate coupon before creating checkout session", async () => {
      const validCoupon = {
        id: mockCouponId,
        valid: true,
        amount_off: 500, // £5
        currency: "gbp",
        redeem_by: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        times_redeemed: 0,
        max_redemptions: null,
      };

      mockCouponRetrieve.mockResolvedValueOnce(validCoupon);
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
        reward_id: mockRewardId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCouponRetrieve).toHaveBeenCalledWith(mockCouponId);
      expect(mockCheckoutSessionCreate).toHaveBeenCalled();
    });

    it("should reject invalid coupon (valid = false)", async () => {
      const invalidCoupon = {
        id: mockCouponId,
        valid: false,
      };

      mockCouponRetrieve.mockResolvedValueOnce(invalidCoupon);

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("no longer valid");
      expect(mockCouponRetrieve).toHaveBeenCalledWith(mockCouponId);
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("should reject expired coupon", async () => {
      const expiredCoupon = {
        id: mockCouponId,
        valid: true,
        redeem_by: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      };

      mockCouponRetrieve.mockResolvedValueOnce(expiredCoupon);

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("expired");
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("should reject coupon that reached max redemptions", async () => {
      const maxedCoupon = {
        id: mockCouponId,
        valid: true,
        times_redeemed: 10,
        max_redemptions: 10,
      };

      mockCouponRetrieve.mockResolvedValueOnce(maxedCoupon);

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("redemption limit");
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("should handle missing coupon gracefully", async () => {
      const stripeError: any = new Error("Resource missing");
      stripeError.code = "resource_missing";

      mockCouponRetrieve.mockRejectedValueOnce(stripeError);

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: "invalid_coupon",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid reward coupon");
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });
  });

  describe("Stripe Checkout Session with Discounts", () => {
    it("should include discounts array when valid coupon is provided", async () => {
      const validCoupon = {
        id: mockCouponId,
        valid: true,
        amount_off: 500,
        currency: "gbp",
        redeem_by: Math.floor(Date.now() / 1000) + 86400,
        times_redeemed: 0,
        max_redemptions: null,
      };

      mockCouponRetrieve.mockResolvedValueOnce(validCoupon);
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
        reward_id: mockRewardId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionCreate).toHaveBeenCalled();

      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.discounts).toBeDefined();
      expect(checkoutCall.discounts).toEqual([{ coupon: mockCouponId }]);
    });

    it("should NOT include discounts array when no coupon is provided", async () => {
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionCreate).toHaveBeenCalled();

      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.discounts).toBeUndefined();
      expect(mockCouponRetrieve).not.toHaveBeenCalled();
    });

    it("should include reward_id and coupon_id in checkout session metadata", async () => {
      const validCoupon = {
        id: mockCouponId,
        valid: true,
        amount_off: 500,
        currency: "gbp",
        redeem_by: Math.floor(Date.now() / 1000) + 86400,
        times_redeemed: 0,
        max_redemptions: null,
      };

      mockCouponRetrieve.mockResolvedValueOnce(validCoupon);
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
        reward_id: mockRewardId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.metadata.reward_id).toBe(mockRewardId);
      expect(checkoutCall.metadata.coupon_id).toBe(mockCouponId);
    });
  });

  describe("Checkout Flow Integration", () => {
    it("should create checkout session successfully with valid coupon", async () => {
      const validCoupon = {
        id: mockCouponId,
        valid: true,
        amount_off: 500,
        currency: "gbp",
        redeem_by: Math.floor(Date.now() / 1000) + 86400,
        times_redeemed: 0,
        max_redemptions: null,
      };

      mockCouponRetrieve.mockResolvedValueOnce(validCoupon);
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
        reward_id: mockRewardId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.checkoutUrl).toBe("https://checkout.stripe.com/test");
      expect(data.bookingRequestId).toBe(mockBookingRequestId);

      // Verify coupon was validated
      expect(mockCouponRetrieve).toHaveBeenCalledWith(mockCouponId);

      // Verify checkout session includes discount
      expect(mockCheckoutSessionCreate).toHaveBeenCalled();
      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.discounts).toEqual([{ coupon: mockCouponId }]);
    });

    it("should handle checkout without coupon (backward compatibility)", async () => {
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.checkoutUrl).toBe("https://checkout.stripe.com/test");

      // Verify no coupon validation occurred
      expect(mockCouponRetrieve).not.toHaveBeenCalled();

      // Verify checkout session does not include discounts
      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.discounts).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle Stripe coupon validation errors gracefully", async () => {
      const stripeError: any = new Error("Stripe API error");
      stripeError.code = "api_error";

      mockCouponRetrieve.mockRejectedValueOnce(stripeError);

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("validate reward coupon");
      expect(mockCheckoutSessionCreate).not.toHaveBeenCalled();
    });

    it("should proceed with checkout if coupon_id is provided but reward_id is missing", async () => {
      const validCoupon = {
        id: mockCouponId,
        valid: true,
        amount_off: 500,
        currency: "gbp",
        redeem_by: Math.floor(Date.now() / 1000) + 86400,
        times_redeemed: 0,
        max_redemptions: null,
      };

      mockCouponRetrieve.mockResolvedValueOnce(validCoupon);
      mockCheckoutSessionCreate.mockResolvedValueOnce({
        id: "checkout_session_123",
        url: "https://checkout.stripe.com/test",
      });

      setupMockOccurrenceQuery();
      setupMockBookingRequestInsert();

      const request = createMockRequest({
        classId: mockClassId,
        occurrenceId: mockOccurrenceId,
        parentName: "Test Parent",
        parentEmail: "parent@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
        coupon_id: mockCouponId,
        // reward_id is missing
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionCreate).toHaveBeenCalled();

      const checkoutCall = mockCheckoutSessionCreate.mock.calls[0][0];
      expect(checkoutCall.discounts).toEqual([{ coupon: mockCouponId }]);
      expect(checkoutCall.metadata.reward_id).toBeUndefined();
      expect(checkoutCall.metadata.coupon_id).toBe(mockCouponId);
    });
  });
});

