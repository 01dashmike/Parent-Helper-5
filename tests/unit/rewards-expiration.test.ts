/**
 * Unit tests for /api/cron/rewards-expiration route
 * Tests reward expiration cron job logic
 */

import { GET } from "@/app/api/cron/rewards-expiration/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/supabase.server");
jest.mock("@/lib/emails/sendTransactional");

import { getSupabaseServer } from "@/lib/supabase.server";
import { sendTransactional } from "@/lib/emails/sendTransactional";

// Type mocks
const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockSendTransactional = sendTransactional as jest.MockedFunction<typeof sendTransactional>;

describe("GET /api/cron/rewards-expiration", () => {
  let mockSupabase: any;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(),
      auth: {
        admin: {
          getUserById: jest.fn(),
        },
      },
    };

    // Chainable query builder mocks
    const createQueryBuilder = () => {
      const builder: any = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
      };

      builder.select.mockReturnValue(builder);
      builder.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      builder.eq.mockReturnValue(builder);
      builder.in.mockReturnValue(builder);
      builder.gte.mockReturnValue(builder);
      builder.lte.mockReturnValue(builder);
      builder.lt.mockReturnValue(builder);
      builder.not.mockReturnValue(builder);

      return builder;
    };

    mockSupabase.from.mockImplementation(() => createQueryBuilder());
    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);

    // Default email mock
    mockSendTransactional.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("CRON_SECRET authentication", () => {
    it("should reject requests without CRON_SECRET when env var is set", async () => {
      process.env.CRON_SECRET = "test-secret-123";

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe("Forbidden");
      expect(mockGetSupabaseServer).not.toHaveBeenCalled();
    });

    it("should reject requests with incorrect CRON_SECRET", async () => {
      process.env.CRON_SECRET = "test-secret-123";

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {
          "x-cron-secret": "wrong-secret",
        },
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe("Forbidden");
    });

    it("should accept requests with correct CRON_SECRET", async () => {
      process.env.CRON_SECRET = "test-secret-123";

      // Mock empty results
      mockSupabase.from("rewards").select.mockReturnValue({
        data: [],
        error: null,
      });
      mockSupabase.from("provider_rewards").select.mockReturnValue({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {
          "x-cron-secret": "test-secret-123",
        },
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
    });

    it("should allow requests when CRON_SECRET is not set", async () => {
      delete process.env.CRON_SECRET;

      // Mock empty results
      mockSupabase.from("rewards").select.mockReturnValue({
        data: [],
        error: null,
      });
      mockSupabase.from("provider_rewards").select.mockReturnValue({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
    });
  });

  describe("Member rewards expiration", () => {
    it("should expire member rewards with expired expires_at in metadata", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const userId = "user-uuid-123";

      const expiredReward = {
        id: "reward-uuid-1",
        user_id: userId,
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: pastDate.toISOString(),
        },
      };

      // Mock fetching available rewards
      mockSupabase.from("rewards").select.mockReturnValue({
        data: [expiredReward],
        error: null,
      });

      // Mock user lookup
      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      // Mock update
      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      expect(responseData.expired.member_rewards).toBe(1);
      expect(responseData.expired.total).toBe(1);

      // Verify update was called with expired_by_cron
      expect(mockSupabase.from("rewards").update).toHaveBeenCalled();
      const updateCall = mockSupabase.from("rewards").update.mock.calls[0];
      expect(updateCall[0]).toMatchObject({
        status: "expired",
      });
      expect(updateCall[0].metadata.expired_by_cron).toBe(true);
      expect(updateCall[0].metadata.expired_at).toBeDefined();

      // Verify email was sent
      expect(mockSendTransactional).toHaveBeenCalled();
      const emailCall = mockSendTransactional.mock.calls[0][0];
      expect(emailCall.to).toBe("user@example.com");
      expect(emailCall.subject).toBe("Your Parent Helper reward has expired");
      expect(emailCall.type).toBe("reward_expired");
    });

    it("should not expire rewards that haven't expired yet", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

      const activeReward = {
        id: "reward-uuid-2",
        user_id: "user-uuid-123",
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: futureDate.toISOString(),
        },
      };

      mockSupabase.from("rewards").select.mockReturnValue({
        data: [activeReward],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.expired.member_rewards).toBe(0);
      expect(mockSupabase.from("rewards").update).not.toHaveBeenCalled();
    });

    it("should add expired_by_cron to metadata when expiring", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const userId = "user-uuid-123";

      const expiredReward = {
        id: "reward-uuid-3",
        user_id: userId,
        value_cents: 500,
        points: 500,
        source: "booking",
        metadata: {
          source: "booking",
          booking_id: "booking-123",
          expires_at: pastDate.toISOString(),
        },
      };

      mockSupabase.from("rewards").select.mockReturnValue({
        data: [expiredReward],
        error: null,
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      await GET(request);

      // Verify metadata includes expired_by_cron and preserves existing fields
      const updateCall = mockSupabase.from("rewards").update.mock.calls[0];
      expect(updateCall[0].metadata.expired_by_cron).toBe(true);
      expect(updateCall[0].metadata.expired_at).toBeDefined();
      expect(updateCall[0].metadata.source).toBe("booking");
      expect(updateCall[0].metadata.booking_id).toBe("booking-123");
    });
  });

  describe("Provider rewards expiration", () => {
    it("should expire provider rewards with expired expires_at", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const providerId = 123;

      const expiredProviderReward = {
        id: "provider-reward-uuid-1",
        provider_id: providerId,
        reward_type: "credit",
        reward_value: 1000,
        reason: "Provider referral reward",
        expires_at: pastDate.toISOString(),
        metadata: {},
      };

      // Mock fetching expired provider rewards
      const providerRewardSelectBuilder = {
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        select: jest.fn(),
      };
      providerRewardSelectBuilder.select.mockReturnValue(providerRewardSelectBuilder);
      providerRewardSelectBuilder.eq.mockReturnValue(providerRewardSelectBuilder);
      providerRewardSelectBuilder.lt.mockReturnValue({
        data: [expiredProviderReward],
        error: null,
      });

      // Mock providers query
      const providersSelectBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn(),
      };
      providersSelectBuilder.in.mockReturnValue({
        data: [
          {
            id: providerId,
            name: "Test Provider",
            billing_email: "provider@example.com",
            contact_email: null,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "provider_rewards") {
          return {
            select: jest.fn().mockReturnValue(providerRewardSelectBuilder),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "providers") {
          return providersSelectBuilder;
        }
        if (table === "rewards") {
          return {
            select: jest.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        };
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      expect(responseData.expired.provider_rewards).toBe(1);
      expect(responseData.expired.total).toBe(1);

      // Verify update was called
      expect(mockSupabase.from("provider_rewards").update).toHaveBeenCalled();
      const updateCall = mockSupabase.from("provider_rewards").update.mock.calls[0];
      expect(updateCall[0]).toMatchObject({
        status: "expired",
      });
      expect(updateCall[0].metadata.expired_by_cron).toBe(true);

      // Verify email was sent
      expect(mockSendTransactional).toHaveBeenCalled();
      const emailCall = mockSendTransactional.mock.calls.find(
        (call: any[]) => call[0].type === "provider_reward_expired"
      );
      expect(emailCall).toBeDefined();
      expect(emailCall[0].to).toBe("provider@example.com");
    });
  });

  describe("Expiring soon warnings", () => {
    it("should send expiring soon warning for member rewards", async () => {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const userId = "user-uuid-123";

      const expiringSoonReward = {
        id: "reward-uuid-4",
        user_id: userId,
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: threeDaysFromNow.toISOString(),
          // No expiring_soon_warning_sent flag
        },
      };

      // Mock fetching available rewards (called twice - once for expired, once for expiring soon)
      mockSupabase.from("rewards").select
        .mockReturnValueOnce({
          data: [], // No expired rewards
          error: null,
        })
        .mockReturnValueOnce({
          data: [expiringSoonReward], // Expiring soon rewards
          error: null,
        });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      // Mock provider rewards queries
      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.expiring_soon_warnings_sent.member).toBe(1);
      expect(responseData.expiring_soon_warnings_sent.total).toBe(1);

      // Verify email was sent
      expect(mockSendTransactional).toHaveBeenCalled();
      const emailCall = mockSendTransactional.mock.calls.find(
        (call: any[]) => call[0].type === "reward_expiring_soon"
      );
      expect(emailCall).toBeDefined();
      expect(emailCall[0].to).toBe("user@example.com");
      expect(emailCall[0].subject).toContain("expires in 3 days");

      // Verify warning flag was set in metadata
      expect(mockSupabase.from("rewards").update).toHaveBeenCalled();
      const updateCall = mockSupabase.from("rewards").update.mock.calls.find(
        (call: any[]) => call[0].metadata?.expiring_soon_warning_sent === true
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[0].metadata.expiring_soon_warning_sent_at).toBeDefined();
    });

    it("should not send expiring soon warning if already sent", async () => {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const alreadyWarnedReward = {
        id: "reward-uuid-5",
        user_id: "user-uuid-123",
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: threeDaysFromNow.toISOString(),
          expiring_soon_warning_sent: true, // Already warned
        },
      };

      mockSupabase.from("rewards").select
        .mockReturnValueOnce({
          data: [],
          error: null,
        })
        .mockReturnValueOnce({
          data: [alreadyWarnedReward],
          error: null,
        });

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.expiring_soon_warnings_sent.member).toBe(0);

      // Verify no expiring soon email was sent
      const expiringSoonEmail = mockSendTransactional.mock.calls.find(
        (call: any[]) => call[0].type === "reward_expiring_soon"
      );
      expect(expiringSoonEmail).toBeUndefined();
    });

    it("should send expiring soon warning exactly once per reward", async () => {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const userId = "user-uuid-123";

      const expiringSoonReward = {
        id: "reward-uuid-6",
        user_id: userId,
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: threeDaysFromNow.toISOString(),
        },
      };

      mockSupabase.from("rewards").select
        .mockReturnValueOnce({
          data: [],
          error: null,
        })
        .mockReturnValueOnce({
          data: [expiringSoonReward],
          error: null,
        });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      await GET(request);

      // Verify email was sent only once
      const expiringSoonEmails = mockSendTransactional.mock.calls.filter(
        (call: any[]) => call[0].type === "reward_expiring_soon"
      );
      expect(expiringSoonEmails.length).toBe(1);

      // Verify warning flag was set
      const warningUpdateCall = mockSupabase.from("rewards").update.mock.calls.find(
        (call: any[]) => call[0].metadata?.expiring_soon_warning_sent === true
      );
      expect(warningUpdateCall).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should continue processing other rewards when one fails", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const reward1 = {
        id: "reward-uuid-7",
        user_id: "user-uuid-1",
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: pastDate.toISOString(),
        },
      };

      const reward2 = {
        id: "reward-uuid-8",
        user_id: "user-uuid-2",
        value_cents: 1000,
        points: 1000,
        source: "booking",
        metadata: {
          source: "booking",
          expires_at: pastDate.toISOString(),
        },
      };

      mockSupabase.from("rewards").select.mockReturnValue({
        data: [reward1, reward2],
        error: null,
      });

      // First user lookup succeeds, second fails
      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "user-uuid-1",
              email: "user1@example.com",
            },
          },
          error: null,
        })
        .mockRejectedValueOnce(new Error("User not found"));

      // First update succeeds, second fails
      const updateBuilder = {
        eq: jest
          .fn()
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValueOnce({ data: null, error: { message: "Update failed" } }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      // Should process at least one reward successfully
      expect(responseData.expired.member_rewards).toBeGreaterThan(0);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.from("rewards").select.mockReturnValue({
        data: null,
        error: { message: "Database connection error" },
      });

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      // Should still return success but with 0 expired
      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      expect(responseData.expired.member_rewards).toBe(0);
    });

    it("should handle email sending failures gracefully", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const userId = "user-uuid-123";

      const expiredReward = {
        id: "reward-uuid-9",
        user_id: userId,
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: pastDate.toISOString(),
        },
      };

      mockSupabase.from("rewards").select.mockReturnValue({
        data: [expiredReward],
        error: null,
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: "user@example.com",
          },
        },
        error: null,
      });

      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      // Email sending fails
      mockSendTransactional.mockResolvedValue({
        ok: false,
        error: "Email service unavailable",
      });

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      // Reward should still be expired even if email fails
      expect(responseData.expired.member_rewards).toBe(1);
      // But no emails sent
      expect(responseData.expiration_emails_sent.member).toBe(0);
    });
  });

  describe("Summary response", () => {
    it("should return comprehensive summary with all counts", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const expiredReward = {
        id: "reward-uuid-10",
        user_id: "user-uuid-1",
        value_cents: 500,
        points: 500,
        source: "referral",
        metadata: {
          source: "referral",
          expires_at: pastDate.toISOString(),
        },
      };

      const expiringSoonReward = {
        id: "reward-uuid-11",
        user_id: "user-uuid-2",
        value_cents: 1000,
        points: 1000,
        source: "booking",
        metadata: {
          source: "booking",
          expires_at: threeDaysFromNow.toISOString(),
        },
      };

      mockSupabase.from("rewards").select
        .mockReturnValueOnce({
          data: [expiredReward],
          error: null,
        })
        .mockReturnValueOnce({
          data: [expiringSoonReward],
          error: null,
        });

      mockSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "user-uuid-1",
              email: "user1@example.com",
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            user: {
              id: "user-uuid-2",
              email: "user2@example.com",
            },
          },
          error: null,
        });

      const updateBuilder = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from("rewards").update.mockReturnValue(updateBuilder);

      mockSupabase.from("provider_rewards").select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest("http://localhost/api/cron/rewards-expiration", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.ok).toBe(true);
      expect(responseData.expired).toBeDefined();
      expect(responseData.expired.member_rewards).toBe(1);
      expect(responseData.expired.provider_rewards).toBe(0);
      expect(responseData.expired.total).toBe(1);
      expect(responseData.expiration_emails_sent).toBeDefined();
      expect(responseData.expiring_soon_warnings_sent).toBeDefined();
      expect(responseData.expiring_soon_warnings_sent.member).toBe(1);
      expect(responseData.duration_ms).toBeDefined();
      expect(typeof responseData.duration_ms).toBe("number");
    });
  });
});

