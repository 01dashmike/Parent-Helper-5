import { describe, it, expect } from "@playwright/test";
import { z } from "zod";

// Validation schema matching the server action
const updateOccurrenceSchema = z.object({
  occurrenceId: z.coerce.number().int().positive(),
  bookable: z.boolean(),
  stripePaymentLinkUrl: z
    .string()
    .url("Must be a valid HTTPS URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Payment link must use HTTPS",
    })
    .optional()
    .or(z.literal("")),
});

describe("Simple Bookings - Validation", () => {
  describe("updateOccurrenceSchema", () => {
    it("should accept valid occurrence update with HTTPS payment link", () => {
      const valid = {
        occurrenceId: "123",
        bookable: true,
        stripePaymentLinkUrl: "https://buy.stripe.com/test123",
      };

      const result = updateOccurrenceSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.occurrenceId).toBe(123);
        expect(result.data.bookable).toBe(true);
        expect(result.data.stripePaymentLinkUrl).toBe("https://buy.stripe.com/test123");
      }
    });

    it("should accept valid occurrence update without payment link when not bookable", () => {
      const valid = {
        occurrenceId: "456",
        bookable: false,
        stripePaymentLinkUrl: "",
      };

      const result = updateOccurrenceSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookable).toBe(false);
      }
    });

    it("should reject HTTP URLs", () => {
      const invalid = {
        occurrenceId: "123",
        bookable: true,
        stripePaymentLinkUrl: "http://buy.stripe.com/test123",
      };

      const result = updateOccurrenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("HTTPS");
      }
    });

    it("should reject invalid URLs", () => {
      const invalid = {
        occurrenceId: "123",
        bookable: true,
        stripePaymentLinkUrl: "not-a-url",
      };

      const result = updateOccurrenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("valid");
      }
    });

    it("should reject negative occurrence IDs", () => {
      const invalid = {
        occurrenceId: "-1",
        bookable: true,
        stripePaymentLinkUrl: "https://buy.stripe.com/test123",
      };

      const result = updateOccurrenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject zero occurrence IDs", () => {
      const invalid = {
        occurrenceId: "0",
        bookable: true,
        stripePaymentLinkUrl: "https://buy.stripe.com/test123",
      };

      const result = updateOccurrenceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should coerce string occurrence IDs to numbers", () => {
      const valid = {
        occurrenceId: "789",
        bookable: true,
        stripePaymentLinkUrl: "https://buy.stripe.com/test123",
      };

      const result = updateOccurrenceSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.occurrenceId).toBe("number");
        expect(result.data.occurrenceId).toBe(789);
      }
    });
  });
});

