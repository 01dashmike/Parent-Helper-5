/**
 * Unit tests for analytics tracking
 */

import { logSearchPerformed, logClassViewed, logMapInteraction } from "@/lib/analytics";

// Mock fetch globally
global.fetch = jest.fn();

describe("Analytics Tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  describe("logSearchPerformed", () => {
    it("should send correct payload to /api/analytics", async () => {
      const searchParams = {
        query: "baby classes",
        location: "London",
        category: "music",
      };

      logSearchPerformed(searchParams);

      // Wait for batched event flush (500ms delay)
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(global.fetch).toHaveBeenCalledWith("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("search_performed"),
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events).toBeDefined();
      expect(body.events[0].eventType).toBe("search_performed");
      expect(body.events[0].payload).toMatchObject({
        query: "baby classes",
        location: "London",
        category: "music",
      });
    });

    it("should include session ID in payload", async () => {
      const mockSessionId = "test-session-123";
      Storage.prototype.getItem = jest.fn().mockReturnValue(mockSessionId);

      logSearchPerformed({ query: "test" });
      await new Promise((resolve) => setTimeout(resolve, 600));

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events[0].payload.sessionId).toBe(mockSessionId);
    });

    it("should batch multiple events", async () => {
      logSearchPerformed({ query: "test1" });
      logSearchPerformed({ query: "test2" });
      logClassViewed({ classId: 123 });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.events).toHaveLength(3);
    });
  });

  describe("logClassViewed", () => {
    it("should track class view with correct metadata", async () => {
      logClassViewed({
        classId: 456,
        className: "Baby Sensory",
        category: "sensory",
        town: "London",
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      const classViewEvent = body.events.find((e: any) => e.eventType === "class_viewed");
      
      expect(classViewEvent).toBeDefined();
      expect(classViewEvent.payload).toMatchObject({
        classId: 456,
        className: "Baby Sensory",
        category: "sensory",
        town: "London",
      });
    });
  });

  describe("logMapInteraction", () => {
    it("should track map interactions", async () => {
      logMapInteraction({
        action: "zoom",
        zoom: 12,
        center: { lat: 51.5074, lng: -0.1278 },
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      const mapEvent = body.events.find((e: any) => e.eventType === "map_interaction");
      
      expect(mapEvent).toBeDefined();
      expect(mapEvent.payload.action).toBe("zoom");
      expect(mapEvent.payload.zoom).toBe(12);
    });
  });

  describe("Analytics API Integration", () => {
    it("should handle API errors gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      logSearchPerformed({ query: "test" });
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should not throw - analytics should never break the app
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should verify analytics_events row structure", async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        }),
      };

      logSearchPerformed({ query: "test" });
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Verify the payload structure matches expected schema
      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      
      expect(body.events[0]).toHaveProperty("eventType");
      expect(body.events[0]).toHaveProperty("payload");
      expect(body.events[0].payload).toHaveProperty("sessionId");
      expect(body.events[0].payload).toHaveProperty("timestamp");
    });
  });
});

