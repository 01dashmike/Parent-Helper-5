/**
 * Unit tests for lib/gamification/xp.ts
 * Tests XP event recording, level calculation, and awarding
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  recordXpEvent,
  awardXp,
  getProviderLevel,
  getRecentXpEvents,
  calculateLevel,
  getXpForNextLevel,
  XP_WEIGHTS,
  LEVEL_THRESHOLDS,
  type XpEventType,
} from "@/lib/gamification/xp";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/supabase/type-helpers", () => ({
  castDb: jest.fn((data) => data),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("XP System", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("calculateLevel", () => {
    it("should return bronze for 0-199 XP", () => {
      expect(calculateLevel(0)).toBe("bronze");
      expect(calculateLevel(100)).toBe("bronze");
      expect(calculateLevel(199)).toBe("bronze");
    });

    it("should return silver for 200-699 XP", () => {
      expect(calculateLevel(200)).toBe("silver");
      expect(calculateLevel(450)).toBe("silver");
      expect(calculateLevel(699)).toBe("silver");
    });

    it("should return gold for 700-1499 XP", () => {
      expect(calculateLevel(700)).toBe("gold");
      expect(calculateLevel(1000)).toBe("gold");
      expect(calculateLevel(1499)).toBe("gold");
    });

    it("should return platinum for 1500+ XP", () => {
      expect(calculateLevel(1500)).toBe("platinum");
      expect(calculateLevel(2000)).toBe("platinum");
      expect(calculateLevel(5000)).toBe("platinum");
    });
  });

  describe("getXpForNextLevel", () => {
    it("should return correct XP needed for next level from bronze", () => {
      expect(getXpForNextLevel(0)).toBe(200);
      expect(getXpForNextLevel(100)).toBe(100);
      expect(getXpForNextLevel(199)).toBe(1);
    });

    it("should return correct XP needed for next level from silver", () => {
      expect(getXpForNextLevel(200)).toBe(500);
      expect(getXpForNextLevel(450)).toBe(250);
      expect(getXpForNextLevel(699)).toBe(1);
    });

    it("should return correct XP needed for next level from gold", () => {
      expect(getXpForNextLevel(700)).toBe(800);
      expect(getXpForNextLevel(1000)).toBe(500);
      expect(getXpForNextLevel(1499)).toBe(1);
    });

    it("should return Infinity for platinum (max level)", () => {
      expect(getXpForNextLevel(1500)).toBe(Infinity);
      expect(getXpForNextLevel(2000)).toBe(Infinity);
    });
  });

  describe("recordXpEvent", () => {
    it("should record XP event successfully", async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await recordXpEvent({
        providerId: 1,
        eventType: "new_class_published",
        points: 50,
        metadata: { classId: 123 },
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          provider_id: 1,
          event_type: "new_class_published",
          points: 50,
          metadata: { classId: 123 },
        },
      ]);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.insert.mockResolvedValueOnce({
        error: { message: "Database error" },
      });

      const result = await recordXpEvent({
        providerId: 1,
        eventType: "photo_uploaded",
        points: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle exceptions gracefully", async () => {
      mockSupabase.insert.mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await recordXpEvent({
        providerId: 1,
        eventType: "review_received",
        points: 40,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should use default empty metadata when not provided", async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      await recordXpEvent({
        providerId: 1,
        eventType: "calendar_updated",
        points: 5,
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          provider_id: 1,
          event_type: "calendar_updated",
          points: 5,
          metadata: {},
        },
      ]);
    });
  });

  describe("awardXp", () => {
    it("should award XP and update level successfully", async () => {
      // Mock XP event recording
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      // Mock level lookup (no existing level)
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
      // Mock level insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await awardXp(1, "new_class_published", { classId: 123 });

      expect(result.success).toBe(true);
      expect(result.xpAwarded).toBe(XP_WEIGHTS.new_class_published);
      expect(result.newLevel).toBe("bronze");
      expect(result.levelUp).toBe(false);
    });

    it("should detect level up from bronze to silver", async () => {
      const existingLevel = {
        provider_id: 1,
        xp_total: 195,
        level: "bronze",
      };

      // Mock XP event recording
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      // Mock level lookup
      mockSupabase.select.mockResolvedValueOnce({ data: existingLevel, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: existingLevel, error: null });
      // Mock level update
      mockSupabase.update.mockResolvedValueOnce({ error: null });

      const result = await awardXp(1, "new_class_published"); // 50 XP

      expect(result.success).toBe(true);
      expect(result.xpAwarded).toBe(50);
      expect(result.newLevel).toBe("silver");
      expect(result.levelUp).toBe(true);
    });

    it("should handle unknown event type (0 points)", async () => {
      const result = await awardXp(1, "unknown_event" as XpEventType);

      expect(result.success).toBe(false);
      expect(result.xpAwarded).toBe(0);
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("should handle database error during XP event recording", async () => {
      mockSupabase.insert.mockResolvedValueOnce({
        error: { message: "Database error" },
      });

      const result = await awardXp(1, "photo_uploaded");

      expect(result.success).toBe(false);
      expect(result.xpAwarded).toBe(0);
    });

    it("should handle database error during level update", async () => {
      const existingLevel = {
        provider_id: 1,
        xp_total: 100,
        level: "bronze",
      };

      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: existingLevel, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: existingLevel, error: null });
      mockSupabase.update.mockResolvedValueOnce({
        error: { message: "Update error" },
      });

      const result = await awardXp(1, "photo_uploaded");

      expect(result.success).toBe(false);
      expect(result.xpAwarded).toBe(0);
    });

    it("should award correct XP for each event type", async () => {
      const eventTypes: XpEventType[] = [
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
        mockSupabase.insert.mockResolvedValueOnce({ error: null });
        mockSupabase.select.mockResolvedValueOnce({ data: null, error: null });
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
        mockSupabase.insert.mockResolvedValueOnce({ error: null });

        const result = await awardXp(1, eventType);

        expect(result.success).toBe(true);
        expect(result.xpAwarded).toBe(XP_WEIGHTS[eventType]);
      }
    });
  });

  describe("getProviderLevel", () => {
    it("should return level data when provider has level", async () => {
      const mockLevel = {
        provider_id: 1,
        xp_total: 500,
        level: "silver",
      };

      mockSupabase.select.mockResolvedValueOnce({ data: mockLevel, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockLevel, error: null });

      const result = await getProviderLevel(1);

      expect(result.xpTotal).toBe(500);
      expect(result.level).toBe("silver");
      expect(result.xpForNextLevel).toBe(200); // 700 - 500
    });

    it("should return default bronze level when provider has no level", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      const result = await getProviderLevel(1);

      expect(result.xpTotal).toBe(0);
      expect(result.level).toBe("bronze");
      expect(result.xpForNextLevel).toBe(200);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Error" } });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getProviderLevel(1);

      expect(result.xpTotal).toBe(0);
      expect(result.level).toBe("bronze");
      expect(result.xpForNextLevel).toBe(200);
    });
  });

  describe("getRecentXpEvents", () => {
    it("should return recent XP events", async () => {
      const mockEvents = [
        {
          id: 1,
          provider_id: 1,
          event_type: "new_class_published",
          points: 50,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          provider_id: 1,
          event_type: "photo_uploaded",
          points: 10,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockSupabase.select.mockResolvedValueOnce({ data: mockEvents, error: null });

      const result = await getRecentXpEvents(1, 10);

      expect(result).toHaveLength(2);
      expect(result[0].event_type).toBe("new_class_published");
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it("should use default limit of 10 when not specified", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });

      await getRecentXpEvents(1);

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it("should return empty array on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getRecentXpEvents(1);

      expect(result).toEqual([]);
    });

    it("should return empty array when no events exist", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });

      const result = await getRecentXpEvents(1);

      expect(result).toEqual([]);
    });
  });

  describe("XP_WEIGHTS", () => {
    it("should have weights for all event types", () => {
      const eventTypes: XpEventType[] = [
        "new_class_published",
        "photo_uploaded",
        "review_received",
        "seo_fix_applied",
        "referral_sent",
        "calendar_updated",
        "weekly_activity",
        "completed_onboarding",
      ];

      eventTypes.forEach((type) => {
        expect(XP_WEIGHTS[type]).toBeDefined();
        expect(XP_WEIGHTS[type]).toBeGreaterThan(0);
      });
    });

    it("should have onboarding as highest weight", () => {
      expect(XP_WEIGHTS.completed_onboarding).toBe(100);
      expect(XP_WEIGHTS.completed_onboarding).toBeGreaterThan(XP_WEIGHTS.new_class_published);
    });
  });

  describe("LEVEL_THRESHOLDS", () => {
    it("should have correct threshold ranges", () => {
      expect(LEVEL_THRESHOLDS.bronze.min).toBe(0);
      expect(LEVEL_THRESHOLDS.bronze.max).toBe(199);
      expect(LEVEL_THRESHOLDS.silver.min).toBe(200);
      expect(LEVEL_THRESHOLDS.silver.max).toBe(699);
      expect(LEVEL_THRESHOLDS.gold.min).toBe(700);
      expect(LEVEL_THRESHOLDS.gold.max).toBe(1499);
      expect(LEVEL_THRESHOLDS.platinum.min).toBe(1500);
      expect(LEVEL_THRESHOLDS.platinum.max).toBe(Infinity);
    });
  });
});

