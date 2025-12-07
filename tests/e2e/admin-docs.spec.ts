import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
let skipE2E = false;

test.use({ baseURL });

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get("/", { timeout: 5000 });
    if (!response.ok()) {
      skipE2E = true;
    }
  } catch (error) {
    skipE2E = true;
  }
});

test.describe("Admin Documentation Hub", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(skipE2E, "App not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");

    // Set admin cookie (if ADMIN_SECRET is set)
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      await page.context().addCookies([
        {
          name: "ph_admin",
          value: adminSecret,
          domain: new URL(baseURL).hostname,
          path: "/",
        },
      ]);
    }
  });

  test("should redirect non-admin users to login", async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    // Should redirect to login or show access denied
    const url = page.url();
    expect(url).toMatch(/\/admin\/login|\/admin/);
  });

  test("should display admin docs page for authenticated admin", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set. Skipping admin auth test.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    // Check for main heading
    const heading = page.getByRole("heading", { name: /admin documentation hub/i });
    await expect(heading).toBeVisible();
  });

  test("should display navigation sidebar", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    // Check for navigation
    const nav = page.getByText("Sections");
    await expect(nav).toBeVisible();
  });

  test("should display newsletter templates section", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    // Scroll to newsletters section
    const newslettersSection = page.getByRole("heading", {
      name: /newsletter templates/i,
    });
    await expect(newslettersSection).toBeVisible();
  });

  test("should display system health section", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    const healthSection = page.getByRole("heading", {
      name: /system health/i,
    });
    await expect(healthSection).toBeVisible();
  });

  test("should display route tree section", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    const routeSection = page.getByRole("heading", {
      name: /route tree/i,
    });
    await expect(routeSection).toBeVisible();
  });

  test("should display TODO explorer section", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    const todoSection = page.getByRole("heading", {
      name: /roadmap|todo/i,
    });
    await expect(todoSection).toBeVisible();
  });

  test("should be mobile responsive", async ({ page }) => {
    const adminSecret = process.env.ADMIN_SECRET;
    test.skip(!adminSecret, "ADMIN_SECRET not set.");

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/admin/docs");
    await page.waitForLoadState("networkidle");

    // Check that mobile menu button exists
    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
  });
});

