import { describe, it, expect } from "@jest/globals";
import { calculateProviderGrowthScore, calculateProfileCompleteness } from "@/lib/utils/provider-growth-score";

describe("Provider Growth Score Calculation", () => {
  it("should calculate score for new provider with bookings", () => {
    const metrics = {
      views: 100,
      bookings: 5,
      conversions: 5,
      reviews: 0,
      profile_completion: 80,
      review_average: 0,
      previous_week_bookings: 0,
    };

    const result = calculateProviderGrowthScore(metrics);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.bookingGrowth).toBeGreaterThan(50); // New provider bonus
  });

  it("should calculate score with growth", () => {
    const metrics = {
      views: 200,
      bookings: 20,
      conversions: 20,
      reviews: 5,
      profile_completion: 90,
      review_average: 4.5,
      previous_week_bookings: 10,
    };

    const result = calculateProviderGrowthScore(metrics, { bookings: 10 });

    expect(result.score).toBeGreaterThan(50);
    expect(result.breakdown.bookingGrowth).toBeGreaterThan(50); // Growth
  });

  it("should handle zero views gracefully", () => {
    const metrics = {
      views: 0,
      bookings: 0,
      conversions: 0,
      reviews: 0,
      profile_completion: 50,
      review_average: 0,
    };

    const result = calculateProviderGrowthScore(metrics);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should calculate profile completeness correctly", () => {
    const provider = {
      name: "Test Provider",
      descriptionRaw: "Test description",
      contactEmail: "test@example.com",
      contactPhone: "1234567890",
      website: "https://example.com",
      addressLine1: "123 Test St",
      postcode: "SW1A 1AA",
      latitude: "51.5074",
      longitude: "-0.1278",
      images: [{ url: "test.jpg" }],
    };

    const completeness = calculateProfileCompleteness(provider);
    expect(completeness).toBe(100);
  });

  it("should handle incomplete profile", () => {
    const provider = {
      name: "Test Provider",
      descriptionRaw: null,
      contactEmail: null,
      contactPhone: null,
      website: null,
      addressLine1: null,
      postcode: null,
      latitude: null,
      longitude: null,
      images: null,
    };

    const completeness = calculateProfileCompleteness(provider);
    expect(completeness).toBeLessThan(50);
  });
});

