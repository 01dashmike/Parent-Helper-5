/**
 * Unit tests for lib/provider-analytics/helpers.ts
 * Tests growth-related analytics helper functions
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getProviderViews,
  getProviderBookings,
  getProviderConversionRate,
  getProviderRecentReviews,
  getProviderAnalyticsMetrics,
  getThirtyDaysAgo,
} from "@/lib/provider-analytics/helpers";

// Mock Supabase client
jest.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: jest.fn(),
}));

jest.mock("@/lib/gamification/core", () => ({
  getDaysAgo: jest.fn((days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }),
}));

import { getSupabaseServer } from "@/lib/supabase.server";

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;

describe("Provider Analytics Helpers", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };
    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);
  });

  describe("getThirtyDaysAgo", () => {
    it("should return date 30 days ago", () => {
      const result = getThirtyDaysAgo();
      const expected = new Date();
      expected.setDate(expected.getDate() - 30);
      expected.setHours(0, 0, 0, 0);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within 1 second
    });
  });

  describe("getProviderViews", () => {
    it("should return 0 when provider has no classes", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });

      const result = await getProviderViews(mockSupabase, 1);

      expect(result).toBe(0);
    });

    it("should return 0 when supabase is null", async () => {
      mockGetSupabaseServer.mockReturnValue(null);

      const result = await getProviderViews(null, 1);

      expect(result).toBe(0);
    });

    it("should count unique class views correctly", async () => {
      const mockClasses = [{ id: 1 }, { id: 2 }];
      const mockViewEvents = [
        {
          payload: { classId: 1, sessionId: "session1" },
          created_at: new Date().toISOString(),
        },
        {
          payload: { classId: 1, sessionId: "session2" },
          created_at: new Date().toISOString(),
        },
        {
          payload: { classId: 2, sessionId: "session1" },
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockViewEvents, error: null });

      const result = await getProviderViews(mockSupabase, 1);

      expect(result).toBe(3); // 3 unique views
    });

    it("should not double-count same class in same session", async () => {
      const mockClasses = [{ id: 1 }];
      const mockViewEvents = [
        {
          payload: { classId: 1, sessionId: "session1" },
          created_at: new Date().toISOString(),
        },
        {
          payload: { classId: 1, sessionId: "session1" }, // Same session, same class
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockViewEvents, error: null });

      const result = await getProviderViews(mockSupabase, 1);

      expect(result).toBe(1); // Should count as 1 unique view
    });

    it("should handle events without sessionId", async () => {
      const mockClasses = [{ id: 1 }];
      const mockViewEvents = [
        {
          payload: { classId: 1 },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          payload: { classId: 1 },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockViewEvents, error: null });

      const result = await getProviderViews(mockSupabase, 1);

      expect(result).toBe(2); // Should count as separate views
    });

    it("should filter by provider's classes only", async () => {
      const mockClasses = [{ id: 1 }];
      const mockViewEvents = [
        {
          payload: { classId: 1, sessionId: "session1" }, // Provider's class
          created_at: new Date().toISOString(),
        },
        {
          payload: { classId: 999, sessionId: "session2" }, // Other provider's class
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockViewEvents, error: null });

      const result = await getProviderViews(mockSupabase, 1);

      expect(result).toBe(1); // Only count provider's class
    });
  });

  describe("getProviderBookings", () => {
    it("should return 0 when provider has no classes", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });

      const result = await getProviderBookings(mockSupabase, 1);

      expect(result).toBe(0);
    });

    it("should return 0 when supabase is null", async () => {
      const result = await getProviderBookings(null, 1);

      expect(result).toBe(0);
    });

    it("should count confirmed bookings only", async () => {
      const mockClasses = [{ id: 1 }, { id: 2 }];
      const mockBookings = [
        { id: 1, class_id: 1, status: "confirmed", email: "test@example.com" },
        { id: 2, class_id: 2, status: "confirmed", email: "test2@example.com" },
        { id: 3, class_id: 1, status: "pending", email: "test3@example.com" },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockBookings, error: null });

      const result = await getProviderBookings(mockSupabase, 1);

      expect(result).toBe(2); // Only confirmed bookings
    });

    it("should exclude test bookings (email contains @example.com)", async () => {
      const mockClasses = [{ id: 1 }];
      const mockBookings = [
        { id: 1, class_id: 1, status: "confirmed", email: "real@test.com" },
        { id: 2, class_id: 1, status: "confirmed", email: "test@example.com" },
        { id: 3, class_id: 1, status: "confirmed", email: "TEST@EXAMPLE.COM" }, // Case insensitive
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockBookings, error: null });

      const result = await getProviderBookings(mockSupabase, 1);

      expect(result).toBe(1); // Only real booking
    });

    it("should handle bookings without email", async () => {
      const mockClasses = [{ id: 1 }];
      const mockBookings = [
        { id: 1, class_id: 1, status: "confirmed", email: null },
        { id: 2, class_id: 1, status: "confirmed", email: "test@example.com" },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockBookings, error: null });

      const result = await getProviderBookings(mockSupabase, 1);

      expect(result).toBe(1); // Only booking with null email (not test)
    });
  });

  describe("getProviderConversionRate", () => {
    it("should return 0 when there are no views", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(0);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(5);

      const result = await getProviderConversionRate(mockSupabase, 1);

      expect(result).toBe(0);
    });

    it("should calculate conversion rate correctly", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(100);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(10);

      const result = await getProviderConversionRate(mockSupabase, 1);

      expect(result).toBe(10); // 10%
    });

    it("should round to 2 decimal places", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(33);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(1);

      const result = await getProviderConversionRate(mockSupabase, 1);

      expect(result).toBe(3.03); // 1/33 * 100 = 3.0303... rounded to 3.03
    });

    it("should handle 100% conversion rate", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(10);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(10);

      const result = await getProviderConversionRate(mockSupabase, 1);

      expect(result).toBe(100);
    });
  });

  describe("getProviderRecentReviews", () => {
    it("should return 0 when supabase is null", async () => {
      const result = await getProviderRecentReviews(null, 1);

      expect(result).toBe(0);
    });

    it("should count approved reviews in last 30 days", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: 5, error: null });

      const result = await getProviderRecentReviews(mockSupabase, 1);

      expect(result).toBe(5);
      expect(mockSupabase.eq).toHaveBeenCalledWith("provider_id", 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "approved");
    });

    it("should return 0 when count is null", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: null, error: null });

      const result = await getProviderRecentReviews(mockSupabase, 1);

      expect(result).toBe(0);
    });

    it("should filter by 30-day window", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: 3, error: null });

      await getProviderRecentReviews(mockSupabase, 1);

      expect(mockSupabase.gte).toHaveBeenCalled();
      const gteCall = (mockSupabase.gte as jest.Mock).mock.calls.find((call) => call[0] === "created_at");
      expect(gteCall).toBeDefined();
    });
  });

  describe("getProviderAnalyticsMetrics", () => {
    it("should return all metrics correctly", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(100);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(10);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderConversionRate").mockResolvedValue(10);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderRecentReviews").mockResolvedValue(5);

      const result = await getProviderAnalyticsMetrics(mockSupabase, 1);

      expect(result.views).toBe(100);
      expect(result.bookings).toBe(10);
      expect(result.conversionRate).toBe(10);
      expect(result.recentReviews).toBe(5);
    });

    it("should call all helper functions in parallel", async () => {
      const viewsSpy = jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(100);
      const bookingsSpy = jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(10);
      const conversionSpy = jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderConversionRate").mockResolvedValue(10);
      const reviewsSpy = jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderRecentReviews").mockResolvedValue(5);

      await getProviderAnalyticsMetrics(mockSupabase, 1);

      // All should be called
      expect(viewsSpy).toHaveBeenCalled();
      expect(bookingsSpy).toHaveBeenCalled();
      expect(conversionSpy).toHaveBeenCalled();
      expect(reviewsSpy).toHaveBeenCalled();
    });

    it("should handle zero metrics", async () => {
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderViews").mockResolvedValue(0);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderBookings").mockResolvedValue(0);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderConversionRate").mockResolvedValue(0);
      jest.spyOn(require("@/lib/provider-analytics/helpers"), "getProviderRecentReviews").mockResolvedValue(0);

      const result = await getProviderAnalyticsMetrics(mockSupabase, 1);

      expect(result.views).toBe(0);
      expect(result.bookings).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.recentReviews).toBe(0);
    });
  });
});

