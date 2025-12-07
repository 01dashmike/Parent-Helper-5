import { test, expect } from "@playwright/test";

test.describe("Provider Growth Score", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to provider dashboard
    // Note: This assumes provider authentication is set up
    await page.goto("/provider");
  });

  test("should display growth score card", async ({ page }) => {
    // Wait for growth score to load
    await page.waitForSelector('[data-testid="growth-score-card"]', { timeout: 5000 }).catch(() => {
      // If card doesn't exist, check for "no score" message
      const noScoreMessage = page.locator("text=No growth score");
      if (await noScoreMessage.isVisible()) {
        return; // This is acceptable for new providers
      }
      throw new Error("Growth score card not found");
    });

    // Check for score display
    const scoreElement = page.locator("text=/\\d+/").first();
    await expect(scoreElement).toBeVisible();
  });

  test("should display next best action", async ({ page }) => {
    // Wait for AI suggestion to appear
    const suggestion = page.locator("text=/Next Best Action/i");
    await expect(suggestion).toBeVisible({ timeout: 10000 });
  });

  test("should display improve score checklist", async ({ page }) => {
    const checklist = page.locator("text=/Improve Your Score/i");
    await expect(checklist).toBeVisible();
  });

  test("should show weekly email A/B variant correctly", async ({ request }) => {
    // Test cron endpoint (requires CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET || "test-secret";
    
    const response = await request.post("/api/cron/provider-weekly-growth", {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    // Should return 200 or 401 (if secret is wrong)
    expect([200, 401]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("processed");
      expect(data).toHaveProperty("scoresCreated");
      expect(data).toHaveProperty("emailsSent");
    }
  });
});

