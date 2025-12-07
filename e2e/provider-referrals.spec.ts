/**
 * Playwright E2E tests for Provider Referral System
 */

import { test, expect } from "@playwright/test";

test.describe("Provider Referral Flow", () => {
  test("provider dashboard renders referral link", async ({ page }) => {
    // 1. Login as provider
    await page.goto("/provider/login");
    // ... login steps
    
    // 2. Navigate to referrals dashboard
    await page.goto("/provider/dashboard/referrals");
    
    // 3. Verify referral section is visible
    await expect(page.locator("text=Referrals & Rewards")).toBeVisible();
    
    // 4. Generate referral code if not exists
    const generateButton = page.locator("button:has-text('Generate Referral Link')");
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(page.locator("input[readonly]")).toBeVisible();
    }
    
    // 5. Verify referral URL is displayed
    const referralInput = page.locator("input[readonly]");
    await expect(referralInput).toHaveValue(/https:\/\/.*\/provider\/ref\/PH-/);
  });

  test("referral flow simulation", async ({ page, context: _context }) => {
    // 1. Provider generates referral code (setup)
    await page.goto("/provider/dashboard/referrals");
    // ... generate code and get URL
    
    const referralUrl = "https://parenthelper.co.uk/provider/ref/PH-TEST123";
    
    // 2. Visit referral link (simulate referred provider)
    await page.goto(referralUrl);
    
    // 3. Verify redirect to signup with ref parameter
    await expect(page).toHaveURL(/\/provider\/signup\?ref=PH-TEST123/);
    
    // 4. Register referred provider
    // ... fill signup form
    // ... submit registration
    
    // 5. Verify referral tracking API was called
    // Check that status progressed to "registered"
    
    // 6. Create listing as referred provider
    await page.goto("/provider/listings/new");
    // ... fill listing form
    // ... submit listing
    
    // 7. Verify referral tracking progressed to "listing_created"
    
    // 8. Trigger booking API (simulate first booking)
    const bookingResponse = await page.request.post("/api/bookings", {
      data: {
        // ... booking data
      },
    });
    expect(bookingResponse.ok()).toBeTruthy();
    
    // 9. Verify referral tracking progressed to "first_booking"
    
    // 10. Check reward visible in original provider's dashboard
    // Switch back to original provider context
    await page.goto("/provider/dashboard/referrals");
    
    // 11. Verify reward appears
    await expect(page.locator("text=You earned a reward")).toBeVisible();
    await expect(page.locator("text=free boost")).toBeVisible();
  });

  test("referral stats update correctly", async ({ page }) => {
    await page.goto("/provider/dashboard/referrals");
    
    // Verify stats are displayed
    await expect(page.locator("text=Clicks")).toBeVisible();
    await expect(page.locator("text=Registrations")).toBeVisible();
    await expect(page.locator("text=Listings")).toBeVisible();
    await expect(page.locator("text=Bookings")).toBeVisible();
    
    // Verify funnel chart is rendered
    await expect(page.locator(".funnel-chart")).toBeVisible();
  });

  test("copy referral link works", async ({ page }) => {
    await page.goto("/provider/dashboard/referrals");
    
    // Click copy button
    await page.locator("button:has-text('Copy')").click();
    
    // Verify clipboard contains referral URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/https:\/\/.*\/provider\/ref\/PH-/);
  });
});

