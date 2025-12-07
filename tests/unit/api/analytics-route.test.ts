/**
 * Tests for analytics route safety helpers
 */

import { filterAnalyticsEvents, sanitizeAnalyticsPayload } from "@/app/api/analytics/route";

const baseEvent = {
  eventType: "page_view" as const,
  payload: {
    sessionId: "session-123456789",
    path: "/home",
    timestamp: "2024-01-01T00:00:00.000Z",
  },
};

describe("analytics route safety helpers", () => {
  describe("sanitizeAnalyticsPayload", () => {
    it("redacts known PII keys and patterns", () => {
      const payload = {
        sessionId: "session-abc",
        email: "test@example.com",
        phoneNumber: "+44 1234 567890",
        notes: "Reach me at personal@example.com",
      };

      const sanitized = sanitizeAnalyticsPayload(payload);

      expect(sanitized.sessionId).toBe("session-abc");
      expect(sanitized.email).toBe("[redacted]");
      expect(sanitized.phoneNumber).toBe("[redacted]");
      expect(sanitized.notes).toBe("[redacted]");
    });

    it("truncates overly long strings", () => {
      const longString = "a".repeat(1000);
      const sanitized = sanitizeAnalyticsPayload({
        sessionId: "session-abc",
        title: longString,
      });

      expect(typeof sanitized.title).toBe("string");
      expect((sanitized.title as string).length).toBeLessThan(longString.length);
    });
  });

  describe("filterAnalyticsEvents", () => {
    it("drops events without valid sessionId", () => {
      const { sanitizedEvents, droppedReasons } = filterAnalyticsEvents([
        { ...baseEvent, payload: { ...baseEvent.payload, sessionId: "" } },
        baseEvent,
      ]);

      expect(sanitizedEvents).toHaveLength(1);
      expect(droppedReasons.missing_session).toBe(1);
    });

    it("deduplicates identical events to prevent double firing", () => {
      const duplicateEvent = {
        ...baseEvent,
        payload: {
          ...baseEvent.payload,
          timestamp: "2024-01-01T00:00:01.000Z",
        },
      };

      const { sanitizedEvents, droppedReasons } = filterAnalyticsEvents([
        baseEvent,
        duplicateEvent,
      ]);

      expect(sanitizedEvents).toHaveLength(1);
      expect(droppedReasons.duplicate).toBe(1);
    });

    it("retains non-PII data while sanitizing payloads", () => {
      const event = {
        eventType: "class_viewed" as const,
        payload: {
          sessionId: "session-safe",
          classId: 123,
          title: "Baby sensory",
        },
      };

      const { sanitizedEvents, droppedReasons } = filterAnalyticsEvents([event]);

      expect(sanitizedEvents).toHaveLength(1);
      expect(droppedReasons).toEqual({});
      expect(sanitizedEvents[0].payload).toMatchObject({
        sessionId: "session-safe",
        classId: 123,
        title: "Baby sensory",
      });
    });
  });
});


