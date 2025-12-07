import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Page-level accessibility tests using axe-core
 * Tests fail only on critical accessibility issues (WCAG 2.1 Level A violations)
 * 
 * Critical issues include:
 * - Missing alt text on images
 * - Missing form labels
 * - Missing ARIA labels on interactive elements
 * - Keyboard navigation blockers
 * - Color contrast failures (WCAG AA)
 * - Missing page titles
 * - Missing landmarks
 */

// Helper to filter only critical violations
function getCriticalViolations(violations: any[]) {
  return violations.filter((violation) => {
    // Critical impact level
    if (violation.impact === "critical") {
      return true;
    }

    // WCAG 2.1 Level A failures are critical
    const isLevelA = violation.tags?.some((tag: string) => 
      tag === "wcag2a" || tag === "wcag21a"
    );

    // Specific critical rules
    const criticalRuleIds = [
      "image-alt",           // Images must have alt text
      "label",               // Form elements must have labels
      "button-name",         // Buttons must have accessible names
      "link-name",           // Links must have accessible names
      "input-button-name",   // Input buttons must have names
      "page-has-heading-one", // Page must have h1
      "html-has-lang",       // HTML must have lang attribute
      "color-contrast",      // Color contrast (WCAG AA minimum)
      "keyboard",            // Keyboard navigation
      "focus-order-semantics", // Focus order
      "aria-hidden-focus",   // Hidden elements shouldn't be focusable
      "aria-required-attr",  // Required ARIA attributes
      "aria-valid-attr-value", // Valid ARIA attribute values
    ];

    const isCriticalRule = criticalRuleIds.some((ruleId) => 
      violation.id === ruleId
    );

    return isLevelA || isCriticalRule;
  });
}

test.describe("Page-level Accessibility Tests", () => {
  test.describe.configure({ mode: "parallel" });

  test("check a11y for /search", async ({ page }) => {
    await page.goto("/search");
    
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Additional wait for dynamic content

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();

    const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

    if (criticalViolations.length > 0) {
      console.error(
        `Critical accessibility violations found on /search:`,
        JSON.stringify(criticalViolations, null, 2)
      );
    }

    // Only fail on critical violations
    expect(criticalViolations).toEqual([]);
  });

  test("check a11y for /class/[id] - class detail page", async ({ page }) => {
    // Try to find a valid class ID from the search page
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Look for a class link or card
    const classLink = page.locator('a[href^="/class/"]').first();
    const classCard = page.locator('[data-testid="class-card"] a, .class-card a, article a[href*="/class/"]').first();
    
    let href: string | null = null;
    
    // Try multiple selectors to find a class link
    if (await classLink.count() > 0) {
      href = await classLink.getAttribute("href");
    } else if (await classCard.count() > 0) {
      href = await classCard.getAttribute("href");
    } else {
      // Try to find any link containing /class/
      const anyClassLink = page.locator('a[href*="/class/"]').first();
      if (await anyClassLink.count() > 0) {
        href = await anyClassLink.getAttribute("href");
      }
    }
    
    if (href) {
      await page.goto(href);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();

      const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

      if (criticalViolations.length > 0) {
        console.error(
          `Critical accessibility violations found on ${href}:`,
          JSON.stringify(criticalViolations, null, 2)
        );
      }

      expect(criticalViolations).toEqual([]);
    } else {
      // Skip if no classes found (might be empty database in test environment)
      test.skip("No class links found on search page - skipping class detail test");
    }
  });

  test("check a11y for /search?category=music - category page", async ({ page }) => {
    await page.goto("/search?category=music");
    
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();

    const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

    if (criticalViolations.length > 0) {
      console.error(
        `Critical accessibility violations found on /search?category=music:`,
        JSON.stringify(criticalViolations, null, 2)
      );
    }

    expect(criticalViolations).toEqual([]);
  });

  test("check a11y for /account/searches - saved searches page", async ({ page }) => {
    // This page requires authentication, so we'll test the structure
    // In a real scenario, you'd need to authenticate first
    await page.goto("/account/searches");
    
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check if redirected to login (expected behavior)
    const currentUrl = page.url();
    
    if (currentUrl.includes("/account/login")) {
      // Test the login page accessibility instead
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();

      const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

      if (criticalViolations.length > 0) {
        console.error(
          `Critical accessibility violations found on login redirect:`,
          JSON.stringify(criticalViolations, null, 2)
        );
      }

      expect(criticalViolations).toEqual([]);
    } else {
      // If authenticated, test the actual page
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();

      const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

      if (criticalViolations.length > 0) {
        console.error(
          `Critical accessibility violations found on /account/searches:`,
          JSON.stringify(criticalViolations, null, 2)
        );
      }

      expect(criticalViolations).toEqual([]);
    }
  });

  test("check a11y for /book/checkout - booking checkout page", async ({ page }) => {
    // Booking checkout requires query parameters (classId, occurrenceId)
    // Test the page structure even without valid params
    await page.goto("/book/checkout");
    
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();

    const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

    if (criticalViolations.length > 0) {
      console.error(
        `Critical accessibility violations found on /book/checkout:`,
        JSON.stringify(criticalViolations, null, 2)
      );
    }

    expect(criticalViolations).toEqual([]);
  });

  // Additional test for provider landing page
  // Note: /provider/[slug] route doesn't exist, testing /providers landing page instead
  test("check a11y for /providers - providers landing page", async ({ page }) => {
    await page.goto("/providers");
    
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "best-practice"])
      .analyze();

    const criticalViolations = getCriticalViolations(accessibilityScanResults.violations);

    if (criticalViolations.length > 0) {
      console.error(
        `Critical accessibility violations found on /providers:`,
        JSON.stringify(criticalViolations, null, 2)
      );
    }

    expect(criticalViolations).toEqual([]);
  });
});

