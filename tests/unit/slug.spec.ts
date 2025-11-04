import { expect, test } from "@playwright/test";
import { slugify } from "../../lib/slug";

test.describe("slugify", () => {
  test("lowercases and hyphenates strings", () => {
    expect(slugify("Gentle Sleep Tips")).toBe("gentle-sleep-tips");
  });

  test("strips special characters", () => {
    expect(slugify("Hello, World!"))
      .toBe("hello-world");
  });

  test("collapses repeated separators", () => {
    expect(slugify("Spaces   and --- punctuation"))
      .toBe("spaces-and-punctuation");
  });
});
