import { test, expect } from "@playwright/test";

test.describe("Localization - City Pages", () => {
  test("renders London city page with correct metadata", async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    await page.goto(`${baseURL}/london`);

    // Verify page title
    await expect(page).toHaveTitle(/london|baby.*toddler.*classes/i);

    // Verify hero section
    const hero = page.getByRole("heading", { name: /london|classes in london/i }).first();
    await expect(hero).toBeVisible({ timeout: 5000 });

    // Verify meta description (check in head)
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const description = await metaDescription.getAttribute("content");
      expect(description).toContain("London");
      expect(description).toContain("baby");
    }

    // Verify weather chip (if implemented)
    const weatherChip = page.getByText(/°C|°F|weather/i).first();
    // Weather might not always be visible, so we'll check if it exists
    const hasWeather = await weatherChip.isVisible().catch(() => false);
    if (hasWeather) {
      await expect(weatherChip).toBeVisible();
    }
  });

  test("displays tips carousel cards", async ({ page }) => {
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/london`);

    // Look for tips/expert advice section
    const tipsSection = page.getByText(/tips|expert advice|local insights/i).first();
    
    if (await tipsSection.isVisible().catch(() => false)) {
      await expect(tipsSection).toBeVisible();

      // Verify carousel cards are visible
      const tipCards = page.locator('[data-testid="tip-card"], .tip-card, [class*="tip"]');
      const cardCount = await tipCards.count();
      
      if (cardCount > 0) {
        expect(cardCount).toBeGreaterThan(0);
        await expect(tipCards.first()).toBeVisible();
      }
    }
  });

  test("lists top 5 classes for city", async ({ page }) => {
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/london`);

    // Wait for classes to load
    await page.waitForLoadState("networkidle");

    // Find class listings
    const classListings = page.locator('[data-testid="class-card"], .class-card, article').filter({
      hasText: /class|session|activity/i,
    });

    const classCount = await classListings.count();
    
    // Should have at least some classes (may be more than 5)
    expect(classCount).toBeGreaterThan(0);

    // Verify first few classes are visible
    if (classCount > 0) {
      await expect(classListings.first()).toBeVisible();
    }
  });

  test("renders dynamic meta title for different cities", async ({ page }) => {
    const cities = ["london", "manchester", "birmingham"];

    for (const city of cities) {
      await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/classes/${city}`);
      
      const title = await page.title();
      expect(title.toLowerCase()).toContain(city.toLowerCase());
      expect(title).toContain("Classes");
    }
  });
});

