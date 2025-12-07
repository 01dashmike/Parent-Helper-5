import { describe, it, expect } from "@playwright/test";

/**
 * Calculate age in months from birthdate
 */
function calculateAgeMonths(birthdate: string): number {
    const birth = new Date(birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    return years * 12 + months;
}

/**
 * Check if two arrays have any overlapping elements
 */
function hasOverlap(arr1: string[], arr2: string[]): boolean {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
        return false;
    }
    return arr1.some((item) => arr2.includes(item));
}

/**
 * Check if age fits within age band
 */
function ageFitsAgeBand(ageMonths: number, minMonths: number, maxMonths: number): boolean {
    return ageMonths >= minMonths && ageMonths <= maxMonths;
}

describe("Child Profiles - Age Band Calculation", () => {
    describe("calculateAgeMonths", () => {
        it("should calculate age correctly for a 6-month-old", () => {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const age = calculateAgeMonths(sixMonthsAgo.toISOString().split("T")[0]);
            expect(age).toBeGreaterThanOrEqual(5);
            expect(age).toBeLessThanOrEqual(7);
        });

        it("should calculate age correctly for a 2-year-old", () => {
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
            const age = calculateAgeMonths(twoYearsAgo.toISOString().split("T")[0]);
            expect(age).toBeGreaterThanOrEqual(23);
            expect(age).toBeLessThanOrEqual(25);
        });

        it("should handle exact birthdate", () => {
            const today = new Date().toISOString().split("T")[0];
            const age = calculateAgeMonths(today);
            expect(age).toBe(0);
        });

        it("should handle leap year birthdays", () => {
            const leapYearBirth = "2020-02-29";
            const age = calculateAgeMonths(leapYearBirth);
            // Should handle gracefully without errors
            expect(typeof age).toBe("number");
            expect(age).toBeGreaterThanOrEqual(0);
        });
    });

    describe("ageFitsAgeBand", () => {
        it("should return true when age fits within band", () => {
            expect(ageFitsAgeBand(12, 6, 18)).toBe(true);
            expect(ageFitsAgeBand(6, 6, 18)).toBe(true);
            expect(ageFitsAgeBand(18, 6, 18)).toBe(true);
        });

        it("should return false when age is below minimum", () => {
            expect(ageFitsAgeBand(5, 6, 18)).toBe(false);
        });

        it("should return false when age is above maximum", () => {
            expect(ageFitsAgeBand(19, 6, 18)).toBe(false);
        });

        it("should handle edge cases", () => {
            expect(ageFitsAgeBand(0, 0, 12)).toBe(true);
            expect(ageFitsAgeBand(12, 0, 12)).toBe(true);
        });
    });
});

describe("Child Profiles - Interest Overlap", () => {
    describe("hasOverlap", () => {
        it("should return true when arrays have overlapping elements", () => {
            expect(hasOverlap(["music", "dance"], ["music", "sports"])).toBe(true);
            expect(hasOverlap(["swimming"], ["swimming", "tennis"])).toBe(true);
            expect(hasOverlap(["arts", "crafts"], ["crafts", "reading"])).toBe(true);
        });

        it("should return false when arrays have no overlap", () => {
            expect(hasOverlap(["music", "dance"], ["sports", "swimming"])).toBe(false);
            expect(hasOverlap(["arts"], ["sports"])).toBe(false);
        });

        it("should return false when one array is empty", () => {
            expect(hasOverlap([], ["music", "dance"])).toBe(false);
            expect(hasOverlap(["music", "dance"], [])).toBe(false);
        });

        it("should return false when both arrays are empty", () => {
            expect(hasOverlap([], [])).toBe(false);
        });

        it("should handle case sensitivity", () => {
            // Note: This depends on implementation - current implementation is case-sensitive
            expect(hasOverlap(["Music"], ["music"])).toBe(false);
            expect(hasOverlap(["Music"], ["Music"])).toBe(true);
        });

        it("should handle partial matches correctly", () => {
            expect(hasOverlap(["music", "dance"], ["music"])).toBe(true);
            expect(hasOverlap(["swimming"], ["swimming", "tennis", "golf"])).toBe(true);
        });
    });
});

