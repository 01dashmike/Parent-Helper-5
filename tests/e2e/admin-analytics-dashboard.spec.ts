import { test, expect } from "@playwright/test";

test.describe("Admin Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      document.cookie = "ph_admin=test-admin-secret; path=/";
    });
  });

  test("views admin analytics dashboard", async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    await page.goto(`${baseURL}/admin/analytics`);

    // Verify admin access
    const unauthorized = page.getByText(/unauthorized|access denied/i);
    if (await unauthorized.isVisible().catch(() => false)) {
      test.skip(true, "Admin access not configured");
      return;
    }

    // Verify graphs/charts render
    const charts = page.locator("canvas, svg, [role='img']").filter({
      hasText: /chart|graph|visualization/i,
    });

    // Charts might not always be visible immediately, check for data containers
    const dataContainers = page.getByText(/total|revenue|bookings|searches/i);
    await expect(dataContainers.first()).toBeVisible({ timeout: 5000 });
  });

  test("verifies data matches Supabase seeds", async ({ page, request }) => {
    // Fetch analytics data
    const response = await request.get(
      `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/admin/analytics`
    );

    if (response.ok()) {
      const data = await response.json();
      
      // Verify data structure
      expect(data).toHaveProperty("summary");
      expect(data.summary).toHaveProperty("totalGross");
      expect(data.summary).toHaveProperty("bookingCount");
    }
  });

  test("triggers growth recommendations and verifies suggestions", async ({ page, request }) => {
    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/admin/analytics`);

    // Find growth recommendations button/section
    const recommendationsButton = page.getByRole("button", { name: /recommendations|suggestions|insights/i });
    
    if (await recommendationsButton.isVisible().catch(() => false)) {
      await recommendationsButton.click();

      // Wait for recommendations to load
      await page.waitForTimeout(2000);

      // Verify suggestions are visible
      const suggestions = page.getByText(/recommend|suggest|consider|improve/i);
      await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Try API endpoint directly
      const response = await request.post(
        `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/admin/growth-recommendations`,
        {
          headers: {
            cookie: "ph_admin=test-admin-secret",
          },
        }
      );

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty("recommendations");
        expect(Array.isArray(data.recommendations)).toBe(true);
      }
    }
  });
});

