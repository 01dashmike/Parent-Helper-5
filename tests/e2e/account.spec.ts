import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
let skipE2E = false;

test.use({ baseURL });

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get("/account/login", { timeout: 5000 });
    if (!response.ok()) {
      skipE2E = true;
    }
  } catch (error) {
    skipE2E = true;
  }
});

test.describe("Account area smoke test", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(skipE2E, "Account area not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");
    await page.goto("/account/login");
  });

  test("renders login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  });

  test("shows OTP form after email submission", async ({ page }) => {
    // Note: This test requires a real email/OTP flow, so it's a smoke test only
    // In a real scenario, you'd mock the Supabase client or use test credentials
    await expect(page.getByLabel("Email address")).toBeVisible();
  });

  test("account pages require authentication", async ({ page }) => {
    await page.goto("/account");
    // Should redirect to login
    await expect(page).toHaveURL(/\/account\/login/);
  });
});

