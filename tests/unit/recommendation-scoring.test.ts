/**
 * Unit tests for recommendation scoring algorithm
 * Tests age fit, interest match, distance, and allergy exclusion
 */

import { describe, it, expect } from "vitest";
import {
  calculateAgeFitScore,
  calculateInterestScore,
  calculateDistanceScore,
  shouldExcludeClass,
} from "@/lib/recommendations/buildRecommendations";

describe("Recommendation Scoring - Unit Tests", () => {
  describe("Age Fit Score", () => {
    it("should return 1.0 for perfect age match at center of range", () => {
      const score = calculateAgeFitScore(12, 6, 18); // 12 months in 6-18 range
      expect(score).toBeGreaterThan(0.9);
    });

    it("should return 0 for age below minimum", () => {
      const score = calculateAgeFitScore(3, 6, 18);
      expect(score).toBe(0);
    });

    it("should return 0 for age above maximum", () => {
      const score = calculateAgeFitScore(24, 6, 18);
      expect(score).toBe(0);
    });

    it("should return high score for age at minimum", () => {
      const score = calculateAgeFitScore(6, 6, 18);
      expect(score).toBeGreaterThan(0.5);
    });

    it("should return high score for age at maximum", () => {
      const score = calculateAgeFitScore(18, 6, 18);
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe("Interest Score", () => {
    const mockClass = {
      id: 1,
      name: "Music and Movement",
      description: "Fun music classes for toddlers",
      category: "music",
      subcategory: "movement",
      age_group_min: 6,
      age_group_max: 24,
      town: "London",
      postcode: "SW11 1AA",
      is_active: true,
    };

    it("should return high score for perfect interest match", () => {
      const score = calculateInterestScore(mockClass, ["music"], []);
      expect(score).toBeGreaterThan(0.7);
    });

    it("should return medium score for partial match", () => {
      const score = calculateInterestScore(mockClass, ["music", "dance", "swimming"], []);
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(1);
    });

    it("should return 0.5 for no interests specified", () => {
      const score = calculateInterestScore(mockClass, [], []);
      expect(score).toBe(0.5);
    });

    it("should return low score for no match", () => {
      const score = calculateInterestScore(mockClass, ["swimming", "sports"], []);
      expect(score).toBeLessThan(0.3);
    });

    it("should combine child and family interests", () => {
      const score = calculateInterestScore(mockClass, ["music"], ["movement"]);
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe("Distance Score", () => {
    const mockClass = {
      id: 1,
      name: "Test Class",
      description: "Test",
      category: "test",
      age_group_min: 6,
      age_group_max: 24,
      town: "London",
      postcode: "SW11 1AA",
      latitude: "51.4650",
      longitude: "-0.1647",
      is_active: true,
    };

    it("should return 1.0 for very close distance (<5km)", () => {
      // SW11 coordinates
      const homeLat = 51.4650;
      const homeLon = -0.1647;
      const score = calculateDistanceScore(mockClass, homeLat, homeLon);
      expect(score).toBeGreaterThan(0.9);
    });

    it("should return 0.8 for close distance (5-10km)", () => {
      // Slightly further away
      const homeLat = 51.5000;
      const homeLon = -0.1200;
      const score = calculateDistanceScore(mockClass, homeLat, homeLon);
      expect(score).toBeGreaterThan(0.7);
      expect(score).toBeLessThan(0.9);
    });

    it("should return 0.5 for no coordinates", () => {
      const score = calculateDistanceScore(mockClass, null, null);
      expect(score).toBe(0.5);
    });

    it("should return 0.5 for missing class coordinates", () => {
      const classWithoutCoords = {
        ...mockClass,
        latitude: null,
        longitude: null,
      };
      const score = calculateDistanceScore(classWithoutCoords, 51.4650, -0.1647);
      expect(score).toBe(0.5);
    });
  });

  describe("Allergy Exclusion", () => {
    const mockClass = {
      id: 1,
      name: "Cooking with Nuts",
      description: "Learn to cook with various nuts and dairy products",
      category: "cooking",
      age_group_min: 24,
      age_group_max: 60,
      town: "London",
      postcode: "SW11 1AA",
      is_active: true,
    };

    it("should exclude class with nut allergy", () => {
      const excluded = shouldExcludeClass(mockClass, ["nuts"], []);
      expect(excluded).toBe(true);
    });

    it("should exclude class with dairy allergy", () => {
      const excluded = shouldExcludeClass(mockClass, ["dairy"], []);
      expect(excluded).toBe(true);
    });

    it("should not exclude class without matching allergies", () => {
      const excluded = shouldExcludeClass(mockClass, ["gluten"], []);
      expect(excluded).toBe(false);
    });

    it("should check both child and family allergies", () => {
      const excluded = shouldExcludeClass(mockClass, [], ["nuts"]);
      expect(excluded).toBe(true);
    });

    it("should handle empty allergies", () => {
      const excluded = shouldExcludeClass(mockClass, [], []);
      expect(excluded).toBe(false);
    });

    it("should match allergy keywords in description", () => {
      const cookingClass = {
        ...mockClass,
        name: "Baking Workshop",
        description: "Learn to bake with eggs and flour",
      };
      const excluded = shouldExcludeClass(cookingClass, ["eggs"], []);
      expect(excluded).toBe(true);
    });
  });

  describe("Weighted Score Calculation", () => {
    it("should calculate weighted score correctly", () => {
      const ageFitScore = 0.8;
      const interestScore = 0.6;
      const distanceScore = 0.9;

      // Weighted: Age (40%), Interest (40%), Distance (20%)
      const totalScore = ageFitScore * 0.4 + interestScore * 0.4 + distanceScore * 0.2;
      const expected = 0.8 * 0.4 + 0.6 * 0.4 + 0.9 * 0.2;

      expect(totalScore).toBe(expected);
      expect(totalScore).toBeCloseTo(0.74);
    });

    it("should prioritize age fit and interests over distance", () => {
      const highAgeInterest = 0.9 * 0.4 + 0.9 * 0.4 + 0.3 * 0.2; // 0.78
      const lowAgeInterest = 0.3 * 0.4 + 0.3 * 0.4 + 0.9 * 0.2; // 0.42

      expect(highAgeInterest).toBeGreaterThan(lowAgeInterest);
    });
  });
});

