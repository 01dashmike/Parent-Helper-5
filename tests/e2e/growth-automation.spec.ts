import { test, expect } from "@playwright/test";

test.describe("Growth Automation Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Set admin cookie (in real scenario, would login properly)
    await page.context().addCookies([
      {
        name: "ph_admin",
        value: process.env.ADMIN_SECRET || "test-secret",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("should load automation dashboard", async ({ page }) => {
    await page.goto("/admin/automation");
    await expect(page.locator("h1")).toContainText("Growth Automation Control Center");
  });

  test("should display tabs", async ({ page }) => {
    await page.goto("/admin/automation");
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=AI Insights")).toBeVisible();
    await expect(page.locator("text=Provider Reports")).toBeVisible();
    await expect(page.locator("text=AI Coach")).toBeVisible();
    await expect(page.locator("text=Settings")).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await page.goto("/admin/automation");
    await page.click("text=AI Insights");
    await expect(page.locator("text=AI Growth Insights")).toBeVisible();
  });

  test("should toggle feature flags", async ({ page }) => {
    await page.goto("/admin/automation");
    await page.click("text=Settings");
    
    // Find and toggle a feature flag
    const toggle = page.locator('input[type="checkbox"]').first();
    const initialState = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toHaveProperty("checked", !initialState);
  });

  test("should display forecast summary", async ({ page }) => {
    await page.goto("/admin/automation");
    await expect(page.locator("text=AI Growth Forecast")).toBeVisible();
  });
});

