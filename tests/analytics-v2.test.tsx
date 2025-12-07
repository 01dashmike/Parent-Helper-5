/**
 * Tests for Provider Analytics v2
 */

import { describe, it, expect } from "vitest";
import { calculateGrowthScore, getGrowthScoreLabel } from "@/lib/analytics/providerGrowthScore";
import { getFallbackRecommendations } from "@/lib/analytics/aiRecommendations";

describe("Provider Growth Score", () => {
  it("calculates score correctly", () => {
    const factors = {
      bookings: 30,
      revenue: 3000,
      reviews: 15,
      averageRating: 4.5,
      listings: 5,
      responseTime: 2,
      conversionRate: 20,
      repeatBookings: 10,
    };
    
    const score = calculateGrowthScore(factors);
    
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.nextBestActions).toHaveLength(3);
  });

  it("returns correct label for score ranges", () => {
    expect(getGrowthScoreLabel(85).label).toBe("Excellent");
    expect(getGrowthScoreLabel(65).label).toBe("Good");
    expect(getGrowthScoreLabel(45).label).toBe("Average");
    expect(getGrowthScoreLabel(30).label).toBe("Needs Improvement");
  });
});

describe("AI Recommendations", () => {
  it("returns 3 recommendations", async () => {
    const factors = {
      bookings: 5,
      revenue: 500,
      reviews: 2,
      averageRating: 3.5,
      listings: 2,
      responseTime: 48,
      conversionRate: 5,
      repeatBookings: 1,
    };
    
    const recommendations = await getFallbackRecommendations(factors);
    
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toHaveProperty("title");
    expect(recommendations[0]).toHaveProperty("description");
    expect(recommendations[0]).toHaveProperty("priority");
  });

  it("fallback mode works without OpenAI", async () => {
    // Test that fallback works when OpenAI is not available
    const factors = {
      bookings: 10,
      revenue: 1000,
      reviews: 5,
      averageRating: 4.0,
      listings: 3,
      responseTime: 12,
      conversionRate: 15,
      repeatBookings: 3,
    };
    
    const recommendations = await getFallbackRecommendations(factors);
    expect(recommendations.length).toBeGreaterThan(0);
  });
});

