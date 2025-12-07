/**
 * Unit tests for referral code cookie persistence across signup flow
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase.server";
import { createSupabaseServerActionClient } from "@/lib/supabase";

// Mock dependencies
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  createSupabaseServerActionClient: jest.fn(),
}));

jest.mock("@/lib/emails/sendTransactional", () => ({
  sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Referral Code Cookie Persistence", () => {
  let mockCookieStore: {
    get: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
  };
  let mockSupabase: any;
  let mockActionClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Mock action client for verifyOtp
    mockActionClient = {
      auth: {
        verifyOtp: jest.fn(),
      },
      from: jest.fn(),
    };
    (createSupabaseServerActionClient as jest.Mock).mockReturnValue(mockActionClient);

    // Mock Supabase server client
    mockSupabase = {
      from: jest.fn(),
    };
    (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("Cookie Setting via API", () => {
    it("should set secure, httpOnly referral_code cookie with correct settings", async () => {
      const { POST } = await import("@/app/api/referral/set-cookie/route");
      const request = new NextRequest("http://localhost:3000/api/referral/set-cookie", {
        method: "POST",
        body: JSON.stringify({ code: "TEST123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "referral_code",
        "TEST123",
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is 'test' by default
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: "/",
        })
      );
    });

    it("should set secure cookie in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const { POST } = await import("@/app/api/referral/set-cookie/route");
      const request = new NextRequest("http://localhost:3000/api/referral/set-cookie", {
        method: "POST",
        body: JSON.stringify({ code: "PROD123" }),
      });

      await POST(request);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "referral_code",
        "PROD123",
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should uppercase referral code before setting cookie", async () => {
      const { POST } = await import("@/app/api/referral/set-cookie/route");
      const request = new NextRequest("http://localhost:3000/api/referral/set-cookie", {
        method: "POST",
        body: JSON.stringify({ code: "test123" }),
      });

      await POST(request);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "referral_code",
        "TEST123",
        expect.any(Object)
      );
    });
  });

  describe("Cookie Reading and Member Referral Creation", () => {
    it("should read referral_code cookie and create member_referral entry for new user", async () => {
      const referrerUserId = "referrer-user-id-123";
      const referredEmail = "newuser@example.com";
      const referralCode = "REF123";

      // Mock cookie exists
      mockCookieStore.get.mockReturnValue({
        value: referralCode,
      });

      // Mock verifyOtp success
      mockActionClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "new-user-id-456",
            email: referredEmail,
          },
        },
        error: null,
      });

      // Mock saved_searches count (new user = 0)
      mockActionClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
        }),
      });

      // Mock server Supabase queries - referrals table
      const mockReferralsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { referrer_user_id: referrerUserId },
          error: null,
        }),
      };

      // Mock member_referrals - check existing
      const mockMemberReferralsSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null, // No existing referral
          error: null,
        }),
      };

      // Mock member_referrals - insert
      const mockMemberReferralsInsertChain = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      let memberReferralsCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "referrals") {
          return mockReferralsChain;
        }
        if (table === "member_referrals") {
          memberReferralsCallCount++;
          // First call is select (check existing), second is insert
          if (memberReferralsCallCount === 1) {
            return mockMemberReferralsSelectChain;
          }
          return mockMemberReferralsInsertChain;
        }
        return mockSupabase;
      });

      // Import and execute verifyOtpAction
      const { verifyOtpAction } = await import("@/app/account/login/_actions");
      const formData = new FormData();
      formData.append("email", referredEmail);
      formData.append("token", "123456");

      await verifyOtpAction({ status: "idle" }, formData);

      // Verify cookie was read
      expect(mockCookieStore.get).toHaveBeenCalledWith("referral_code");

      // Verify referral lookup was attempted
      expect(mockSupabase.from).toHaveBeenCalledWith("referrals");

      // Verify member_referral insert was attempted
      expect(mockSupabase.from).toHaveBeenCalledWith("member_referrals");
      
      // Verify insert was called with correct data
      expect(mockMemberReferralsInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          referrer_user_id: referrerUserId,
          referred_email: referredEmail.toLowerCase(),
          status: "pending",
          referral_code: expect.any(String),
        })
      );
    });

    it("should delete cookie after successfully creating member_referral", async () => {
      const referrerUserId = "referrer-user-id-123";
      const referredEmail = "newuser@example.com";
      const referralCode = "REF123";

      mockCookieStore.get.mockReturnValue({
        value: referralCode,
      });

      mockActionClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "new-user-id-456",
            email: referredEmail,
          },
        },
        error: null,
      });

      mockActionClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
        }),
      });

      let insertCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "referrals") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { referrer_user_id: referrerUserId },
              error: null,
            }),
          };
        }
        if (table === "member_referrals") {
          insertCallCount++;
          if (insertCallCount === 1) {
            // First call: check existing
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
          // Second call: insert
          return {
            insert: jest.fn().mockResolvedValue({
              error: null, // Success
            }),
          };
        }
        return mockSupabase;
      });

      const { verifyOtpAction } = await import("@/app/account/login/_actions");
      const formData = new FormData();
      formData.append("email", referredEmail);
      formData.append("token", "123456");

      await verifyOtpAction({ status: "idle" }, formData);

      // Verify cookie was deleted after successful insert
      expect(mockCookieStore.delete).toHaveBeenCalledWith("referral_code");
    });

    it("should delete cookie when referral code is invalid", async () => {
      const referredEmail = "newuser@example.com";
      const invalidReferralCode = "INVALID123";

      mockCookieStore.get.mockReturnValue({
        value: invalidReferralCode,
      });

      mockActionClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "new-user-id-456",
            email: referredEmail,
          },
        },
        error: null,
      });

      mockActionClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
        }),
      });

      // Mock no referral found in either table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "referrals" || table === "member_referrals") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const { verifyOtpAction } = await import("@/app/account/login/_actions");
      const formData = new FormData();
      formData.append("email", referredEmail);
      formData.append("token", "123456");

      await verifyOtpAction({ status: "idle" }, formData);

      // Verify cookie was deleted for invalid code
      expect(mockCookieStore.delete).toHaveBeenCalledWith("referral_code");
    });

    it("should delete cookie when referral already exists for email", async () => {
      const referrerUserId = "referrer-user-id-123";
      const referredEmail = "existing@example.com";
      const referralCode = "REF123";

      mockCookieStore.get.mockReturnValue({
        value: referralCode,
      });

      mockActionClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "existing-user-id",
            email: referredEmail,
          },
        },
        error: null,
      });

      mockActionClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
        }),
      });

      let memberReferralsCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "referrals") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { referrer_user_id: referrerUserId },
              error: null,
            }),
          };
        }
        if (table === "member_referrals") {
          memberReferralsCallCount++;
          // First call: check existing - return existing referral
          if (memberReferralsCallCount === 1) {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: "existing-referral-id" }, // Already exists
                error: null,
              }),
            };
          }
        }
        return mockSupabase;
      });

      const { verifyOtpAction } = await import("@/app/account/login/_actions");
      const formData = new FormData();
      formData.append("email", referredEmail);
      formData.append("token", "123456");

      await verifyOtpAction({ status: "idle" }, formData);

      // Verify cookie was deleted when referral already exists
      expect(mockCookieStore.delete).toHaveBeenCalledWith("referral_code");
    });

    it("should not create member_referral if cookie does not exist", async () => {
      const referredEmail = "newuser@example.com";

      mockCookieStore.get.mockReturnValue(undefined);

      mockActionClient.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "new-user-id-456",
            email: referredEmail,
          },
        },
        error: null,
      });

      mockActionClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
        }),
      });

      const { verifyOtpAction } = await import("@/app/account/login/_actions");
      const formData = new FormData();
      formData.append("email", referredEmail);
      formData.append("token", "123456");

      await verifyOtpAction({ status: "idle" }, formData);

      // Verify no referral lookup was attempted
      expect(mockSupabase.from).not.toHaveBeenCalledWith("referrals");
      expect(mockSupabase.from).not.toHaveBeenCalledWith("member_referrals");
    });
  });
});
