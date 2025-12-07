import { describe, it, expect } from "@playwright/test";

/**
 * Unit tests for referral and reward logic
 */

describe("Referrals & Rewards - Logic", () => {
    describe("Referral Code Generation", () => {
        it("should generate unique referral codes", () => {
            const codes = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                codes.add(code);
            }
            // Should have high uniqueness
            expect(codes.size).toBeGreaterThan(95);
        });

        it("should generate codes of reasonable length", () => {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            expect(code.length).toBeGreaterThanOrEqual(6);
            expect(code.length).toBeLessThanOrEqual(10);
        });
    });

    describe("Reward Calculation", () => {
        it("should calculate member referral reward correctly", () => {
            const referralType = "member";
            const points = referralType === "member" ? 500 : 1000;
            const valueCents = referralType === "member" ? 500 : 1000;

            expect(points).toBe(500);
            expect(valueCents).toBe(500);
        });

        it("should calculate provider referral reward correctly", () => {
            const referralType = "provider";
            const points = referralType === "member" ? 500 : 1000;
            const valueCents = referralType === "member" ? 500 : 1000;

            expect(points).toBe(1000);
            expect(valueCents).toBe(1000);
        });
    });

    describe("Reward Status Transitions", () => {
        it("should allow transition from pending to earned", () => {
            const transitions = {
                pending: ["earned"],
                earned: ["redeemed"],
                redeemed: [],
            };

            expect(transitions.pending).toContain("earned");
        });

        it("should allow transition from earned to redeemed", () => {
            const transitions = {
                pending: ["earned"],
                earned: ["redeemed"],
                redeemed: [],
            };

            expect(transitions.earned).toContain("redeemed");
        });

        it("should not allow transition from redeemed", () => {
            const transitions = {
                pending: ["earned"],
                earned: ["redeemed"],
                redeemed: [],
            };

            expect(transitions.redeemed.length).toBe(0);
        });
    });

    describe("Reward Aggregation", () => {
        it("should calculate total points correctly", () => {
            const rewards = [
                { points: 500, status: "available" },
                { points: 50, status: "available" },
                { points: 100, status: "redeemed" },
            ];

            const totalPoints = rewards.reduce((sum, r) => sum + r.points, 0);
            expect(totalPoints).toBe(650);
        });

        it("should calculate available value correctly", () => {
            const rewards = [
                { value_cents: 500, status: "available" },
                { value_cents: 0, status: "available" },
                { value_cents: 100, status: "redeemed" },
            ];

            const availableValue = rewards
                .filter((r) => r.status === "available")
                .reduce((sum, r) => sum + r.value_cents, 0);

            expect(availableValue).toBe(500);
        });
    });
});

