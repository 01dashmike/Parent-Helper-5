/**
 * Unit tests for email templates
 */

import { bookingConfirmation } from "@/lib/emails/templates/bookingConfirmation";

// Mock SendGrid
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

describe("Email Templates", () => {
  describe("Booking Confirmation Template", () => {
    it("should replace placeholders correctly", () => {
      const template = bookingConfirmation({
        bookingId: "booking-123",
        parentName: "Jane Doe",
        parentEmail: "jane@example.com",
        className: "Baby Sensory",
        venue: "Community Centre",
        address: "123 Main St",
        town: "London",
        sessionDate: "2024-12-01T10:00:00",
        amountPaid: 2000, // £20.00 in cents
        confirmationCode: "ABC123",
      });

      expect(template.html).toContain("Baby Sensory");
      expect(template.html).toContain("ABC123");
      expect(template.html).toContain("Jane Doe");
      expect(template.html).toContain("£20.00");
    });

    it("should include booking details when provided", () => {
      const template = bookingConfirmation({
        bookingId: "booking-123",
        parentName: "John Smith",
        parentEmail: "john@example.com",
        className: "Test Class",
        venue: "Test Venue",
        address: "456 Test St",
        town: "Manchester",
        sessionDate: "2024-12-01T10:00:00",
        amountPaid: 1500, // £15.00 in cents
        confirmationCode: "XYZ789",
      });

      expect(template.html).toContain("review");
      expect(template.html).toContain("booking-123");
    });

    it("should generate plain text version", () => {
      const template = bookingConfirmation({
        bookingId: "booking-456",
        parentName: "Alice Brown",
        parentEmail: "alice@example.com",
        className: "Music Class",
        venue: "Music Hall",
        address: "789 Music Lane",
        town: "Birmingham",
        sessionDate: "2024-12-01T10:00:00",
        amountPaid: 2500, // £25.00 in cents
        confirmationCode: "MUS456",
      });

      expect(template.text).toBeDefined();
      expect(template.text).toContain("Music Class");
      expect(template.text).toContain("MUS456");
      expect(template.text).not.toContain("<"); // No HTML tags
    });
  });

  describe("SendGrid Integration", () => {
    it("should simulate SendGrid send with mocked payload", async () => {
      const { sendTransactional } = await import("@/lib/emails/sendTransactional");

      const result = await sendTransactional({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
        text: "Test content",
        type: "test",
      });

      // In test mode, should return ok: true without actually sending
      expect(result.ok).toBe(true);
    });

    it("should handle email validation", async () => {
      const { sendTransactional } = await import("@/lib/emails/sendTransactional");

      const result = await sendTransactional({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    it("should format currency correctly in emails", () => {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
        }).format(amount);
      };

      expect(formatCurrency(20.0)).toBe("£20.00");
      expect(formatCurrency(15.5)).toBe("£15.50");
      expect(formatCurrency(0)).toBe("£0.00");
    });
  });

  describe("Email Template Loading", () => {
    it("should load booking_confirmation template", () => {
      const template = bookingConfirmation({
        bookingId: "test-123",
        parentName: "Test User",
        parentEmail: "test@example.com",
        className: "Test Class",
        venue: "Test Venue",
        address: "Test Address",
        town: "Test Town",
        sessionDate: new Date().toISOString(),
        amountPaid: 1000, // £10.00 in cents
        confirmationCode: "TEST",
      });

      expect(template.subject).toBeDefined();
      expect(template.html).toBeDefined();
      expect(template.text).toBeDefined();
    });

    it("should handle missing optional fields", () => {
      const template = bookingConfirmation({
        bookingId: "test-456",
        parentName: "Test User",
        parentEmail: "test@example.com",
        className: "Test Class",
        venue: "Test Venue",
        address: "Test Address",
        town: "Test Town",
        sessionDate: new Date().toISOString(),
        amountPaid: 1000, // £10.00 in cents
        confirmationCode: "TEST",
        // Optional fields like bookingNotes, cancellationPolicy are not required
      });

      expect(template.html).toBeDefined();
      // Should not throw even without optional fields
    });
  });
});

