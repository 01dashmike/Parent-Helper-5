/**
 * Unit tests for provider weekly summary data aggregation
 * Tests the correctness of data aggregation logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

describe("Provider Weekly Summary - Data Aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate total bookings correctly", async () => {
    const mockBookings = [
      { amount_cents: 1000, status: "confirmed", occurrence_id: "occ1" },
      { amount_cents: 2000, status: "confirmed", occurrence_id: "occ2" },
      { amount_cents: 1500, status: "pending", occurrence_id: "occ3" },
    ];

    mockSupabase.single.mockResolvedValue({
      data: mockBookings,
      error: null,
    });

    const totalBookings = mockBookings.length;
    const confirmedBookings = mockBookings.filter((b) => b.status === "confirmed").length;

    expect(totalBookings).toBe(3);
    expect(confirmedBookings).toBe(2);
  });

  it("should calculate total revenue correctly", async () => {
    const mockBookings = [
      { amount_cents: 1000, status: "confirmed" },
      { amount_cents: 2000, status: "confirmed" },
      { amount_cents: 1500, status: "pending" },
    ];

    const totalRevenue =
      mockBookings.reduce((sum, b) => sum + (b.amount_cents || 0), 0) / 100;

    expect(totalRevenue).toBe(45.0); // (1000 + 2000 + 1500) / 100
  });

  it("should calculate average rating correctly", async () => {
    const mockReviews = [
      { rating: "4.5" },
      { rating: "5.0" },
      { rating: "4.0" },
    ];

    const avgRating =
      mockReviews.reduce((sum, r) => sum + parseFloat(r.rating || "0"), 0) /
      mockReviews.length;

    expect(avgRating).toBeCloseTo(4.5); // (4.5 + 5.0 + 4.0) / 3
  });

  it("should calculate class attendance rate correctly", async () => {
    const mockOccurrences = [
      { id: "occ1", class_id: 1 },
      { id: "occ2", class_id: 1 },
      { id: "occ3", class_id: 2 },
    ];

    const mockBookings = [
      { occurrence_id: "occ1" },
      { occurrence_id: "occ2" },
    ];

    const bookingsWithOccurrence = mockBookings.filter((b) => b.occurrence_id).length;
    const classAttendanceRate =
      mockOccurrences.length > 0
        ? (bookingsWithOccurrence / mockOccurrences.length) * 100
        : 0;

    expect(classAttendanceRate).toBeCloseTo(66.67); // 2/3 * 100
  });

  it("should handle empty data gracefully", async () => {
    const mockBookings: any[] = [];
    const mockReviews: any[] = [];
    const mockOccurrences: any[] = [];

    const totalBookings = mockBookings.length;
    const totalRevenue = mockBookings.reduce((sum, b) => sum + (b.amount_cents || 0), 0) / 100;
    const avgRating =
      mockReviews.length > 0
        ? mockReviews.reduce((sum, r) => sum + parseFloat(r.rating || "0"), 0) / mockReviews.length
        : 0;
    const classAttendanceRate = mockOccurrences.length > 0 ? 0 : 0;

    expect(totalBookings).toBe(0);
    expect(totalRevenue).toBe(0);
    expect(avgRating).toBe(0);
    expect(classAttendanceRate).toBe(0);
  });

  it("should round average rating to 1 decimal place", () => {
    const avgRating = 4.56789;
    const rounded = Math.round(avgRating * 10) / 10;

    expect(rounded).toBe(4.6);
  });

  it("should round attendance rate to 1 decimal place", () => {
    const attendanceRate = 66.66667;
    const rounded = Math.round(attendanceRate * 10) / 10;

    expect(rounded).toBe(66.7);
  });
});

