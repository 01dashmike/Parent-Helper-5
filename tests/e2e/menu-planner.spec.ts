import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
let skipE2E = false;

test.use({ baseURL });

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get("/tools/menu-planner", { timeout: 5000 });
    if (!response.ok()) {
      skipE2E = true;
    }
  } catch (error) {
    skipE2E = true;
  }
});

test.describe("Family menu planner", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(skipE2E, "Menu planner page not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");
    await page.goto("/tools/menu-planner");
  });

  test("generates a 7-day plan and shopping list", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Plan a balanced week of meals in minutes" }),
    ).toBeVisible();

    await page.getByLabel("Household size").fill("3");
    await page.getByLabel("Ages (optional)").fill("3, 6, 34");
    await page.getByLabel("Mediterranean").check();
    await page.getByLabel("Mexican").check();
    await page.getByLabel("Allergies or ingredients to avoid").fill("mushrooms");

    await page.getByRole("button", { name: "Generate menu plan" }).click();

    const planHeading = page.getByRole("heading", { name: "Your 7-day family menu" });
    await expect(planHeading).toBeVisible();

    await expect(page.getByText("Shopping list")).toBeVisible();
    await expect(page.getByText("Monday")).toBeVisible();
    await expect(page.getByText("Dietary disclaimer")).toBeVisible();
  });
});

