/**
 * Unit tests for lib/gamification/badges.ts
 * Tests badge creation, awarding, and checking logic
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  saveProviderBadges,
  awardBadge,
  getProviderBadges,
  checkAndAwardBadges,
  BADGE_DEFINITIONS,
  type BadgeType,
} from "@/lib/gamification/badges";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/supabase/type-helpers", () => ({
  castDb: jest.fn((data) => data),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("Badge System", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("saveProviderBadges", () => {
    it("should save new badges successfully", async () => {
      // Mock: no existing badges
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      // Mock: successful insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await saveProviderBadges(1, [
        { type: "onboarding_complete" },
        { type: "seo_optimised", metadata: { score: 85 } },
      ]);

      expect(result.success).toBe(true);
      expect(result.awarded).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          provider_id: 1,
          badge_type: "onboarding_complete",
          metadata: {},
        },
        {
          provider_id: 1,
          badge_type: "seo_optimised",
          metadata: { score: 85 },
        },
      ]);
    });

    it("should skip badges that already exist", async () => {
      // Mock: one badge already exists
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ badge_type: "onboarding_complete" }],
        error: null,
      });
      // Mock: successful insert for new badge only
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await saveProviderBadges(1, [
        { type: "onboarding_complete" },
        { type: "seo_optimised" },
      ]);

      expect(result.success).toBe(true);
      expect(result.awarded).toContain("seo_optimised");
      expect(result.skipped).toContain("onboarding_complete");
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          provider_id: 1,
          badge_type: "seo_optimised",
          metadata: {},
        },
      ]);
    });

    it("should return success false on database error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.insert.mockResolvedValueOnce({
        error: { message: "Database error" },
      });

      const result = await saveProviderBadges(1, [{ type: "onboarding_complete" }]);

      expect(result.success).toBe(false);
      expect(result.awarded).toHaveLength(0);
    });

    it("should handle all badges already existing", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { badge_type: "onboarding_complete" },
          { badge_type: "seo_optimised" },
        ],
        error: null,
      });

      const result = await saveProviderBadges(1, [
        { type: "onboarding_complete" },
        { type: "seo_optimised" },
      ]);

      expect(result.success).toBe(true);
      expect(result.awarded).toHaveLength(0);
      expect(result.skipped).toHaveLength(2);
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("should handle empty badges array", async () => {
      const result = await saveProviderBadges(1, []);

      expect(result.success).toBe(true);
      expect(result.awarded).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
    });
  });

  describe("awardBadge", () => {
    it("should award a new badge successfully", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await awardBadge(1, "onboarding_complete", { step: 5 });

      expect(result.success).toBe(true);
      expect(result.alreadyEarned).toBe(false);
    });

    it("should detect already earned badge", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ badge_type: "onboarding_complete" }],
        error: null,
      });

      const result = await awardBadge(1, "onboarding_complete");

      expect(result.success).toBe(true);
      expect(result.alreadyEarned).toBe(true);
    });
  });

  describe("getProviderBadges", () => {
    it("should return badges with definitions", async () => {
      const mockBadges = [
        {
          badge_type: "onboarding_complete",
          provider_id: 1,
          earned_at: "2024-01-01T00:00:00Z",
          metadata: {},
        },
        {
          badge_type: "top_rated",
          provider_id: 1,
          earned_at: "2024-01-02T00:00:00Z",
          metadata: { count: 15, avgRating: 4.8 },
        },
      ];

      mockSupabase.select.mockResolvedValueOnce({ data: mockBadges, error: null });

      const result = await getProviderBadges(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        ...BADGE_DEFINITIONS.onboarding_complete,
        badge_type: "onboarding_complete",
      });
      expect(result[1]).toMatchObject({
        ...BADGE_DEFINITIONS.top_rated,
        badge_type: "top_rated",
      });
    });

    it("should return empty array on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getProviderBadges(1);

      expect(result).toEqual([]);
    });

    it("should return empty array when no badges exist", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });

      const result = await getProviderBadges(1);

      expect(result).toEqual([]);
    });
  });

  describe("checkAndAwardBadges", () => {
    it("should return empty array when provider not found", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await checkAndAwardBadges(999);

      expect(result).toEqual([]);
    });

    it("should award onboarding_complete badge when onboarding is complete", async () => {
      const mockProvider = { id: 1, name: "Test Provider" };
      const mockOnboarding = { provider_id: 1, is_complete: true };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null }) // provider
        .mockResolvedValueOnce({ data: [], error: null }) // classes
        .mockResolvedValueOnce({ data: mockOnboarding, error: null }) // onboarding
        .mockResolvedValueOnce({ data: null, error: null }) // seo score
        .mockResolvedValueOnce({ data: [], error: null }) // booking requests
        .mockResolvedValueOnce({ data: [], error: null }); // weekly activities

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockOnboarding, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      // Mock badge save
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // existing badges check
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await checkAndAwardBadges(1);

      expect(result).toContain("onboarding_complete");
    });

    it("should award seo_optimised badge when SEO score >= 80", async () => {
      const mockProvider = { id: 1, name: "Test Provider" };
      const mockSeoScore = { score: 85 };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // classes
        .mockResolvedValueOnce({ data: null, error: null }) // onboarding
        .mockResolvedValueOnce({ data: mockSeoScore, error: null }) // seo score
        .mockResolvedValueOnce({ data: [], error: null }) // booking requests
        .mockResolvedValueOnce({ data: [], error: null }); // weekly activities

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null });

      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await checkAndAwardBadges(1);

      expect(result).toContain("seo_optimised");
    });

    it("should award top_rated badge when review metrics meet criteria", async () => {
      const mockProvider = { id: 1, name: "Test Provider" };
      const mockClasses = [
        { id: 1, rating: "4.5", review_count: 5, provider_id: 1 },
        { id: 2, rating: "4.8", review_count: 5, provider_id: 1 },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: null, error: null }) // onboarding
        .mockResolvedValueOnce({ data: null, error: null }) // seo score
        .mockResolvedValueOnce({ data: [], error: null }) // booking requests
        .mockResolvedValueOnce({ data: [], error: null }); // weekly activities

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await checkAndAwardBadges(1);

      expect(result).toContain("top_rated");
    });

    it("should handle errors gracefully", async () => {
      mockSupabase.select.mockRejectedValueOnce(new Error("Database error"));

      const result = await checkAndAwardBadges(1);

      expect(result).toEqual([]);
    });
  });

  describe("BADGE_DEFINITIONS", () => {
    it("should have definitions for all badge types", () => {
      const badgeTypes: BadgeType[] = [
        "onboarding_complete",
        "seo_optimised",
        "top_rated",
        "fast_responder",
        "consistency_star",
      ];

      badgeTypes.forEach((type) => {
        expect(BADGE_DEFINITIONS[type]).toBeDefined();
        expect(BADGE_DEFINITIONS[type].name).toBeTruthy();
        expect(BADGE_DEFINITIONS[type].description).toBeTruthy();
        expect(BADGE_DEFINITIONS[type].icon).toBeTruthy();
      });
    });
  });
});

