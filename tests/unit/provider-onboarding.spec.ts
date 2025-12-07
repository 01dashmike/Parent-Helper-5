import { expect, test } from "@playwright/test";
import { providerLeadSchema } from "../../app/onboarding/schema";
import {
  CATEGORY_OPTIONS,
  HEAR_ABOUT_SELECT_OPTIONS,
} from "../../app/onboarding/constants";

test.describe("providerLeadSchema", () => {
  const base = {
    name: "Harriet Wells",
    email: "hello@brighttots.co.uk",
    company: "Bright Tots",
    privacy_accepted: true,
  } as const;

  test("accepts minimal valid submission", () => {
    const result = providerLeadSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  test("accepts fully populated submission", () => {
    const sample = {
      ...base,
      phone: "+447123456789",
      website: "https://brighttots.co.uk",
      postcode: "E1 6AN",
      town: "London",
      categories: CATEGORY_OPTIONS.slice(0, 3),
      hear_about: HEAR_ABOUT_SELECT_OPTIONS[0],
      message: "Excited to join Parent Helper",
      newsletter_optin: true,
    };

    const result = providerLeadSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  test("rejects invalid UK phone numbers", () => {
    const result = providerLeadSchema.safeParse({
      ...base,
      phone: "01234",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid UK phone");
    }
  });

  test("rejects invalid postcode formats", () => {
    const result = providerLeadSchema.safeParse({
      ...base,
      postcode: "ABC123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid UK postcode");
    }
  });

  test("rejects malformed URLs", () => {
    const result = providerLeadSchema.safeParse({
      ...base,
      website: "brighttots",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid URL");
    }
  });

  test("requires privacy consent", () => {
    const result = providerLeadSchema.safeParse({
      ...base,
      privacy_accepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("privacy policy");
    }
  });
});


