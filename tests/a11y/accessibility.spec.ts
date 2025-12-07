import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility compliance tests using axe-core
 * Ensures WCAG 2.1 AA compliance across major pages
 * 
 * Note: Page-level critical tests are in page-level-accessibility.spec.ts
 */
test.describe("Accessibility compliance", () => {
  // Core pages to test
  const urls = [
    "/",
    "/search?q=music",
    "/london",
    "/blog",
  ];

  for (const url of urls) {
    test(`check a11y for ${url}`, async ({ page }) => {
      await page.goto(url);

      // Wait for page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.error(
          `Accessibility violations found on ${url}:`,
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      // Assert no violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  // Test specific interactive components
  test("check a11y for search form", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("form")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error(
        "Accessibility violations in search form:",
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Test navigation menu
  test("check a11y for navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("nav")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error(
        "Accessibility violations in navigation:",
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

