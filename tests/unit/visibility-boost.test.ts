import { describe, it, expect } from "@jest/globals";
import { getBoostFromScore, applyVisibilityBoost } from "@/lib/visibility-boost";

describe("Visibility Boost Logic", () => {
  describe("getBoostFromScore", () => {
    it("should return Gold tier for scores >= 80", () => {
      const boost = getBoostFromScore(85);
      expect(boost.boostType).toBe("Gold");
      expect(boost.multiplier).toBe(1.30);
    });

    it("should return Silver tier for scores 60-79", () => {
      const boost = getBoostFromScore(70);
      expect(boost.boostType).toBe("Silver");
      expect(boost.multiplier).toBe(1.15);
    });

    it("should return Bronze tier for scores 40-59", () => {
      const boost = getBoostFromScore(50);
      expect(boost.boostType).toBe("Bronze");
      expect(boost.multiplier).toBe(1.05);
    });

    it("should return None tier for scores < 40", () => {
      const boost = getBoostFromScore(30);
      expect(boost.boostType).toBe("None");
      expect(boost.multiplier).toBe(1.0);
    });
  });

  describe("applyVisibilityBoost", () => {
    it("should apply multiplier correctly", () => {
      expect(applyVisibilityBoost(100, 1.30)).toBe(130);
      expect(applyVisibilityBoost(100, 1.15)).toBe(115);
      expect(applyVisibilityBoost(100, 1.05)).toBe(105);
      expect(applyVisibilityBoost(100, 1.0)).toBe(100);
    });
  });
});

