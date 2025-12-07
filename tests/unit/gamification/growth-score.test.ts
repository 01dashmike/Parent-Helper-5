/**
 * Unit tests for lib/gamification/growth-score.ts
 * Tests growth score calculation logic
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { calculateGrowthScore, type GrowthScoreResult } from "@/lib/gamification/growth-score";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("Growth Score Calculation", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("calculateGrowthScore - Minimum scenario", () => {
    it("should return low score for provider with no data", async () => {
      const mockProvider = {
        id: 1,
        name: "New Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null }) // provider
        .mockResolvedValueOnce({ data: [], error: null }) // classes
        .mockResolvedValueOnce({ data: [], error: null }) // sessions
        .mockResolvedValueOnce({ data: null, error: null }) // seo score
        .mockResolvedValueOnce({ data: [], error: null }) // booking requests
        .mockResolvedValueOnce({ count: 0, error: null }) // bookings count
        .mockResolvedValueOnce({ data: [], error: null }) // classes for reviews
        .mockResolvedValueOnce({ count: 0, error: null }) // class updates
        .mockResolvedValueOnce({ count: 0, error: null }) // xp events
        .mockResolvedValueOnce({ data: null, error: null }); // existing metrics

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThan(30); // Should be low
      expect(result.breakdown.listing_health).toBe(0);
      expect(result.breakdown.seo_score).toBe(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("calculateGrowthScore - Maximum scenario", () => {
    it("should return high score for provider with complete data", async () => {
      const mockProvider = {
        id: 1,
        name: "Complete Provider",
        description_raw: "A".repeat(200), // Long bio
        description_override: null,
        contact_email: "test@example.com",
        contact_phone: "1234567890",
        address_line1: "123 Test St",
        postcode: "SW1A 1AA",
        latitude: "51.5074",
        longitude: "-0.1278",
        website: "https://example.com",
        facebook_url: "https://facebook.com/test",
        instagram_url: "https://instagram.com/test",
        tiktok_url: "https://tiktok.com/test",
        youtube_url: "https://youtube.com/test",
        metadata: { logo_url: "https://example.com/logo.png" },
      };

      const mockClasses = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg,img3.jpg,img4.jpg",
          rating: "4.8",
          review_count: 25,
        },
        {
          id: 2,
          image_urls: "img1.jpg,img2.jpg,img3.jpg",
          rating: "4.9",
          review_count: 30,
        },
      ];

      const mockSessions = [{ class_id: 1 }, { class_id: 2 }];
      const mockSeoScore = { score: 95 };
      const mockBookingRequests = [
        {
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          responded_at: new Date().toISOString(),
        },
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          responded_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null })
        .mockResolvedValueOnce({ data: mockBookingRequests, error: null })
        .mockResolvedValueOnce({ count: 60, error: null }) // High bookings
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 10, error: null }) // Class updates
        .mockResolvedValueOnce({ count: 20, error: null }) // XP events
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.score).toBeGreaterThan(70);
      expect(result.breakdown.listing_health).toBeGreaterThan(80);
      expect(result.breakdown.seo_score).toBe(95);
      expect(result.breakdown.response_rate).toBeGreaterThan(80);
      expect(result.breakdown.bookings).toBeGreaterThan(80);
      expect(result.breakdown.reviews).toBeGreaterThan(80);
    });
  });

  describe("calculateGrowthScore - Mixed scenario", () => {
    it("should calculate score correctly for provider with some strengths and weaknesses", async () => {
      const mockProvider = {
        id: 1,
        name: "Mixed Provider",
        description_raw: "Short bio", // Short bio
        description_override: null,
        contact_email: "test@example.com",
        contact_phone: null, // Missing phone
        address_line1: "123 Test St",
        postcode: "SW1A 1AA",
        latitude: "51.5074",
        longitude: "-0.1278",
        website: null, // Missing website
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {}, // No logo
      };

      const mockClasses = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg", // Only 2 images (needs 3+)
          rating: "4.2",
          review_count: 8, // Below 10 threshold
        },
      ];

      const mockSessions = [{ class_id: 1 }];
      const mockSeoScore = { score: 65 }; // Below 80 threshold
      const mockBookingRequests = [
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          responded_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null })
        .mockResolvedValueOnce({ data: mockBookingRequests, error: null })
        .mockResolvedValueOnce({ count: 5, error: null }) // Low bookings
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 2, error: null })
        .mockResolvedValueOnce({ count: 3, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown.listing_health).toBeLessThan(70); // Incomplete profile
      expect(result.breakdown.seo_score).toBe(65);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("calculateGrowthScore - Listing Health", () => {
    it("should calculate listing health based on profile completeness", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: "A".repeat(150), // Good bio
        description_override: null,
        contact_email: "test@example.com",
        contact_phone: "1234567890",
        address_line1: "123 Test St",
        postcode: "SW1A 1AA",
        latitude: "51.5074",
        longitude: "-0.1278",
        website: "https://example.com",
        facebook_url: "https://facebook.com/test",
        instagram_url: "https://instagram.com/test",
        tiktok_url: null,
        youtube_url: null,
        metadata: { logo_url: "https://example.com/logo.png" },
      };

      const mockClasses = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg,img3.jpg,img4.jpg",
        },
      ];

      const mockSessions = [{ class_id: 1 }];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.listing_health).toBeGreaterThan(70);
      expect(result.breakdown.listing_health).toBeLessThanOrEqual(100);
    });
  });

  describe("calculateGrowthScore - Response Rate", () => {
    it("should calculate response rate score correctly", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      // Fast responses (under 2 hours)
      const mockBookingRequests = [
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          responded_at: new Date().toISOString(),
        },
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), // 1.5 hours ago
          responded_at: new Date().toISOString(),
        },
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          responded_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: mockBookingRequests, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.response_rate).toBeGreaterThan(80);
    });

    it("should return neutral score when no booking requests", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.response_rate).toBe(50); // Neutral score
    });
  });

  describe("calculateGrowthScore - Bookings Score", () => {
    it("should calculate bookings score based on volume", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 25, error: null }) // 25 bookings
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.bookings).toBeGreaterThan(50);
      expect(result.breakdown.bookings).toBeLessThanOrEqual(100);
    });

    it("should return 0 for no bookings", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.bookings).toBe(0);
    });
  });

  describe("calculateGrowthScore - Reviews Score", () => {
    it("should calculate reviews score based on count and rating", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      const mockClasses = [
        { id: 1, rating: "4.8", review_count: 30 },
        { id: 2, rating: "4.9", review_count: 25 },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.reviews).toBeGreaterThan(50);
      expect(result.breakdown.reviews).toBeLessThanOrEqual(100);
    });

    it("should return 0 for no reviews", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.breakdown.reviews).toBe(0);
    });
  });

  describe("calculateGrowthScore - Recommendations", () => {
    it("should generate recommendations based on low scores", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: { score: 50 }, error: null }) // Low SEO
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: { score: 50 }, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes("profile"))).toBe(true);
      expect(result.recommendations.some((r) => r.includes("SEO"))).toBe(true);
    });
  });

  describe("calculateGrowthScore - Trend tracking", () => {
    it("should maintain trend history", async () => {
      const mockProvider = {
        id: 1,
        name: "Test Provider",
        description_raw: null,
        description_override: null,
        contact_email: null,
        contact_phone: null,
        address_line1: null,
        postcode: null,
        latitude: null,
        longitude: null,
        website: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        youtube_url: null,
        metadata: {},
      };

      const existingTrend = [50, 55, 60, 65];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: { trend: existingTrend }, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { trend: existingTrend }, error: null });

      mockSupabase.update.mockResolvedValueOnce({ error: null });

      const result = await calculateGrowthScore(1);

      expect(result.trend.length).toBeGreaterThan(0);
      expect(result.trend.length).toBeLessThanOrEqual(12); // Max 12 scores
      expect(result.trend[result.trend.length - 1]).toBe(result.score);
    });
  });
});

