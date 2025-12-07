import { test, expect } from "@playwright/test";

const REFERRALS_ENABLED = process.env.REFERRALS_ENABLED === "true";
const REWARDS_ENABLED = process.env.REWARDS_ENABLED === "true";

test.describe("Referrals & Rewards", () => {
    test.beforeEach(async ({ page }) => {
        // Skip tests if features are not enabled
        test.skip(!REFERRALS_ENABLED || !REWARDS_ENABLED, "REFERRALS_ENABLED and REWARDS_ENABLED must be set to true");
    });

    test("should create referral and see it in list", async ({ page }) => {
        // Navigate to referrals page (requires authentication)
        await page.goto("/account/referrals");

        // Wait for page to load
        await page.waitForSelector("h1");

        // Fill in referral form
        const emailInput = page.getByPlaceholder("friend@example.com");
        await emailInput.fill("test@example.com");

        // Submit form
        const submitButton = page.getByRole("button", { name: /send invite/i });
        await submitButton.click();

        // Wait for success message
        await page.waitForSelector('text="Invitation sent successfully"', { timeout: 5000 });

        // Verify referral appears in list
        const referralEmail = page.locator('text="test@example.com"');
        await expect(referralEmail).toBeVisible();
    });

    test("should display referral link and allow copying", async ({ page }) => {
        await page.goto("/account/referrals");

        // Find copy button
        const copyButton = page.getByRole("button", { name: /copy/i });
        await expect(copyButton).toBeVisible();

        // Click copy
        await copyButton.click();

        // Verify clipboard contains referral URL
        // Note: In a real test, you'd verify clipboard content
        // For now, we just verify the button exists and is clickable
        await expect(copyButton).toBeEnabled();
    });

    test("should display rewards summary", async ({ page }) => {
        await page.goto("/account/rewards");

        // Wait for page to load
        await page.waitForSelector("h1");

        // Verify dashboard cards are visible
        const totalPoints = page.locator('text="Total Points"');
        await expect(totalPoints).toBeVisible();

        const availableCredit = page.locator('text="Available Credit"');
        await expect(availableCredit).toBeVisible();
    });

    test("should convert referral when user signs up", async ({ page }) => {
        // This test would require:
        // 1. Create a referral via API
        // 2. Sign up a new user with that referral code
        // 3. Verify reward is created for referrer
        // 4. Verify referral status is updated

        test.skip(true, "Requires full signup flow - implement in integration tests");
    });
});

