/**
 * Unit tests for /api/referral/convert route
 * Tests provider referral conversion logic
 */

import { POST } from "@/app/api/referral/convert/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/supabase.server");
jest.mock("@/lib/referrals/createStripeCoupon");
jest.mock("@/lib/emails/sendTransactional");
jest.mock("@/lib/referrals/analytics");
jest.mock("@/lib/stripe");

import { getSupabaseServer } from "@/lib/supabase.server";
import { createProviderReferralCoupon } from "@/lib/referrals/createStripeCoupon";
import { sendTransactional } from "@/lib/emails/sendTransactional";
import { trackReferralConversion } from "@/lib/referrals/analytics";
import { getStripe } from "@/lib/stripe";

// Type mocks
const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockCreateProviderReferralCoupon = createProviderReferralCoupon as jest.MockedFunction<typeof createProviderReferralCoupon>;
const mockSendTransactional = sendTransactional as jest.MockedFunction<typeof sendTransactional>;
const mockTrackReferralConversion = trackReferralConversion as jest.MockedFunction<typeof trackReferralConversion>;
const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;

describe("POST /api/referral/convert", () => {
  let mockSupabase: any;
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Stripe
    mockStripe = {
      coupons: {
        create: jest.fn().mockResolvedValue({
          id: "provider_ref_test123",
          percent_off: 10,
          duration: "once",
          name: "Provider Referral Reward - 10% Off",
        }),
        retrieve: jest.fn(),
      },
    };
    mockGetStripe.mockReturnValue(mockStripe as any);

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(),
      auth: {
        admin: {
          getUserById: jest.fn(),
          listUsers: jest.fn(),
        },
      },
    };

    // Chainable query builder mocks - create fresh builder for each table
    const createQueryBuilder = () => {
      const builder: any = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
      };

      // Default responses
      builder.select.mockReturnValue(builder);
      builder.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });
      builder.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      builder.eq.mockReturnValue(builder);
      builder.in.mockReturnValue(builder);
      builder.order.mockReturnValue(builder);
      builder.limit.mockReturnValue(builder);
      builder.single.mockResolvedValue({ data: null, error: null });
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });

      return builder;
    };

    mockSupabase.from.mockImplementation(() => createQueryBuilder());
    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);

    // Default email mock
    mockSendTransactional.mockResolvedValue({ ok: true });

    // Default analytics mock
    mockTrackReferralConversion.mockResolvedValue(undefined);
  });

  describe("Provider Referral Conversion", () => {
    it("should convert provider referral when referred provider completes first booking", async () => {
      const bookingId = 123;
      const userEmail = "provider@example.com";
      const referralCode = "PROV_REF_123";
      const referrerProviderId = 1;
      const referredProviderId = 2;

      // Mock booking with referral code and provider_id
      const mockBooking = {
        id: bookingId,
        email: userEmail,
        referral_code: referralCode,
        reward_triggered: false,
        provider_id: referredProviderId,
      };

      // Mock provider referral
      const mockProviderReferral = {
        id: "ref-uuid-123",
        provider_id: referrerProviderId,
        referred_provider_id: referredProviderId,
        referral_code: referralCode,
        status: "registered",
        reward_issued: false,
        created_at: new Date().toISOString(),
      };

      // Mock providers
      const mockReferrerProvider = {
        id: referrerProviderId,
        name: "Referrer Provider",
        contact_email: "referrer@example.com",
      };

      const mockReferredProvider = {
        id: referredProviderId,
        name: "Referred Provider",
        contact_email: "provider@example.com",
      };

      // Mock provider reward
      const mockProviderReward = {
        id: "reward-uuid-123",
        provider_id: referrerProviderId,
        reward_type: "credit",
        reward_value: 0,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Setup Supabase mocks with proper chaining
      // Mock simple_bookings select
      const bookingSelectBuilder = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      bookingSelectBuilder.eq.mockReturnValue(bookingSelectBuilder);
      bookingSelectBuilder.single.mockResolvedValue({ data: mockBooking, error: null });

      // Mock provider_referrals select with full chain
      const providerReferralSelectBuilder = {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
      };
      providerReferralSelectBuilder.eq.mockReturnValue(providerReferralSelectBuilder);
      providerReferralSelectBuilder.in.mockReturnValue(providerReferralSelectBuilder);
      providerReferralSelectBuilder.order.mockReturnValue(providerReferralSelectBuilder);
      providerReferralSelectBuilder.limit.mockReturnValue(providerReferralSelectBuilder);
      providerReferralSelectBuilder.maybeSingle.mockResolvedValue({
        data: mockProviderReferral,
        error: null,
      });

      // Mock providers select
      const providerSelectBuilder = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      providerSelectBuilder.eq.mockReturnValue(providerSelectBuilder);
      providerSelectBuilder.single
        .mockResolvedValueOnce({ data: mockReferrerProvider, error: null })
        .mockResolvedValueOnce({ data: mockReferredProvider, error: null });

      // Mock provider_rewards insert
      const rewardInsertBuilder = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      rewardInsertBuilder.select.mockReturnValue(rewardInsertBuilder);
      rewardInsertBuilder.single.mockResolvedValue({
        data: mockProviderReward,
        error: null,
      });

      // Mock update builders
      const updateBuilder = {
        eq: jest.fn(),
      };
      updateBuilder.eq.mockResolvedValue({ data: null, error: null });

      // Setup from() to return appropriate builders
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "simple_bookings") {
          return {
            select: jest.fn().mockReturnValue(bookingSelectBuilder),
            update: jest.fn().mockReturnValue(updateBuilder),
          };
        }
        if (table === "provider_referrals") {
          return {
            select: jest.fn().mockReturnValue(providerReferralSelectBuilder),
            update: jest.fn().mockReturnValue(updateBuilder),
          };
        }
        if (table === "providers") {
          return {
            select: jest.fn().mockReturnValue(providerSelectBuilder),
          };
        }
        if (table === "provider_rewards") {
          return {
            insert: jest.fn().mockReturnValue(rewardInsertBuilder),
          };
        }
        if (table === "bookings") {
          return {
            update: jest.fn().mockReturnValue(updateBuilder),
          };
        }
        return createQueryBuilder();
      });

      // Mock Stripe coupon creation
      mockCreateProviderReferralCoupon.mockResolvedValue({
        ok: true,
        couponId: "provider_ref_test123",
      });

      // Create request
      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: userEmail,
        }),
      });

      // Call route handler
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.type).toBe("provider_referral");
      expect(responseData.reward_created).toBe(true);
      expect(responseData.coupon_created).toBe(true);
      expect(responseData.coupon_id).toBe("provider_ref_test123");

      // Verify provider referral was updated
      expect(updateBuilder.eq).toHaveBeenCalled();
      const updateCalls = updateBuilder.eq.mock.calls;
      const referralUpdateCall = updateCalls.find((call: any[]) => call[0] === "id");
      expect(referralUpdateCall).toBeDefined();

      // Verify Stripe coupon was created
      expect(mockCreateProviderReferralCoupon).toHaveBeenCalledWith("ref-uuid-123");

      // Verify provider reward was created with coupon ID in metadata
      expect(rewardInsertBuilder.select).toHaveBeenCalled();
      const rewardInsertCalls = mockSupabase.from.mock.calls.filter(
        (call: any[]) => call[0] === "provider_rewards"
      );
      expect(rewardInsertCalls.length).toBeGreaterThan(0);
    });

    it("should create 10% Stripe coupon and store in provider reward metadata", async () => {
      const bookingId = 123;
      const referralCode = "PROV_REF_123";
      const referralId = "ref-uuid-123";

      // Setup mocks (simplified for this specific test)
      mockSupabase.from("simple_bookings").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              referral_code: referralCode,
              provider_id: 2,
              reward_triggered: false,
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: {
                      id: referralId,
                      provider_id: 1,
                      referred_provider_id: 2,
                      referral_code: referralCode,
                      status: "registered",
                      reward_issued: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabase.from("providers").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
            .mockResolvedValueOnce({
              data: { id: 1, name: "Referrer", contact_email: "ref@example.com" },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 2, name: "Referred", contact_email: "refd@example.com" },
              error: null,
            }),
        }),
      });

      mockSupabase.from("provider_rewards").insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "reward-123" },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("simple_bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockCreateProviderReferralCoupon.mockResolvedValue({
        ok: true,
        couponId: "provider_ref_test123",
      });

      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: "test@example.com",
        }),
      });

      await POST(request);

      // Verify Stripe coupon creation
      expect(mockCreateProviderReferralCoupon).toHaveBeenCalledWith(referralId);

      // Verify coupon ID stored in metadata
      const rewardInsertCall = mockSupabase.from("provider_rewards").insert.mock.calls[0];
      expect(rewardInsertCall[0].metadata.stripe_coupon_id).toBe("provider_ref_test123");
    });

    it("should mark provider referral as converted with status 'first_booking' and reward_issued: true", async () => {
      const bookingId = 123;
      const referralId = "ref-uuid-123";

      mockSupabase.from("simple_bookings").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              referral_code: "PROV_REF_123",
              provider_id: 2,
              reward_triggered: false,
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: {
                      id: referralId,
                      provider_id: 1,
                      referred_provider_id: 2,
                      status: "registered",
                      reward_issued: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabase.from("providers").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
            .mockResolvedValueOnce({
              data: { id: 1, name: "Referrer", contact_email: "ref@example.com" },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 2, name: "Referred", contact_email: "refd@example.com" },
              error: null,
            }),
        }),
      });

      mockSupabase.from("provider_rewards").insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "reward-123" },
            error: null,
          }),
        }),
      });

      const updateMock = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from("provider_referrals").update.mockReturnValue({
        eq: jest.fn().mockReturnValue(updateMock),
      });

      mockSupabase.from("simple_bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockCreateProviderReferralCoupon.mockResolvedValue({
        ok: true,
        couponId: "provider_ref_test123",
      });

      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: "test@example.com",
        }),
      });

      await POST(request);

      // Verify referral status update
      expect(mockSupabase.from("provider_referrals").update).toHaveBeenCalled();
      const updateCall = mockSupabase.from("provider_referrals").update.mock.calls[0];
      expect(updateCall[0]).toMatchObject({
        status: "first_booking",
        reward_issued: true,
      });
      expect(mockSupabase.from("provider_referrals").update().eq).toHaveBeenCalledWith("id", referralId);
    });

    it("should send provider referral reward email", async () => {
      const bookingId = 123;
      const referrerEmail = "referrer@example.com";
      const referrerName = "Referrer Provider";
      const referredName = "Referred Provider";

      mockSupabase.from("simple_bookings").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              referral_code: "PROV_REF_123",
              provider_id: 2,
              reward_triggered: false,
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: {
                      id: "ref-uuid-123",
                      provider_id: 1,
                      referred_provider_id: 2,
                      status: "registered",
                      reward_issued: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabase.from("providers").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
            .mockResolvedValueOnce({
              data: { id: 1, name: referrerName, contact_email: referrerEmail },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 2, name: referredName, contact_email: "referred@example.com" },
              error: null,
            }),
        }),
      });

      mockSupabase.from("provider_rewards").insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: "reward-123",
              expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("simple_bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockCreateProviderReferralCoupon.mockResolvedValue({
        ok: true,
        couponId: "provider_ref_test123",
      });

      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: "test@example.com",
        }),
      });

      await POST(request);

      // Verify email was sent
      expect(mockSendTransactional).toHaveBeenCalled();
      const emailCall = mockSendTransactional.mock.calls[0][0];
      expect(emailCall.to).toBe(referrerEmail);
      expect(emailCall.subject).toContain("provider referral reward");
      expect(emailCall.type).toBe("provider_referral_reward");
    });
  });

  describe("Member Referrals Unaffected", () => {
    it("should not process member referrals when provider referral exists", async () => {
      const bookingId = 123;
      const referralCode = "PROV_REF_123";

      // Mock booking with provider referral code
      mockSupabase.from("simple_bookings").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              referral_code: referralCode,
              provider_id: 2,
              reward_triggered: false,
            },
            error: null,
          }),
        }),
      });

      // Mock provider referral found
      mockSupabase.from("provider_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: {
                      id: "ref-uuid-123",
                      provider_id: 1,
                      referred_provider_id: 2,
                      referral_code: referralCode,
                      status: "registered",
                      reward_issued: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabase.from("providers").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
            .mockResolvedValueOnce({
              data: { id: 1, name: "Referrer", contact_email: "ref@example.com" },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { id: 2, name: "Referred", contact_email: "refd@example.com" },
              error: null,
            }),
        }),
      });

      mockSupabase.from("provider_rewards").insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "reward-123" },
            error: null,
          }),
        }),
      });

      mockSupabase.from("provider_referrals").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("simple_bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockCreateProviderReferralCoupon.mockResolvedValue({
        ok: true,
        couponId: "provider_ref_test123",
      });

      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: "test@example.com",
        }),
      });

      await POST(request);

      // Verify member_referrals table was NOT queried
      expect(mockSupabase.from).not.toHaveBeenCalledWith("member_referrals");

      // Verify provider referral was processed instead
      expect(mockSupabase.from("provider_referrals").select).toHaveBeenCalled();
    });

    it("should process member referrals when no provider referral exists", async () => {
      const bookingId = 123;
      const userEmail = "member@example.com";
      const referralId = "member-ref-uuid-123";

      // Mock booking without provider referral
      mockSupabase.from("simple_bookings").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              email: userEmail,
              referral_code: null,
              provider_id: null,
              reward_triggered: false,
            },
            error: null,
          }),
        }),
      });

      // Mock no provider referral found
      mockSupabase.from("provider_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      // Mock member referral found
      mockSupabase.from("member_referrals").select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: referralId,
                referrer_user_id: "user-uuid-123",
                referred_email: userEmail,
                referral_code: "MEMBER_REF_123",
                status: "pending",
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock booking count (first booking) - need to reset and recreate builder
      const countBuilder1 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      countBuilder1.select.mockReturnValue(countBuilder1);
      countBuilder1.eq.mockReturnValue(countBuilder1);
      countBuilder1.eq.mockReturnValueOnce(countBuilder1);
      countBuilder1.eq.mockReturnValueOnce({
        data: null,
        error: null,
        count: 1,
      });

      const countBuilder2 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      countBuilder2.select.mockReturnValue(countBuilder2);
      countBuilder2.eq.mockReturnValue(countBuilder2);
      countBuilder2.eq.mockReturnValueOnce(countBuilder2);
      countBuilder2.eq.mockReturnValueOnce({
        data: null,
        error: null,
        count: 0,
      });

      mockSupabase.from.mockReturnValueOnce(countBuilder1);
      mockSupabase.from.mockReturnValueOnce(countBuilder2);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: "user-uuid-123",
            email: "referrer@example.com",
          },
        },
        error: null,
      });

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: "referred-uuid-123",
              email: userEmail,
            },
          ],
        },
        error: null,
      });

      mockSupabase.from("rewards").insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "reward-123" },
            error: null,
          }),
        }),
      });

      mockSupabase.from("member_referrals").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("simple_bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabase.from("bookings").update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const request = new NextRequest("http://localhost/api/referral/convert", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          user_email: userEmail,
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Verify member referral was processed
      expect(mockSupabase.from("member_referrals").select).toHaveBeenCalled();
      expect(responseData.success).toBe(true);
      expect(responseData.type).toBeUndefined(); // No type for member referrals
    });
  });
});

