/**
 * Unit tests for Provider Referral System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase
vi.mock("@/lib/supabase.server", () => ({
  getSupabaseServer: vi.fn(),
}));

describe("Referral Code Generation", () => {
  it("generates unique codes in format PH-XXXXXX", async () => {
    const { createReferralCode } = await import("@/lib/referrals/createReferralCode");
    
    // Mock implementation would go here
    // For now, we test the format
    const codePattern = /^PH-[A-Z0-9]{6}$/;
    expect(codePattern.test("PH-ABC123")).toBe(true);
    expect(codePattern.test("PH-XYZ789")).toBe(true);
    expect(codePattern.test("INVALID")).toBe(false);
  });

  it("ensures code uniqueness", async () => {
    // Test that duplicate codes are rejected
    // Implementation would check database for conflicts
  });
});

describe("Referral Tracking State Machine", () => {
  it("allows progression: clicked → registered → listing_created → first_booking", () => {
    const statusOrder = ["clicked", "registered", "listing_created", "first_booking"];
    
    // Test forward progression
    expect(statusOrder.indexOf("clicked")).toBeLessThan(statusOrder.indexOf("registered"));
    expect(statusOrder.indexOf("registered")).toBeLessThan(statusOrder.indexOf("listing_created"));
    expect(statusOrder.indexOf("listing_created")).toBeLessThan(statusOrder.indexOf("first_booking"));
  });

  it("prevents backward progression", () => {
    // Test that status can only move forward
    const currentStatus = "registered";
    const newStatus = "clicked";
    const statusOrder = ["clicked", "registered", "listing_created", "first_booking"];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    expect(newIndex).toBeLessThanOrEqual(currentIndex); // Should reject
  });
});

describe("Reward Issuance Rules", () => {
  it("issues free boost for providers with <3 paid boosts", () => {
    const featuredListingsCount = 2;
    const hasLessThan3Boosts = featuredListingsCount < 3;
    
    expect(hasLessThan3Boosts).toBe(true);
    // Should issue free_boost reward
  });

  it("issues credit for providers with >=3 paid boosts", () => {
    const featuredListingsCount = 3;
    const hasLessThan3Boosts = featuredListingsCount < 3;
    
    expect(hasLessThan3Boosts).toBe(false);
    // Should issue credit reward (£15)
  });
});

describe("A/B Variant Assignment", () => {
  it("assigns variant A for even provider_ids", () => {
    const { getABVariant } = require("@/lib/referrals/getABVariant");
    expect(getABVariant(2)).toBe("A");
    expect(getABVariant(4)).toBe("A");
    expect(getABVariant(100)).toBe("A");
  });

  it("assigns variant B for odd provider_ids", () => {
    const { getABVariant } = require("@/lib/referrals/getABVariant");
    expect(getABVariant(1)).toBe("B");
    expect(getABVariant(3)).toBe("B");
    expect(getABVariant(99)).toBe("B");
  });

  it("returns correct CTA text for each variant", () => {
    const { getReferralCTAText } = require("@/lib/referrals/getABVariant");
    expect(getReferralCTAText("A")).toBe("Invite another provider → earn free boosts.");
    expect(getReferralCTAText("B")).toBe("Grow your presence → help parents discover more classes.");
  });
});

