import { expect, test } from "@playwright/test";
import { classFormSchema, occurrenceFormSchema } from "../../app/provider/(console)/classes/schema";
import { venueFormSchema } from "../../app/provider/(console)/venues/schema";

test.describe("classFormSchema", () => {
  const base = {
    title: "Baby Sensory",
    summary: "Gentle sensory play for babies under 12 months.",
    price: "£10",
    bookingUrl: "https://parenthelper.co.uk/book",
    venueId: "123e4567-e89b-12d3-a456-426614174000",
    tags: "baby, sensory",
    isPublished: "true",
  };

  test("accepts a complete payload", () => {
    const result = classFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(true);
      expect(result.data.tags).toEqual(["baby", "sensory"]);
      expect(result.data.bookingUrl).toBe("https://parenthelper.co.uk/book");
    }
  });

  test("rejects short titles", () => {
    const result = classFormSchema.safeParse({
      ...base,
      title: "Hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Class title is required");
    }
  });

  test("rejects invalid URLs", () => {
    const result = classFormSchema.safeParse({
      ...base,
      bookingUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid URL");
    }
  });
});

test.describe("occurrenceFormSchema", () => {
  const base = {
    classId: "123e4567-e89b-12d3-a456-426614174000",
    startsAt: "2025-11-09T10:00",
    endsAt: "2025-11-09T11:00",
    venueId: "7f5b4a68-0af1-4d4a-9d7f-6d2544d18412",
    status: "scheduled",
    price: "£12",
    bookingUrl: "https://parenthelper.co.uk/book/session",
  };

  test("converts datetime-local strings into ISO timestamps", () => {
    const result = occurrenceFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startsAt).toMatch(/T10:00/);
      expect(result.data.endsAt).toMatch(/T11:00/);
    }
  });

  test("rejects invalid start times", () => {
    const result = occurrenceFormSchema.safeParse({
      ...base,
      startsAt: "not-a-date",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid start time");
    }
  });
});

test.describe("venueFormSchema", () => {
  const base = {
    name: "Parent Helper Hub",
    slug: "parent-helper-hub",
    description: "Cosy family space",
    addressLine1: "12 Market Street",
    addressLine2: "",
    city: "London",
    county: "Greater London",
    postcode: "E1 6AN",
    phone: "+447123456789",
    email: "hello@parenthelper.co.uk",
    website: "https://parenthelper.co.uk",
  };

  test("accepts complete venue payload", () => {
    const result = venueFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  test("rejects short names", () => {
    const result = venueFormSchema.safeParse({
      ...base,
      name: "Hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Venue name is required");
    }
  });

  test("rejects invalid email format", () => {
    const result = venueFormSchema.safeParse({
      ...base,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid email");
    }
  });
});

