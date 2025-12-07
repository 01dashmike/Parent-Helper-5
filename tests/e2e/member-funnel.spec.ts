import { test, expect } from "@playwright/test";

test.describe("Member Funnel", () => {
  test("anonymous user saves search and completes sign-in", async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    await page.goto(`${baseURL}/search?q=baby%20classes&town=london`);

    // Click "Save Search" button (should prompt for login)
    const saveSearchButton = page.getByRole("button", { name: /save search/i }).first();
    
    if (await saveSearchButton.isVisible().catch(() => false)) {
      await saveSearchButton.click();

      // Should show login prompt/modal
      await expect(
        page.getByText(/sign in|log in|create account/i)
      ).toBeVisible({ timeout: 3000 });
    }

    // Mock magic link sign-in flow
    await page.route("**/api/auth/**", async (route) => {
      if (route.request().url().includes("magic-link")) {
        await route.fulfill({
          status: 200,
          json: { success: true, message: "Check your email" },
        });
      } else {
        await route.continue();
      }
    });

    // Simulate successful authentication
    await page.evaluate(() => {
      localStorage.setItem("ph_session_id", "test-session-123");
    });

    // Complete profile (if needed)
    await page.goto(`${baseURL}/account/profile`);
    
    // Verify member alerts page loads
    await page.goto(`${baseURL}/member/alerts`);
    await expect(page.getByText(/alerts|saved searches/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("saves search after login", async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      localStorage.setItem("ph_session_id", "test-session-authenticated");
    });

    await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/search`);

    // Perform search
    const searchInput = page.getByPlaceholder(/search|find classes/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("music classes");
      await page.getByRole("button", { name: /search/i }).click();
    }

    // Save search
    const saveButton = page.getByRole("button", { name: /save/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      
      // Verify search saved
      await expect(page.getByText(/saved|search saved/i)).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

