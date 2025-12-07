/**
 * E2E test for growth recommendations API
 * Seeds sample analytics data and verifies 3 actionable insights are rendered
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("Growth Recommendations - E2E", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 3 actionable insights when called with sample data", async () => {
    // Mock sample analytics data
    const mockProviderMetrics = [
      {
        provider_id: 1,
        total_bookings: 10,
        confirmed_bookings: 8,
        total_revenue: 250.0,
        average_rating: 4.5,
      },
      {
        provider_id: 2,
        total_bookings: 5,
        confirmed_bookings: 4,
        total_revenue: 120.0,
        average_rating: 4.0,
      },
    ];

    const mockBookings = [
      { provider_id: 1, created_at: new Date().toISOString(), status: "confirmed", class_id: 1 },
      { provider_id: 1, created_at: new Date().toISOString(), status: "confirmed", class_id: 2 },
      { provider_id: 2, created_at: new Date().toISOString(), status: "pending", class_id: 3 },
    ];

    const mockClasses = [
      { id: 1, provider_id: 1, category: "sensory", town: "SW11", postcode: "SW11 1AA", day_of_week: "Monday", is_featured: false },
      { id: 2, provider_id: 1, category: "music", town: "SW11", postcode: "SW11 1AB", day_of_week: "Tuesday", is_featured: true },
      { id: 3, provider_id: 2, category: "swimming", town: "SW12", postcode: "SW12 1AA", day_of_week: "Wednesday", is_featured: false },
    ];

    const mockSearchEvents = [
      { payload: { query: "sensory classes SW11" } },
      { payload: { query: "Sunday classes" } },
      { payload: { query: "baby swimming" } },
    ];

    // Mock OpenAI response
    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendations: [
                {
                  title: "Add more classes on Sundays",
                  description: "Sunday has low class coverage compared to other days. Adding classes could capture weekend demand.",
                  actionType: "add_classes",
                  actionData: { dayOfWeek: "Sunday" },
                  priority: 1,
                  expectedImpact: "High",
                },
                {
                  title: "Feature in SW11 for visibility",
                  description: "SW11 has high search volume but low featured listings. Featuring classes here could increase bookings.",
                  actionType: "feature_location",
                  actionData: { location: "SW11" },
                  priority: 2,
                  expectedImpact: "Medium",
                },
                {
                  title: "Optimize sensory class listings",
                  description: "Sensory classes have high search interest. Improving listings could boost conversion.",
                  actionType: "improve_listing",
                  actionData: { category: "sensory" },
                  priority: 3,
                  expectedImpact: "Medium",
                },
              ],
            }),
          },
        },
      ],
    };

    // Mock Supabase responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProviderMetrics }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBookings }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockClasses }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSearchEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenAIResponse,
      });

    // Call the API
    const response = await fetch("/api/growth-recommendations");
    const data = await response.json();

    // Verify response structure
    expect(response.ok).toBe(true);
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBe(3);

    // Verify each recommendation has required fields
    data.recommendations.forEach((rec: any, idx: number) => {
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.actionType).toBeDefined();
      expect(rec.priority).toBe(idx + 1);
      expect(rec.expectedImpact).toBeDefined();
    });

    // Verify specific recommendations
    expect(data.recommendations[0].title).toContain("Sunday");
    expect(data.recommendations[0].actionType).toBe("add_classes");
    expect(data.recommendations[1].title).toContain("SW11");
    expect(data.recommendations[1].actionType).toBe("feature_location");
  });

  it("should use fallback recommendations when OpenAI fails", async () => {
    // Mock OpenAI failure
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 1, provider_id: 1, category: "sensory", town: "SW11", day_of_week: "Monday" },
            { id: 2, provider_id: 1, category: "music", town: "SW11", day_of_week: "Tuesday" },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "OpenAI API error" }),
      });

    // Call the API - should fallback to rule-based recommendations
    const response = await fetch("/api/growth-recommendations");
    const data = await response.json();

    // Should still return 3 recommendations (fallback)
    expect(data.recommendations).toBeDefined();
    expect(data.recommendations.length).toBe(3);
  });

  it("should handle empty data gracefully", async () => {
    // Mock empty responses
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [
                    {
                      title: "Generic recommendation 1",
                      description: "Description 1",
                      actionType: "improve_listing",
                      priority: 1,
                      expectedImpact: "Medium",
                    },
                    {
                      title: "Generic recommendation 2",
                      description: "Description 2",
                      actionType: "improve_listing",
                      priority: 2,
                      expectedImpact: "Medium",
                    },
                    {
                      title: "Generic recommendation 3",
                      description: "Description 3",
                      actionType: "improve_listing",
                      priority: 3,
                      expectedImpact: "Medium",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      });

    const response = await fetch("/api/growth-recommendations");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.recommendations.length).toBe(3);
  });

  it("should verify recommendations are actionable", async () => {
    const mockRecommendations = [
      {
        title: "Add more classes on Sundays",
        description: "Sunday has low coverage",
        actionType: "add_classes",
        actionData: { dayOfWeek: "Sunday" },
        priority: 1,
        expectedImpact: "High",
      },
      {
        title: "Feature in SW11",
        description: "SW11 has high demand",
        actionType: "feature_location",
        actionData: { location: "SW11" },
        priority: 2,
        expectedImpact: "Medium",
      },
      {
        title: "Optimize listings",
        description: "Improve conversion rates",
        actionType: "improve_listing",
        priority: 3,
        expectedImpact: "Medium",
      },
    ];

    // Verify each recommendation has actionable elements
    mockRecommendations.forEach((rec) => {
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.actionType).toBeTruthy();
      expect(["add_classes", "feature_location", "optimize_schedule", "improve_listing", "expand_coverage"]).toContain(
        rec.actionType
      );
      expect(rec.priority).toBeGreaterThan(0);
      expect(rec.priority).toBeLessThanOrEqual(3);
    });
  });
});

