/**
 * Unit tests for /api/referral/create route
 * Tests self-referral prevention logic
 */

import { POST } from "@/app/api/referral/create/route";
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/ssr";
import { checkReferralRateLimit } from "@/lib/referrals/rateLimit";

// Mock dependencies
jest.mock("@/lib/supabase.server");
jest.mock("@/lib/supabase/ssr");
jest.mock("@/lib/referrals/rateLimit");
jest.mock("@/lib/emails/sendTransactional", () => ({
  sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
}));

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockCreateSupabaseRouteHandlerClient = createSupabaseRouteHandlerClient as jest.MockedFunction<
  typeof createSupabaseRouteHandlerClient
>;
const mockCheckReferralRateLimit = checkReferralRateLimit as jest.MockedFunction<
  typeof checkReferralRateLimit
>;

describe("/api/referral/create - Self-Referral Prevention", () => {
  const mockUserId = "user-123-abc";
  const mockUserEmail = "user@example.com";
  const mockReferralCode = "USER123-ABC456";

  let mockRouteHandlerSupabase: any;
  let mockServerSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock route handler supabase (for auth)
    mockRouteHandlerSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: mockUserId,
                email: mockUserEmail,
              },
            },
          },
        }),
      },
    };

    // Mock server supabase (for database queries)
    mockServerSupabase = {
      from: jest.fn(),
    };

    // Mock createSupabaseRouteHandlerClient to return our mock
    mockCreateSupabaseRouteHandlerClient.mockImplementation((request: any, response: any) => {
      return mockRouteHandlerSupabase as any;
    });
    mockGetSupabaseServer.mockReturnValue(mockServerSupabase as any);
    mockCheckReferralRateLimit.mockResolvedValue({
      allowed: true,
      count: 0,
      remaining: 10,
    });
  });

  const createMockRequest = (body: any): NextRequest => {
    const request = {
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers(),
    } as unknown as NextRequest;
    return request;
  };

  describe("Email-based self-referral prevention", () => {
    it("should return 400 when user tries to refer their own email", async () => {
      const request = createMockRequest({
        referred_email: mockUserEmail, // Same as user's email
        type: "member",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot refer yourself.");
    });

    it("should return 400 when user tries to refer their own email (case-insensitive)", async () => {
      const request = createMockRequest({
        referred_email: mockUserEmail.toUpperCase(), // Different case
        type: "member",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot refer yourself.");
    });

    it("should return 400 when user tries to refer their own email (with whitespace)", async () => {
      const request = createMockRequest({
        referred_email: ` ${mockUserEmail} `, // With whitespace
        type: "member",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot refer yourself.");
    });

    it("should allow referral when email is different", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: "ref-123",
          referrer_user_id: mockUserId,
          referred_email: "other@example.com",
          referral_code: "NEW-CODE",
          status: "pending",
        },
        error: null,
      });
      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      mockServerSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
        rpc: mockRpc,
      });

      const request = createMockRequest({
        referred_email: "other@example.com", // Different email
        type: "member",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("Referral code-based self-referral prevention", () => {
    it("should return 400 when user tries to use their own referral_code", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: {
          referrer_user_id: mockUserId, // Same as current user
        },
        error: null,
      });

      mockServerSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const request = createMockRequest({
        referred_email: "other@example.com",
        type: "member",
        referral_code: mockReferralCode, // User's own referral code
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot refer yourself.");
    });

    it("should allow referral when referral_code belongs to different user", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: {
          referrer_user_id: "different-user-id", // Different user
        },
        error: null,
      });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: "ref-123",
          referrer_user_id: mockUserId,
          referred_email: "other@example.com",
          referral_code: "NEW-CODE",
          status: "pending",
        },
        error: null,
      });
      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      mockServerSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
        rpc: mockRpc,
      });

      const request = createMockRequest({
        referred_email: "other@example.com",
        type: "member",
        referral_code: "OTHER-USER-CODE", // Different user's code
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should allow referral when referral_code does not exist", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null, // Code doesn't exist
        error: null,
      });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: "ref-123",
          referrer_user_id: mockUserId,
          referred_email: "other@example.com",
          referral_code: "NEW-CODE",
          status: "pending",
        },
        error: null,
      });
      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      mockServerSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
        rpc: mockRpc,
      });

      const request = createMockRequest({
        referred_email: "other@example.com",
        type: "member",
        referral_code: "NONEXISTENT-CODE",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle referral_code lookup error gracefully", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: new Error("Database error"), // Error during lookup
      });
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: "ref-123",
          referrer_user_id: mockUserId,
          referred_email: "other@example.com",
          referral_code: "NEW-CODE",
          status: "pending",
        },
        error: null,
      });
      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      mockServerSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
        insert: mockInsert.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
        rpc: mockRpc,
      });

      const request = createMockRequest({
        referred_email: "other@example.com",
        type: "member",
        referral_code: "SOME-CODE",
      });

      // Should proceed with referral creation when lookup fails
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("Combined scenarios", () => {
    it("should prioritize email check over referral_code check", async () => {
      // Even if referral_code is valid, email self-referral should be caught first
      const request = createMockRequest({
        referred_email: mockUserEmail, // Self-referral via email
        type: "member",
        referral_code: "VALID-OTHER-CODE",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot refer yourself.");
      // Email check happens before referral_code check, so from() should not be called for referral_code lookup
      // (it may be called for other checks, but not for the referral_code self-check)
    });
  });
});

