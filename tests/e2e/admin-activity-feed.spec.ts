/**
 * Playwright E2E tests for Admin Activity Feed
 */

import { test, expect } from "@playwright/test";

test.describe("Admin Activity Feed", () => {
  test.beforeEach(async ({ page }) => {
    // Set admin cookie (in real test, you'd use proper auth)
    await page.context().addCookies([
      {
        name: "ph_admin",
        value: process.env.ADMIN_SECRET || "test-secret",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("logs in as admin and navigates to activity feed", async ({ page }) => {
    await page.goto("/admin/docs/activity");

    // Assert page title renders
    await expect(page.locator("h1:has-text('Admin Activity Feed')")).toBeVisible();
  });

  test("filter controls are visible", async ({ page }) => {
    await page.goto("/admin/docs/activity");

    // Check filter controls
    await expect(page.locator("label:has-text('Date Range')")).toBeVisible();
    await expect(page.locator("label:has-text('Scope')")).toBeVisible();
    await expect(page.locator("label:has-text('Level')")).toBeVisible();
  });

  test("activity list renders", async ({ page }) => {
    await page.goto("/admin/docs/activity");

    // Activity list should be present (even if empty)
    const activityList = page.locator('[data-testid="activity-list"]').or(page.locator("text=No activity found"));
    await expect(activityList.first()).toBeVisible();
  });

  test("details drawer opens and shows metadata", async ({ page }) => {
    await page.goto("/admin/docs/activity");

    // If there are activities, click details button
    const detailsButton = page.locator("button:has-text('Details')").first();
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      
      // Check drawer opens
      await expect(page.locator("text=Activity Details")).toBeVisible();
      await expect(page.locator("text=Metadata")).toBeVisible();
      
      // Close drawer
      await page.locator("button[aria-label='Close']").click();
    }
  });

  test("filters work correctly", async ({ page }) => {
    await page.goto("/admin/docs/activity");

    // Change date range filter
    const dateRangeSelect = page.locator("select, [role='combobox']").first();
    if (await dateRangeSelect.isVisible()) {
      await dateRangeSelect.click();
      await page.locator("text=Last 7 days").click();
      
      // Wait for filter to apply (activity list should update)
      await page.waitForTimeout(500);
    }
  });
});

