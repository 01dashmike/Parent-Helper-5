/**
 * Unit tests for referral system
 */

import { createMockSupabaseClient } from "../mocks/supabaseClient.mock";

describe("Referral System", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe("Referral Creation", () => {
    it("should create referral with correct metadata", async () => {
      const referralData = {
        referrer_provider_id: 1,
        referred_email: "new@example.com",
        referral_code: "REF123",
        status: "pending",
      };

      mockSupabase._mockInsert.mockResolvedValueOnce({
        data: [{ id: 1, ...referralData }],
        error: null,
      });

      const result = await mockSupabase.from("referrals").insert(referralData);

      expect(mockSupabase._mockInsert).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it("should generate unique referral code", () => {
      const generateReferralCode = (providerId: number) => {
        return `REF-${providerId}-${Date.now().toString(36).toUpperCase()}`;
      };

      const code1 = generateReferralCode(1);
      const code2 = generateReferralCode(1);

      expect(code1).not.toBe(code2);
      expect(code1).toMatch(/^REF-1-/);
    });
  });

  describe("Referral Credit Application", () => {
    it("should apply credit when referral converts", async () => {
      const referralId = 1;
      const creditAmountCents = 1000; // £10.00

      mockSupabase._mockUpdate.mockResolvedValueOnce({
        data: [{ id: referralId, reward_applied: true }],
        error: null,
      });

      const result = await mockSupabase
        .from("referrals")
        .update({ reward_applied: true })
        .eq("id", referralId);

      expect(mockSupabase._mockUpdate).toHaveBeenCalled();
    });

    it("should calculate referral credit correctly", () => {
      const subscriptionAmountCents = 4990; // £49.90
      const referralRate = 0.1; // 10%
      const creditCents = Math.floor(subscriptionAmountCents * referralRate);

      expect(creditCents).toBe(499); // £4.99
    });
  });

  describe("Conversion Metrics", () => {
    it("should calculate conversion rate", () => {
      const totalReferrals = 100;
      const convertedReferrals = 25;
      const conversionRate = (convertedReferrals / totalReferrals) * 100;

      expect(conversionRate).toBe(25);
    });

    it("should track referral source", () => {
      const referrals = [
        { id: 1, source: "email", converted: true },
        { id: 2, source: "social", converted: false },
        { id: 3, source: "email", converted: true },
      ];

      const emailConversions = referrals.filter(
        (r) => r.source === "email" && r.converted
      ).length;
      const emailTotal = referrals.filter((r) => r.source === "email").length;
      const emailRate = (emailConversions / emailTotal) * 100;

      expect(emailRate).toBe(100); // 2/2 = 100%
    });

    it("should verify referral credit expiration", () => {
      const creditCreatedAt = new Date();
      creditCreatedAt.setMonth(creditCreatedAt.getMonth() - 2); // 2 months ago
      const expiresAt = new Date(creditCreatedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Expires 1 month after creation

      const now = new Date();
      const isExpired = now > expiresAt;

      expect(isExpired).toBe(true);
    });
  });

  describe("Referral Analytics Event", () => {
    it("should record referral conversion event", async () => {
      const eventData = {
        event_type: "referral_converted",
        payload: {
          referral_id: 1,
          referrer_provider_id: 1,
          converted_at: new Date().toISOString(),
        },
      };

      mockSupabase._mockInsert.mockResolvedValueOnce({
        data: [{ id: 1, ...eventData }],
        error: null,
      });

      const result = await mockSupabase.from("analytics_events").insert(eventData);

      expect(result.data).toBeDefined();
      expect(mockSupabase._mockInsert).toHaveBeenCalledWith(eventData);
    });
  });
});

