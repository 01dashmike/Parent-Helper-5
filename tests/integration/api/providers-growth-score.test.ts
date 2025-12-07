/**
 * Integration tests for /api/providers/growth-score
 * Tests API contract and error handling
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GET } from "@/app/api/providers/growth-score/route";
import { createMockRequest, callRouteHandler } from "@/tests/api/testClient";

// Mock dependencies
jest.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: jest.fn(),
}));

jest.mock("@/lib/gamification/growth-score-pipeline", () => ({
  computeProviderGrowthScore: jest.fn(),
}));

jest.mock("@/lib/gamification/core", () => ({
  getWeekStart: jest.fn(() => {
    const date = new Date("2024-01-07"); // Sunday
    date.setHours(0, 0, 0, 0);
    return date;
  }),
}));

import { getSupabaseServer } from "@/lib/supabase.server";
import { computeProviderGrowthScore } from "@/lib/gamification/growth-score-pipeline";

const mockGetSupabaseServer = getSupabaseServer as jest.MockedFunction<typeof getSupabaseServer>;
const mockComputeProviderGrowthScore = computeProviderGrowthScore as jest.MockedFunction<typeof computeProviderGrowthScore>;

describe("/api/providers/growth-score - Integration Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockGetSupabaseServer.mockReturnValue(mockSupabase as any);
  });

  describe("Missing provider_id parameter", () => {
    it("should return 400 with error message when provider_id is missing", async () => {
      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: "provider_id is required" });
    });
  });

  describe("Server error - Supabase not available", () => {
    it("should return 500 when Supabase is not configured", async () => {
      mockGetSupabaseServer.mockReturnValue(null);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: "Server error" });
    });
  });

  describe("Cached growth score", () => {
    it("should return cached score when available", async () => {
      const mockCachedScore = {
        provider_id: 1,
        week_start: "2024-01-07",
        growth_score: 75,
        metrics_json: {
          views: 100,
          bookings: 10,
        },
        next_best_action: "Add more photos",
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        growthScore: 75,
        metrics: mockCachedScore.metrics_json,
        tier: "Silver", // 75 >= 60 && < 80
        multiplier: 1.15,
        nextBestAction: "Add more photos",
        weekStart: "2024-01-07",
      });
    });

    it("should return correct tier for Gold score", async () => {
      const mockCachedScore = {
        provider_id: 1,
        week_start: "2024-01-07",
        growth_score: 85,
        metrics_json: {},
        next_best_action: null,
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body.tier).toBe("Gold");
      expect(response.body.multiplier).toBe(1.30);
    });

    it("should return correct tier for Bronze score", async () => {
      const mockCachedScore = {
        provider_id: 1,
        week_start: "2024-01-07",
        growth_score: 45,
        metrics_json: {},
        next_best_action: null,
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body.tier).toBe("Bronze");
      expect(response.body.multiplier).toBe(1.05);
    });

    it("should return None tier for low score", async () => {
      const mockCachedScore = {
        provider_id: 1,
        week_start: "2024-01-07",
        growth_score: 30,
        metrics_json: {},
        next_best_action: null,
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCachedScore,
        error: null,
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body.tier).toBe("None");
      expect(response.body.multiplier).toBe(1.0);
    });
  });

  describe("Fresh growth score calculation", () => {
    it("should calculate and cache fresh score when no cache exists", async () => {
      const mockGrowthScoreResult = {
        growthScore: 80,
        metrics: {
          views: 150,
          bookings: 15,
          conversionRate: 10,
        },
        recommendations: ["Add more photos"],
        trend: [70, 75, 80],
      };

      // No cached score
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" }, // Not found error
      });

      mockComputeProviderGrowthScore.mockResolvedValueOnce(mockGrowthScoreResult);

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        growthScore: 80,
        metrics: mockGrowthScoreResult.metrics,
        recommendations: mockGrowthScoreResult.recommendations,
        trend: mockGrowthScoreResult.trend,
        weekStart: "2024-01-07",
      });

      expect(mockComputeProviderGrowthScore).toHaveBeenCalledWith(1, mockSupabase);
      expect(mockSupabase.upsert).toHaveBeenCalled();
    });

    it("should handle calculation errors gracefully", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockComputeProviderGrowthScore.mockRejectedValueOnce(new Error("Calculation failed"));

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=1",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: "Calculation failed",
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid provider_id gracefully", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockComputeProviderGrowthScore.mockResolvedValueOnce({
        growthScore: 0,
        metrics: {},
        recommendations: [],
        trend: [],
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=999",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(response.body.growthScore).toBeDefined();
    });

    it("should parse provider_id as integer", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockComputeProviderGrowthScore.mockResolvedValueOnce({
        growthScore: 50,
        metrics: {},
        recommendations: [],
        trend: [],
      });

      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/providers/growth-score?provider_id=123",
      });

      const response = await callRouteHandler(GET, request);

      expect(response.status).toBe(200);
      expect(mockComputeProviderGrowthScore).toHaveBeenCalledWith(123, mockSupabase);
    });
  });
});

