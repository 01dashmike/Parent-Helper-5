import { describe, it, expect } from "vitest";
import {
  expandRecurrence,
  validateNoOverlaps,
  type DayOfWeek,
} from "@/lib/utils/recurrence";

describe("recurrence utilities", () => {
  describe("expandRecurrence", () => {
    it("should expand Monday/Wednesday for 2 weeks", () => {
      const startDate = new Date("2024-01-01"); // Monday
      const endDate = new Date("2024-01-14"); // Sunday (2 weeks later)
      const config = {
        daysOfWeek: [1, 3] as DayOfWeek[], // Monday, Wednesday
        startDate,
        endDate,
        startTime: "10:00",
        durationMinutes: 60,
        excludeDates: [],
      };

      const result = expandRecurrence(config);

      // Should have 4 occurrences (Mon, Wed, Mon, Wed)
      expect(result.length).toBe(4);
      expect(result[0].startAt.getDay()).toBe(1); // Monday
      expect(result[1].startAt.getDay()).toBe(3); // Wednesday
    });

    it("should exclude specified dates", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-14");
      const excludeDate = new Date("2024-01-03"); // Wednesday
      const config = {
        daysOfWeek: [1, 3] as DayOfWeek[], // Monday, Wednesday
        startDate,
        endDate,
        startTime: "10:00",
        durationMinutes: 60,
        excludeDates: [excludeDate],
      };

      const result = expandRecurrence(config);

      // Should exclude the Wednesday on 2024-01-03
      const excludedOccurrence = result.find(
        (occ) => occ.startAt.toISOString().split("T")[0] === excludeDate.toISOString().split("T")[0]
      );
      expect(excludedOccurrence).toBeUndefined();
    });

    it("should set correct duration", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-07");
      const config = {
        daysOfWeek: [1] as DayOfWeek[], // Monday
        startDate,
        endDate,
        startTime: "10:00",
        durationMinutes: 90,
        excludeDates: [],
      };

      const result = expandRecurrence(config);

      expect(result.length).toBe(1);
      const duration = (result[0].endAt.getTime() - result[0].startAt.getTime()) / 60000;
      expect(duration).toBe(90);
    });
  });

  describe("validateNoOverlaps", () => {
    it("should detect overlapping occurrences", () => {
      const occurrences = [
        {
          startAt: new Date("2024-01-01T10:00:00Z"),
          endAt: new Date("2024-01-01T11:00:00Z"),
        },
        {
          startAt: new Date("2024-01-01T10:30:00Z"),
          endAt: new Date("2024-01-01T11:30:00Z"),
        },
      ];

      const result = validateNoOverlaps(occurrences);

      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it("should pass validation for non-overlapping occurrences", () => {
      const occurrences = [
        {
          startAt: new Date("2024-01-01T10:00:00Z"),
          endAt: new Date("2024-01-01T11:00:00Z"),
        },
        {
          startAt: new Date("2024-01-01T11:00:00Z"),
          endAt: new Date("2024-01-01T12:00:00Z"),
        },
      ];

      const result = validateNoOverlaps(occurrences);

      expect(result.valid).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });
  });
});

