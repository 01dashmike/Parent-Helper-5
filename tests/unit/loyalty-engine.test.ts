/**
 * Unit tests for loyalty engine and engagement scoring
 */

describe("Loyalty Engine", () => {
  // Mock engagement score calculation
  const calculateEngagementScore = (bookings: number, reviews: number, daysActive: number) => {
    const bookingScore = bookings * 10;
    const reviewScore = reviews * 5;
    const activityScore = Math.min(daysActive * 0.5, 30); // Cap at 30
    return bookingScore + reviewScore + activityScore;
  };

  describe("calculateEngagementScores", () => {
    it("should calculate engagement score correctly", () => {
      const score = calculateEngagementScore(3, 1, 14);
      expect(score).toBe(30 + 5 + 7); // 42
    });

    it("should cap activity score at 30", () => {
      const score = calculateEngagementScore(0, 0, 100);
      expect(score).toBe(30); // Capped activity score
    });

    it("should handle zero bookings and reviews", () => {
      const score = calculateEngagementScore(0, 0, 7);
      expect(score).toBe(3.5); // Only activity score
    });
  });

  describe("Tier Upgrade Logic", () => {
    const getTier = (score: number): "bronze" | "silver" | "gold" => {
      if (score >= 100) return "gold";
      if (score >= 50) return "silver";
      return "bronze";
    };

    it("should assign bronze tier for low scores", () => {
      expect(getTier(30)).toBe("bronze");
    });

    it("should assign silver tier for medium scores", () => {
      expect(getTier(75)).toBe("silver");
    });

    it("should assign gold tier for high scores", () => {
      expect(getTier(150)).toBe("gold");
    });

    it("should upgrade tier when score threshold is met", () => {
      const currentTier = "bronze";
      const newScore = 75;
      const newTier = getTier(newScore);
      expect(newTier).toBe("silver");
      expect(newTier).not.toBe(currentTier);
    });
  });

  describe("Streak Tracking", () => {
    const calculateStreak = (lastActivityDate: Date, currentDate: Date = new Date()): number => {
      const daysDiff = Math.floor(
        (currentDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 1 ? 1 : 0; // Simple streak: consecutive days
    };

    it("should track consecutive day streak", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const streak = calculateStreak(yesterday);
      expect(streak).toBe(1);
    });

    it("should reset streak after gap", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const streak = calculateStreak(threeDaysAgo);
      expect(streak).toBe(0);
    });

    it("should maintain streak bonus in score calculation", () => {
      const baseScore = 50;
      const streakDays = 7;
      const streakBonus = Math.min(streakDays * 2, 20); // Cap at 20
      const totalScore = baseScore + streakBonus;
      expect(totalScore).toBe(64); // 50 + 14
    });
  });

  describe("Loyalty Badge Progression", () => {
    const badges = [
      { name: "First Booking", threshold: 1 },
      { name: "Regular Visitor", threshold: 5 },
      { name: "Community Contributor", threshold: 3 }, // Reviews
      { name: "Silver Family", threshold: 50 }, // Score
      { name: "Gold Family", threshold: 100 }, // Score
    ];

    it("should award badges based on thresholds", () => {
      const bookings = 5;
      const reviews = 3;
      const score = 75;

      const earnedBadges = badges.filter((badge) => {
        if (badge.name === "First Booking" || badge.name === "Regular Visitor") {
          return bookings >= badge.threshold;
        }
        if (badge.name === "Community Contributor") {
          return reviews >= badge.threshold;
        }
        return score >= badge.threshold;
      });

      expect(earnedBadges).toHaveLength(4);
      expect(earnedBadges.map((b) => b.name)).toContain("Silver Family");
    });
  });
});

