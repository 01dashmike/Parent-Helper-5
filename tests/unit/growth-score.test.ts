import { describe, it, expect } from "@jest/globals";
import {
  calculateGrowthScore,
  calculateReferralActivityScore,
  calculateProfileCompletionScore,
  calculateListingQualityScore,
  calculateBookingActivityScore,
  calculateReviewsScore,
} from "@/lib/growth-score";

describe("Growth Score Calculations", () => {
  describe("calculateReferralActivityScore", () => {
    it("should calculate score correctly", () => {
      expect(calculateReferralActivityScore(5, 2, 1)).toBe(85); // 5*5 + 2*15 + 1*30 = 85
      expect(calculateReferralActivityScore(0, 0, 0)).toBe(0);
      expect(calculateReferralActivityScore(20, 10, 5)).toBe(100); // Capped at 100
    });
  });

  describe("calculateProfileCompletionScore", () => {
    it("should calculate score correctly", () => {
      expect(
        calculateProfileCompletionScore({
          hasDescription: true,
          hasContactInfo: true,
          hasClasses: true,
          hasPhotos: true,
          hasSocialLinks: true,
        })
      ).toBe(100);

      expect(
        calculateProfileCompletionScore({
          hasDescription: true,
          hasContactInfo: true,
          hasClasses: false,
          hasPhotos: false,
          hasSocialLinks: false,
        })
      ).toBe(40);
    });
  });

  describe("calculateListingQualityScore", () => {
    it("should calculate score correctly", () => {
      expect(
        calculateListingQualityScore({
          totalClasses: 10,
          activeClasses: 10,
          avgClassRating: 5,
          classesWithDescriptions: 10,
        })
      ).toBe(100);

      expect(
        calculateListingQualityScore({
          totalClasses: 10,
          activeClasses: 5,
          avgClassRating: 3,
          classesWithDescriptions: 5,
        })
      ).toBeLessThan(100);
    });
  });

  describe("calculateBookingActivityScore", () => {
    it("should calculate score correctly", () => {
      expect(
        calculateBookingActivityScore({
          totalBookings: 50,
          bookingsLast30Days: 20,
          revenueLast30Days: 1000,
          conversionRate: 10,
        })
      ).toBe(100);

      expect(
        calculateBookingActivityScore({
          totalBookings: 0,
          bookingsLast30Days: 0,
          revenueLast30Days: 0,
          conversionRate: 0,
        })
      ).toBe(0);
    });
  });

  describe("calculateReviewsScore", () => {
    it("should calculate score correctly", () => {
      expect(
        calculateReviewsScore({
          reviewCount: 10,
          averageRating: 5,
          recentReviews: 5,
        })
      ).toBe(100);

      expect(
        calculateReviewsScore({
          reviewCount: 0,
          averageRating: 0,
          recentReviews: 0,
        })
      ).toBe(0);
    });
  });

  describe("calculateGrowthScore", () => {
    it("should calculate overall score with correct weights", () => {
      const result = calculateGrowthScore({
        profile_completion: 100,
        listing_quality: 100,
        booking_activity: 100,
        reviews_score: 100,
        referral_activity: 100,
      });

      expect(result.growthScore).toBe(100);
      expect(result.tier).toBe("Gold");
      expect(result.multiplier).toBe(1.30);
    });

    it("should assign correct tiers", () => {
      expect(calculateGrowthScore({ profile_completion: 85, listing_quality: 85, booking_activity: 85, reviews_score: 85, referral_activity: 85 }).tier).toBe("Gold");
      expect(calculateGrowthScore({ profile_completion: 70, listing_quality: 70, booking_activity: 70, reviews_score: 70, referral_activity: 70 }).tier).toBe("Silver");
      expect(calculateGrowthScore({ profile_completion: 50, listing_quality: 50, booking_activity: 50, reviews_score: 50, referral_activity: 50 }).tier).toBe("Bronze");
      expect(calculateGrowthScore({ profile_completion: 30, listing_quality: 30, booking_activity: 30, reviews_score: 30, referral_activity: 30 }).tier).toBe("None");
    });
  });
});

