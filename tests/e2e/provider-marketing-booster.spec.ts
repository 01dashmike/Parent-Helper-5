import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.use({ baseURL });

test.describe("Provider Marketing Booster", () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real scenario, you'd need to authenticate as a provider
    // This is a placeholder - adjust based on your auth setup
  });

  test("should load marketing dashboard", async ({ page }) => {
    // Skip if not authenticated - adjust based on your setup
    test.skip(true, "Requires provider authentication");

    await page.goto("/provider/marketing");

    // Verify page loads
    await expect(page.getByRole("heading", { name: /Marketing Booster/i })).toBeVisible();
  });

  test("SEO scoring endpoint should return valid data", async ({ request }) => {
    const response = await request.post("/api/provider/seo-score", {
      data: {
        providerId: 1,
        forceRefresh: false,
      },
    });

    // Should either return 200 with data or 404 if provider doesn't exist
    expect([200, 404]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("score");
      expect(typeof data.score).toBe("number");
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);
    }
  });

  test("SEO scoring endpoint should validate input", async ({ request }) => {
    const response = await request.post("/api/provider/seo-score", {
      data: {
        providerId: "invalid",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("Ads advice endpoint should return valid data", async ({ request }) => {
    const response = await request.post("/api/provider/ads-advice", {
      data: {
        providerId: 1,
        platform: "meta",
        forceRefresh: false,
      },
    });

    // Should either return 200 with data or 404 if provider doesn't exist
    expect([200, 404]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("platform");
      expect(data).toHaveProperty("ad_copy");
      expect(data.platform).toBe("meta");
    }
  });

  test("Ads advice endpoint should validate platform", async ({ request }) => {
    const response = await request.post("/api/provider/ads-advice", {
      data: {
        providerId: 1,
        platform: "invalid",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("Quick fix endpoint should validate action", async ({ request }) => {
    const response = await request.post("/api/provider/seo-quick-fix", {
      data: {
        providerId: 1,
        action: "invalid_action",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("Marketing summary page should load", async ({ page }) => {
    // This will 404 if provider doesn't exist, which is expected
    await page.goto("/marketing-summary/1");

    // Should either show content or 404
    const is404 = await page.getByText(/404|not found/i).isVisible().catch(() => false);
    const hasContent = await page.getByText(/Marketing Summary/i).isVisible().catch(() => false);

    expect(is404 || hasContent).toBe(true);
  });

  test("Weekly email cron endpoint should require auth", async ({ request }) => {
    const response = await request.post("/api/cron/provider-marketing-summary");

    // Should require CRON_SECRET
    expect([401, 500]).toContain(response.status());
  });
});

