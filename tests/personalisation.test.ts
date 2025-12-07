/**
 * Unit tests for personalisation functions
 * Run with: npm test -- personalisation
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Mock implementations for testing
function scoreAgeFit(childAgeMonths: number, classMinAge: number, classMaxAge: number): number {
  const childAgeYears = childAgeMonths / 12;
  if (childAgeYears >= classMinAge && childAgeYears <= classMaxAge) {
    return 1;
  }
  // Decay function
  const distance = Math.min(
    Math.abs(childAgeYears - classMinAge),
    Math.abs(childAgeYears - classMaxAge)
  );
  return Math.max(0, 1 - distance * 0.2);
}

function distanceScore(distanceKm: number, maxRadiusKm: number): number {
  return Math.max(0, 1 - distanceKm / maxRadiusKm);
}

function normalisePopularity(popularity: number, minPop: number, maxPop: number): number {
  if (maxPop === minPop) return 0.5;
  return (popularity - minPop) / (maxPop - minPop);
}

describe("Personalisation Scoring Functions", () => {
  describe("scoreAgeFit", () => {
    it("should return 1 for perfect age match", () => {
      expect(scoreAgeFit(24, 1, 3)).toBe(1); // 2 years old, class 1-3 years
    });

    it("should return 0.3 for age outside range", () => {
      const score = scoreAgeFit(60, 1, 3); // 5 years old, class 1-3 years
      expect(score).toBeLessThan(0.5);
    });
  });

  describe("distanceScore", () => {
    it("should return 1 for 0km distance", () => {
      expect(distanceScore(0, 20)).toBe(1);
    });

    it("should return 0.5 for half radius distance", () => {
      expect(distanceScore(10, 20)).toBe(0.5);
    });

    it("should return 0 for max radius distance", () => {
      expect(distanceScore(20, 20)).toBe(0);
    });
  });

  describe("normalisePopularity", () => {
    it("should normalize between 0 and 1", () => {
      expect(normalisePopularity(50, 0, 100)).toBe(0.5);
      expect(normalisePopularity(0, 0, 100)).toBe(0);
      expect(normalisePopularity(100, 0, 100)).toBe(1);
    });

    it("should handle equal min/max", () => {
      expect(normalisePopularity(50, 50, 50)).toBe(0.5);
    });
  });
});

describe("Newsletter Block Composition", () => {
  function composeNewsletterBlocks(recommendations: any[], child: any): Record<string, string> {
    const blocks: Record<string, string> = {};

    if (child && recommendations.length > 0) {
      const childRecs = recommendations.slice(0, 3);
      blocks.child_section = childRecs
        .map((rec) => `• ${rec.classes?.name || "Class"}`)
        .join("\n");
    }

    return blocks;
  }

  it("should create child section when child exists", () => {
    const recommendations = [
      { classes: { name: "Music Class" } },
      { classes: { name: "Swimming" } },
    ];
    const child = { first_name: "Emma" };
    const blocks = composeNewsletterBlocks(recommendations, child);
    expect(blocks.child_section).toBeDefined();
    expect(blocks.child_section).toContain("Music Class");
  });

  it("should not create child section when no child", () => {
    const recommendations = [{ classes: { name: "Music Class" } }];
    const blocks = composeNewsletterBlocks(recommendations, null);
    expect(blocks.child_section).toBeUndefined();
  });
});

