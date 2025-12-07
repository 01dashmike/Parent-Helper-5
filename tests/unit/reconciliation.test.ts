/**
 * Unit tests for payment reconciliation helpers
 * Tests Stripe charge retrieval, payout status, and revenue computation
 */

import {
  getStripeChargeForBooking,
  getProviderPayoutStatus,
  computeBookingRevenue,
} from "@/lib/payments/reconciliation";

// Mock dependencies
jest.mock("@/lib/stripe");
jest.mock("@/lib/supabase/server");

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("Payment Reconciliation", () => {
  let mockStripe: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Stripe
    mockStripe = {
      charges: {
        retrieve: jest.fn(),
      },
      paymentIntents: {
        retrieve: jest.fn(),
      },
    };
    mockGetStripe.mockReturnValue(mockStripe as any);

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe("getStripeChargeForBooking", () => {
    it("should retrieve charge by charge_id", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 0,
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        payment_intent: "pi_test123",
        discount: null,
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const result = await getStripeChargeForBooking("booking-123", {
        id: "booking-123",
        stripe_charge_id: "ch_test123",
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe("ch_test123");
      expect(result?.amount).toBe(2000);
      expect(mockStripe.charges.retrieve).toHaveBeenCalledWith("ch_test123");
    });

    it("should retrieve charge via payment_intent_id", async () => {
      const mockPaymentIntent = {
        id: "pi_test123",
        charges: {
          data: [
            {
              id: "ch_test123",
              amount: 2000,
              amount_refunded: 0,
              currency: "gbp",
              status: "succeeded",
              paid: true,
              refunded: false,
              discount: null,
              metadata: {},
            },
          ],
        },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await getStripeChargeForBooking("booking-123", {
        id: "booking-123",
        stripe_payment_intent_id: "pi_test123",
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe("ch_test123");
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith("pi_test123");
    });

    it("should handle charge with coupon", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 0,
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        payment_intent: "pi_test123",
        discount: {
          coupon: {
            id: "coupon_10off",
            name: "10% Off",
            percent_off: 10,
          },
        },
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const result = await getStripeChargeForBooking("booking-123", {
        id: "booking-123",
        stripe_charge_id: "ch_test123",
      });

      expect(result?.discount?.coupon?.id).toBe("coupon_10off");
      expect(result?.discount?.coupon?.percent_off).toBe(10);
    });

    it("should return null if charge not found", async () => {
      mockStripe.charges.retrieve.mockRejectedValue(new Error("Not found"));

      const result = await getStripeChargeForBooking("booking-123", {
        id: "booking-123",
        stripe_charge_id: "ch_invalid",
      });

      expect(result).toBeNull();
    });
  });

  describe("getProviderPayoutStatus", () => {
    it("should return processed status when payout exists", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          net_cents: 1860,
        },
      });

      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            payout_id: "po_test123",
            amount: 5000,
            status: "paid",
            arrival_date: "2024-01-05T00:00:00Z",
            provider_id: 1,
          },
        ],
      });

      const result = await getProviderPayoutStatus("booking-123", 1);

      expect(result.processed).toBe(true);
      expect(result.payoutId).toBe("po_test123");
      expect(result.status).toBe("paid");
    });

    it("should return pending status for pending payout", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          net_cents: 1860,
        },
      });

      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            payout_id: "po_test123",
            amount: 5000,
            status: "pending",
            arrival_date: "2024-01-05T00:00:00Z",
            provider_id: 1,
          },
        ],
      });

      const result = await getProviderPayoutStatus("booking-123", 1);

      expect(result.processed).toBe(false);
      expect(result.status).toBe("pending");
    });

    it("should return not processed when no payout found", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          net_cents: 1860,
        },
      });

      mockSupabase.limit.mockResolvedValue({ data: [] });

      const result = await getProviderPayoutStatus("booking-123", 1);

      expect(result.processed).toBe(false);
    });
  });

  describe("computeBookingRevenue", () => {
    it("should compute revenue without coupon", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 0,
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        discount: null,
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_test123",
      };

      const result = await computeBookingRevenue(bookingRow);

      expect(result.grossAmountCents).toBe(2000);
      expect(result.discountCents).toBe(0);
      expect(result.netAmountCents).toBe(2000);
      expect(result.refundAmountCents).toBe(0);
      expect(result.finalAmountCents).toBe(2000);
      expect(result.feeCents).toBe(140); // 7% of 2000
      expect(result.providerNetCents).toBe(1860); // 2000 - 140
      expect(result.hasCoupon).toBe(false);
      expect(result.isRefunded).toBe(false);
      expect(result.isZeroCost).toBe(false);
    });

    it("should compute revenue with coupon", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 0,
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        discount: {
          coupon: {
            id: "coupon_10off",
            name: "10% Off",
            percent_off: 10,
          },
        },
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_test123",
      };

      const result = await computeBookingRevenue(bookingRow);

      expect(result.grossAmountCents).toBe(2000);
      expect(result.discountCents).toBe(200); // 10% of 2000
      expect(result.netAmountCents).toBe(1800); // 2000 - 200
      expect(result.finalAmountCents).toBe(1800);
      expect(result.feeCents).toBe(126); // 7% of 1800
      expect(result.providerNetCents).toBe(1674); // 1800 - 126
      expect(result.hasCoupon).toBe(true);
      expect(result.couponId).toBe("coupon_10off");
    });

    it("should handle pending payout", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 0,
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        discount: null,
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      // Mock payout status as pending
      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: 1,
          created_at: "2024-01-01T00:00:00Z",
          net_cents: 1860,
        },
      });

      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            payout_id: "po_test123",
            amount: 5000,
            status: "pending",
            arrival_date: "2024-01-05T00:00:00Z",
            provider_id: 1,
          },
        ],
      });

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_test123",
        provider_id: 1,
      };

      const revenue = await computeBookingRevenue(bookingRow);
      const payoutStatus = await getProviderPayoutStatus("booking-123", 1);

      expect(revenue.finalAmountCents).toBe(2000);
      expect(payoutStatus.processed).toBe(false);
      expect(payoutStatus.status).toBe("pending");
    });

    it("should handle refunded booking", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 2000, // Full refund
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: true,
        discount: null,
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_test123",
      };

      const result = await computeBookingRevenue(bookingRow);

      expect(result.grossAmountCents).toBe(2000);
      expect(result.refundAmountCents).toBe(2000);
      expect(result.finalAmountCents).toBe(0);
      expect(result.feeCents).toBe(0); // No fee on zero amount
      expect(result.providerNetCents).toBe(0);
      expect(result.isRefunded).toBe(true);
      expect(result.isPartialRefund).toBe(false);
    });

    it("should handle partial refund", async () => {
      const mockCharge = {
        id: "ch_test123",
        amount: 2000,
        amount_refunded: 500, // Partial refund
        currency: "gbp",
        status: "succeeded",
        paid: true,
        refunded: false,
        discount: null,
        metadata: {},
      };

      mockStripe.charges.retrieve.mockResolvedValue(mockCharge);

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_test123",
      };

      const result = await computeBookingRevenue(bookingRow);

      expect(result.grossAmountCents).toBe(2000);
      expect(result.refundAmountCents).toBe(500);
      expect(result.finalAmountCents).toBe(1500);
      expect(result.feeCents).toBe(105); // 7% of 1500
      expect(result.providerNetCents).toBe(1395); // 1500 - 105
      expect(result.isRefunded).toBe(false);
      expect(result.isPartialRefund).toBe(true);
    });

    it("should handle zero-cost booking", async () => {
      const bookingRow = {
        id: "booking-123",
        amount_cents: 0,
      };

      const result = await computeBookingRevenue(bookingRow);

      expect(result.grossAmountCents).toBe(0);
      expect(result.finalAmountCents).toBe(0);
      expect(result.feeCents).toBe(0);
      expect(result.providerNetCents).toBe(0);
      expect(result.isZeroCost).toBe(true);
    });

    it("should handle booking without Stripe charge", async () => {
      mockStripe.charges.retrieve.mockRejectedValue(new Error("Not found"));
      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error("Not found"));

      const bookingRow = {
        id: "booking-123",
        amount_cents: 2000,
        stripe_charge_id: "ch_invalid",
      };

      const result = await computeBookingRevenue(bookingRow);

      // Should fall back to booking amount_cents
      expect(result.grossAmountCents).toBe(2000);
      expect(result.finalAmountCents).toBe(2000);
      expect(result.feeCents).toBe(140);
    });
  });
});

