import { expect, test } from "@playwright/test";
import { CATEGORY_OPTIONS, HEAR_ABOUT_OPTIONS } from "../../app/onboarding/constants";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
let skipE2E = false;

test.use({ baseURL });

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get("/onboarding", { timeout: 5000 });
    if (!response.ok()) {
      skipE2E = true;
    }
  } catch (error) {
    skipE2E = true;
  }
});

test.describe("Provider onboarding experience", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(skipE2E, "Onboarding page not reachable. Start the app or set PLAYWRIGHT_BASE_URL.");
    await page.goto("/onboarding");
  });

  test("renders hero section with CTAs", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Get discovered by local parents and fill your classes",
      })
    ).toBeVisible();

    const registerButton = page.getByRole("link", { name: "Register your business" });
    await expect(registerButton).toHaveAttribute("href", "#provider-form");

    const learnButton = page.getByRole("link", { name: "Learn how it works" });
    await expect(learnButton).toHaveAttribute("href", "#how-it-works");
  });

  test("lists value cards and how-it-works steps", async ({ page }) => {
    const valueCards = page.locator("section", { hasText: "More bookings" }).locator("article");
    await expect(valueCards).toHaveCount(3);

    const steps = [
      "Tell us about your business",
      "Add your classes",
      "Reach local parents",
    ];

    for (const step of steps) {
      await expect(page.getByRole("heading", { name: step })).toBeVisible();
    }
  });

  test("provider form exposes all critical fields", async ({ page }) => {
    const fieldLabels = [
      "Your name",
      "Email",
      "Phone (optional)",
      "Business or brand name",
      "Website or social link",
      "Postcode",
      "Town or city",
      "Additional message",
    ];

    for (const label of fieldLabels) {
      await expect(page.getByLabel(label)).toBeVisible();
    }

    for (const category of CATEGORY_OPTIONS) {
      await expect(page.getByLabel(category)).toBeVisible();
    }

    const hearAboutOptions = HEAR_ABOUT_OPTIONS.filter(Boolean) as string[];
    const select = page.getByLabel("How did you hear about us?");
    for (const option of hearAboutOptions) {
      await expect(select).toContainText(option);
    }

    await expect(
      page.getByLabel(
        "I agree to the Parent Helper privacy policy and consent to being contacted about my listing."
      )
    ).toBeVisible();
  });

  test("shows FAQ answers and final CTA", async ({ page }) => {
    const faqs = [
      "How much does it cost to join?",
      "Who can register?",
      "How long does approval take?",
      "Can I update my details later?",
    ];

    for (const question of faqs) {
      await expect(page.getByRole("heading", { name: question })).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Start for free today" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register now" })).toHaveAttribute("href", "#provider-form");
  });
});


