/**
 * Behavioral "E2E-style" flow tests for provider growth journey
 * Simulates complete provider journey from onboarding to high growth score
 * Uses mocks to simulate database and API interactions
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  calculateGrowthScore,
  type GrowthScoreResult,
} from "@/lib/gamification/growth-score";
import { awardXp, getProviderLevel } from "@/lib/gamification/xp";
import { checkAndAwardBadges, getProviderBadges } from "@/lib/gamification/badges";

// Mock dependencies
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/supabase/type-helpers", () => ({
  castDb: jest.fn((data) => data),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("Provider Growth Journey - E2E Flow", () => {
  let mockSupabase: any;
  const providerId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("Phase 1: Provider Onboarding", () => {
    it("should have low growth score and no badges for new provider", async () => {
      // Minimal provider data
      const mockProvider = {
        id: providerId,
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

      // No classes, no reviews, no activity
      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null }) // provider
        .mockResolvedValueOnce({ data: [], error: null }) // classes
        .mockResolvedValueOnce({ data: [], error: null }) // sessions
        .mockResolvedValueOnce({ data: null, error: null }) // seo score
        .mockResolvedValueOnce({ data: [], error: null }) // booking requests
        .mockResolvedValueOnce({ count: 0, error: null }) // bookings
        .mockResolvedValueOnce({ data: [], error: null }) // classes for reviews
        .mockResolvedValueOnce({ count: 0, error: null }) // class updates
        .mockResolvedValueOnce({ count: 0, error: null }) // xp events
        .mockResolvedValueOnce({ data: null, error: null }); // existing metrics

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const growthScore = await calculateGrowthScore(providerId);

      // Should have low score
      expect(growthScore.score).toBeLessThan(30);
      expect(growthScore.breakdown.listing_health).toBe(0);
      expect(growthScore.breakdown.bookings).toBe(0);
      expect(growthScore.breakdown.reviews).toBe(0);

      // Check badges
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      const badges = await getProviderBadges(providerId);

      expect(badges).toHaveLength(0);
    });
  });

  describe("Phase 2: Content Improvement", () => {
    it("should increase growth score after adding profile content", async () => {
      // Improved provider data
      const mockProvider = {
        id: providerId,
        name: "Improved Provider",
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
        tiktok_url: null,
        youtube_url: null,
        metadata: { logo_url: "https://example.com/logo.png" },
      };

      // One class with photos
      const mockClasses = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg,img3.jpg,img4.jpg",
          rating: "4.0",
          review_count: 2,
        },
      ];

      const mockSessions = [{ class_id: 1 }];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: { score: 70 }, error: null }) // Improved SEO
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 1, error: null }) // Class updated
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: { score: 70 }, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const growthScore = await calculateGrowthScore(providerId);

      // Score should be higher than Phase 1
      expect(growthScore.score).toBeGreaterThan(30);
      expect(growthScore.breakdown.listing_health).toBeGreaterThan(50);
      expect(growthScore.breakdown.seo_score).toBe(70);
    });

    it("should award XP and check badges after content improvements", async () => {
      // Mock XP award for photo upload
      mockSupabase.insert.mockResolvedValueOnce({ error: null }); // XP event
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: null }); // Level lookup
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null }); // Level insert

      const xpResult = await awardXp(providerId, "photo_uploaded", { photoCount: 4 });

      expect(xpResult.success).toBe(true);
      expect(xpResult.xpAwarded).toBe(10);

      // Check level
      mockSupabase.select.mockResolvedValueOnce({
        data: { provider_id: providerId, xp_total: 10, level: "bronze" },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { provider_id: providerId, xp_total: 10, level: "bronze" },
        error: null,
      });

      const level = await getProviderLevel(providerId);
      expect(level.xpTotal).toBe(10);
      expect(level.level).toBe("bronze");
    });
  });

  describe("Phase 3: Engagement and Growth", () => {
    it("should show increased growth score after bookings and reviews", async () => {
      // Well-established provider
      const mockProvider = {
        id: providerId,
        name: "Established Provider",
        description_raw: "A".repeat(300),
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
          review_count: 20,
        },
        {
          id: 2,
          image_urls: "img1.jpg,img2.jpg,img3.jpg",
          rating: "4.9",
          review_count: 15,
        },
      ];

      const mockSessions = [{ class_id: 1 }, { class_id: 2 }];
      const mockSeoScore = { score: 90 };
      const mockBookingRequests = [
        {
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          responded_at: new Date().toISOString(),
        },
        {
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          responded_at: new Date().toISOString(),
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockSessions, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null })
        .mockResolvedValueOnce({ data: mockBookingRequests, error: null })
        .mockResolvedValueOnce({ count: 25, error: null }) // Good bookings
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 5, error: null }) // Recent updates
        .mockResolvedValueOnce({ count: 10, error: null }) // XP events
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const growthScore = await calculateGrowthScore(providerId);

      // Should have high score
      expect(growthScore.score).toBeGreaterThan(70);
      expect(growthScore.breakdown.listing_health).toBeGreaterThan(80);
      expect(growthScore.breakdown.seo_score).toBe(90);
      expect(growthScore.breakdown.bookings).toBeGreaterThan(50);
      expect(growthScore.breakdown.reviews).toBeGreaterThan(50);
      expect(growthScore.breakdown.response_rate).toBeGreaterThan(80);
    });

    it("should award badges after meeting criteria", async () => {
      // Mock provider with complete onboarding
      const mockProvider = {
        id: providerId,
        name: "Complete Provider",
      };

      const mockClasses = [
        { id: 1, rating: "4.8", review_count: 12 },
      ];

      const mockOnboarding = { provider_id: providerId, is_complete: true };
      const mockSeoScore = { score: 85 };

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: mockOnboarding, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockOnboarding, error: null })
        .mockResolvedValueOnce({ data: mockSeoScore, error: null });

      // Mock badge save
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const badges = await checkAndAwardBadges(providerId);

      // Should award onboarding_complete and seo_optimised
      expect(badges.length).toBeGreaterThan(0);
      expect(badges).toContain("onboarding_complete");
      expect(badges).toContain("seo_optimised");
    });

    it("should track XP progression through multiple events", async () => {
      const events = [
        { type: "completed_onboarding" as const, expectedXp: 100 },
        { type: "new_class_published" as const, expectedXp: 50 },
        { type: "photo_uploaded" as const, expectedXp: 10 },
        { type: "review_received" as const, expectedXp: 40 },
      ];

      let totalXp = 0;

      for (const event of events) {
        jest.clearAllMocks();

        // Mock XP event recording
        mockSupabase.insert.mockResolvedValueOnce({ error: null });

        // Mock level lookup
        const currentLevel = totalXp < 200 ? "bronze" : totalXp < 700 ? "silver" : "gold";
        mockSupabase.select.mockResolvedValueOnce({
          data: { provider_id: providerId, xp_total: totalXp, level: currentLevel },
          error: null,
        });
        mockSupabase.single.mockResolvedValueOnce({
          data: { provider_id: providerId, xp_total: totalXp, level: currentLevel },
          error: null,
        });

        // Mock level update
        mockSupabase.update.mockResolvedValueOnce({ error: null });

        const result = await awardXp(providerId, event.type);

        expect(result.success).toBe(true);
        expect(result.xpAwarded).toBe(event.expectedXp);

        totalXp += event.expectedXp;

        // Check level progression
        if (totalXp >= 200 && totalXp < 700) {
          expect(result.newLevel).toBe("silver");
        } else if (totalXp >= 700) {
          expect(result.newLevel).toBe("gold");
        }
      }

      // Final level check
      mockSupabase.select.mockResolvedValueOnce({
        data: { provider_id: providerId, xp_total: totalXp, level: "silver" },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { provider_id: providerId, xp_total: totalXp, level: "silver" },
        error: null,
      });

      const finalLevel = await getProviderLevel(providerId);
      expect(finalLevel.xpTotal).toBe(200); // 100 + 50 + 10 + 40
      expect(finalLevel.level).toBe("silver");
    });
  });

  describe("Complete Journey Flow", () => {
    it("should simulate full provider journey from onboarding to high growth", async () => {
      // Step 1: Initial state (low score)
      let mockProvider = {
        id: providerId,
        name: "New Provider",
        description_raw: null,
        contact_email: null,
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

      const initialScore = await calculateGrowthScore(providerId);
      expect(initialScore.score).toBeLessThan(20);

      // Step 2: Complete onboarding
      jest.clearAllMocks();
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const onboardingXp = await awardXp(providerId, "completed_onboarding");
      expect(onboardingXp.success).toBe(true);
      expect(onboardingXp.xpAwarded).toBe(100);

      // Step 3: Add content
      jest.clearAllMocks();
      mockProvider = {
        ...mockProvider,
        description_raw: "A".repeat(200),
        contact_email: "test@example.com",
        contact_phone: "1234567890",
        metadata: { logo_url: "https://example.com/logo.png" },
      };

      const mockClasses = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg,img3.jpg",
          rating: "4.5",
          review_count: 5,
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ data: [{ class_id: 1 }], error: null })
        .mockResolvedValueOnce({ data: { score: 75 }, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 3, error: null })
        .mockResolvedValueOnce({ data: mockClasses, error: null })
        .mockResolvedValueOnce({ count: 2, error: null })
        .mockResolvedValueOnce({ count: 5, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: { score: 75 }, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const improvedScore = await calculateGrowthScore(providerId);
      expect(improvedScore.score).toBeGreaterThan(initialScore.score);
      expect(improvedScore.score).toBeGreaterThan(40);

      // Step 4: Get bookings and reviews
      jest.clearAllMocks();
      const mockClassesWithReviews = [
        {
          id: 1,
          image_urls: "img1.jpg,img2.jpg,img3.jpg,img4.jpg",
          rating: "4.8",
          review_count: 15,
        },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: mockClassesWithReviews, error: null })
        .mockResolvedValueOnce({ data: [{ class_id: 1 }], error: null })
        .mockResolvedValueOnce({ data: { score: 85 }, error: null })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ count: 12, error: null })
        .mockResolvedValueOnce({ data: mockClassesWithReviews, error: null })
        .mockResolvedValueOnce({ count: 3, error: null })
        .mockResolvedValueOnce({ count: 8, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProvider, error: null })
        .mockResolvedValueOnce({ data: { score: 85 }, error: null });

      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const finalScore = await calculateGrowthScore(providerId);
      expect(finalScore.score).toBeGreaterThan(improvedScore.score);
      expect(finalScore.score).toBeGreaterThan(60);

      // Verify progression
      expect(finalScore.score).toBeGreaterThan(initialScore.score);
      expect(finalScore.breakdown.listing_health).toBeGreaterThan(
        initialScore.breakdown.listing_health
      );
      expect(finalScore.breakdown.reviews).toBeGreaterThan(initialScore.breakdown.reviews);
    });
  });
});

