/**
 * Integration tests for /api/provider/xp/award
 * Tests API contract, authentication, and error handling
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { POST } from "@/app/api/provider/xp/award/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";

// Mock dependencies
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/gamification/xp", () => ({
  awardXp: jest.fn(),
}));

jest.mock("@/lib/gamification/badges", () => ({
  checkAndAwardBadges: jest.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockAwardXp = awardXp as jest.MockedFunction<typeof awardXp>;
const mockCheckAndAwardBadges = checkAndAwardBadges as jest.MockedFunction<typeof checkAndAwardBadges>;

describe("/api/provider/xp/award - Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("Unauthorized access", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "new_class_published",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: "Unauthorized" });
    });
  });

  describe("Missing required parameters", () => {
    it("should return 400 when providerId is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          eventType: "new_class_published",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "providerId and eventType are required",
      });
    });

    it("should return 400 when eventType is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: "providerId and eventType are required",
      });
    });
  });

  describe("Provider access denied", () => {
    it("should return 403 when user does not have access to provider", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "new_class_published",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: "Provider access denied",
      });
    });
  });

  describe("Successful XP award", () => {
    it("should award XP and check for badges successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockAccount = { provider_id: 1 };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });

      mockAwardXp.mockResolvedValueOnce({
        success: true,
        xpAwarded: 50,
        newLevel: "bronze",
        levelUp: false,
      });

      mockCheckAndAwardBadges.mockResolvedValueOnce([]);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "new_class_published",
          metadata: { classId: 123 },
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        xpAwarded: 50,
        levelUp: false,
        newLevel: "bronze",
        newBadges: [],
      });

      expect(mockAwardXp).toHaveBeenCalledWith(1, "new_class_published", { classId: 123 });
      expect(mockCheckAndAwardBadges).toHaveBeenCalledWith(1);
    });

    it("should return new badges when awarded", async () => {
      const mockUser = { id: "user-123" };
      const mockAccount = { provider_id: 1 };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });

      mockAwardXp.mockResolvedValueOnce({
        success: true,
        xpAwarded: 100,
        newLevel: "silver",
        levelUp: true,
      });

      mockCheckAndAwardBadges.mockResolvedValueOnce([
        "onboarding_complete",
        "seo_optimised",
      ]);

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "completed_onboarding",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        xpAwarded: 100,
        levelUp: true,
        newLevel: "silver",
        newBadges: ["onboarding_complete", "seo_optimised"],
      });
    });
  });

  describe("XP award failure", () => {
    it("should return 500 when XP award fails", async () => {
      const mockUser = { id: "user-123" };
      const mockAccount = { provider_id: 1 };

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockAccount,
        error: null,
      });

      mockAwardXp.mockResolvedValueOnce({
        success: false,
        xpAwarded: 0,
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "photo_uploaded",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: "Failed to award XP",
      });
    });
  });

  describe("Error handling", () => {
    it("should handle exceptions gracefully", async () => {
      mockSupabase.auth.getUser.mockRejectedValueOnce(new Error("Database error"));

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: {
          providerId: 1,
          eventType: "new_class_published",
        },
      });

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: "Internal server error",
      });
    });

    it("should handle JSON parsing errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/provider/xp/award",
        body: "invalid json",
      });

      // Override json method to throw error
      request.json = jest.fn().mockRejectedValueOnce(new Error("Invalid JSON"));

      const response = await callRouteHandler(POST, request);

      expect(response.status).toBe(500);
    });
  });

  describe("Event types", () => {
    it("should handle all valid event types", async () => {
      const mockUser = { id: "user-123" };
      const mockAccount = { provider_id: 1 };

      const eventTypes = [
        "new_class_published",
        "photo_uploaded",
        "review_received",
        "seo_fix_applied",
        "referral_sent",
        "calendar_updated",
        "weekly_activity",
        "completed_onboarding",
      ];

      for (const eventType of eventTypes) {
        jest.clearAllMocks();

        mockSupabase.auth.getUser.mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

        mockSupabase.select.mockResolvedValueOnce({
          data: mockAccount,
          error: null,
        });
        mockSupabase.single.mockResolvedValueOnce({
          data: mockAccount,
          error: null,
        });

        mockAwardXp.mockResolvedValueOnce({
          success: true,
          xpAwarded: 10,
          newLevel: "bronze",
          levelUp: false,
        });

        mockCheckAndAwardBadges.mockResolvedValueOnce([]);

        const request = createMockRequest({
          method: "POST",
          url: "http://localhost:3000/api/provider/xp/award",
          body: {
            providerId: 1,
            eventType,
          },
        });

        const response = await callRouteHandler(POST, request);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });
});

