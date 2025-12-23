import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.use({ baseURL });

test.describe("Parents Landing Page", () => {
  test("should load the parents page", async ({ page }) => {
    await page.goto("/parents");

    // Check page title
    await expect(page).toHaveTitle(/Parent Helper.*Discover Baby.*Toddler Classes/i);

    // Check main heading
    await expect(page.getByRole("heading", { name: /Discover Magical Days Together/i })).toBeVisible();
  });

  test("should have search bar with location and category inputs", async ({ page }) => {
    await page.goto("/parents");

    // Check search form exists
    const searchForm = page.getByRole("search", { name: /Search for baby and toddler classes/i });
    await expect(searchForm).toBeVisible();

    // Check location input
    const locationInput = page.getByLabel(/Enter town or postcode/i);
    await expect(locationInput).toBeVisible();
    await expect(locationInput).toHaveAttribute("type", "text");

    // Check category select
    const categorySelect = page.getByLabel(/Select activity category/i);
    await expect(categorySelect).toBeVisible();

    // Check search button
    const searchButton = page.getByRole("button", { name: /Search Classes/i });
    await expect(searchButton).toBeVisible();
  });

  test("should navigate to search page on form submit", async ({ page }) => {
    await page.goto("/parents");

    // Fill in search form
    await page.getByLabel(/Enter town or postcode/i).fill("London");
    await page.getByLabel(/Select activity category/i).selectOption("music");

    // Submit form
    await page.getByRole("button", { name: /Search Classes/i }).click();

    // Should navigate to search page
    await expect(page).toHaveURL(/\/search/);
    const url = new URL(page.url());
    expect(url.searchParams.get("loc")).toBe("London");
    expect(url.searchParams.get("q")).toBe("music");
  });

  test("should display 'Why Families Love Parent Helper' section", async ({ page }) => {
    await page.goto("/parents");

    const heading = page.getByRole("heading", { name: /Why Families Love Parent Helper/i });
    await expect(heading).toBeVisible();

    // Check that all 6 items are present
    const reasons = page.locator('[class*="rounded-lg border border-sage"]');
    await expect(reasons).toHaveCount(6);
  });

  test("should display age explorer section", async ({ page }) => {
    await page.goto("/parents");

    const heading = page.getByRole("heading", { name: /Find Activities by Age/i });
    await expect(heading).toBeVisible();

    // Check age groups are present
    await expect(page.getByText(/Baby Classes/i)).toBeVisible();
    await expect(page.getByText(/Toddler Groups/i)).toBeVisible();
    await expect(page.getByText(/School Age/i)).toBeVisible();
    await expect(page.getByText(/Teens/i)).toBeVisible();
  });

  test("should display 'This Week Near You' section", async ({ page }) => {
    await page.goto("/parents");

    const heading = page.getByRole("heading", { name: /This Week Near You/i });
    await expect(heading).toBeVisible();

    // Check that test data classes are displayed
    await expect(page.getByText(/Baby Music & Movement/i)).toBeVisible();
    await expect(page.getByText(/Toddler Sensory Play/i)).toBeVisible();
  });

  test("should display SEND-friendly section", async ({ page }) => {
    await page.goto("/parents");

    const heading = page.getByRole("heading", { name: /SEND-Friendly Activities/i });
    await expect(heading).toBeVisible();

    // Check links exist
    await expect(page.getByRole("link", { name: /Find SEND-Friendly Classes/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /SEND Resources & Support/i })).toBeVisible();
  });

  test("should display newsletter signup section", async ({ page }) => {
    await page.goto("/parents");

    const heading = page.getByRole("heading", { name: /Stay in the Loop/i });
    await expect(heading).toBeVisible();

    // Check email input exists
    const emailInput = page.getByLabel(/Email address/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Check subscribe button exists
    await expect(page.getByRole("button", { name: /Subscribe/i })).toBeVisible();
  });

  test("should have schema.org metadata", async ({ page }) => {
    await page.goto("/parents");

    // Check for JSON-LD scripts
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThan(0);

    // Check that at least one contains WebSite schema
    const pageContent = await page.content();
    expect(pageContent).toContain('"@type": "WebSite"');
    expect(pageContent).toContain('"@type": "LocalBusiness"');
  });

  test("should have proper navigation links", async ({ page }) => {
    await page.goto("/parents");

    // Check quick links in hero
    await expect(page.getByRole("link", { name: /Classes in London/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Music Classes/i })).toBeVisible();

    // Check CTA links
    await expect(page.getByRole("link", { name: /Start Exploring/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View All Classes/i })).toBeVisible();
  });

  test("should display blog preview if posts available", async ({ page }) => {
    await page.goto("/parents");

    // Blog section may or may not be visible depending on data
    const blogHeading = page.getByRole("heading", { name: /From Our Blog/i });
    const isVisible = await blogHeading.isVisible().catch(() => false);

    if (isVisible) {
      // If visible, check structure
      await expect(blogHeading).toBeVisible();
      await expect(page.getByRole("link", { name: /View All Articles/i })).toBeVisible();
    }
  });

  test("should be accessible", async ({ page }) => {
    await page.goto("/parents");

    // Check for proper heading hierarchy
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();

    // Check form labels
    const locationLabel = page.getByLabel(/Enter town or postcode/i);
    await expect(locationLabel).toBeVisible();

    // Check search form has proper role
    const searchForm = page.getByRole("search");
    await expect(searchForm).toBeVisible();
  });
});

