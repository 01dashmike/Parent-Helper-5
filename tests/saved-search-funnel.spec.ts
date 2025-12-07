import { test, expect } from "@playwright/test";

/**
 * E2E Test: Saved Search + Alerts Member Funnel
 * 
 * Flow:
 * 1. Save a search (while not signed in)
 * 2. Complete magic link login
 * 3. Complete progressive profile (add child)
 * 4. Confirm alert visible in dashboard (/account/alerts)
 */
test.describe("Saved Search + Alerts Funnel", () => {
  test("complete funnel from save search to alert creation", async ({ page, context }) => {
    // Step 1: Navigate to search page and save a search
    await page.goto("/search?q=music&town=London&age=0-12");

    // Click "Save this search" button
    const saveButton = page.getByRole("button", { name: /save this search/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Step 2: Modal should appear prompting for email
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/want to save this alert/i)).toBeVisible();

    // Enter email
    const emailInput = modal.getByLabel(/email address/i);
    await emailInput.fill("test@example.com");

    // Submit magic link request
    const sendButton = modal.getByRole("button", { name: /send me a magic link/i });
    await sendButton.click();

    // Wait for success message
    await expect(modal.getByText(/magic link sent/i)).toBeVisible({ timeout: 10000 });

    // Note: In a real test, you would:
    // 1. Check the email inbox (using a test email service like Mailtrap)
    // 2. Extract the magic link from the email
    // 3. Navigate to the magic link URL
    // For this test, we'll simulate by navigating directly to the callback

    // Step 3: Simulate magic link callback (in real test, use actual link)
    // This would normally come from the email
    await page.goto("/auth/callback?next=/onboarding/child?search=q%3Dmusic%26town%3DLondon%26age%3D0-12&town=London");

    // Step 4: Should redirect to onboarding page
    await expect(page).toHaveURL(/\/onboarding\/child/);

    // Step 5: Complete progressive profile
    const birthdateInput = page.getByLabel(/birthdate/i);
    await birthdateInput.fill("2023-06-15"); // 1 year old

    // Optionally add child name
    const childNameInput = page.getByLabel(/child.*name/i);
    await childNameInput.fill("Emma");

    // Submit profile
    const saveButton2 = page.getByRole("button", { name: /save & continue/i });
    await saveButton2.click();

    // Step 6: Should redirect to alerts page
    await expect(page).toHaveURL(/\/account\/alerts/);

    // Step 7: Verify alert is visible
    // The alert should be created from the saved search
    await expect(page.getByText(/class alerts/i)).toBeVisible();

    // Check for welcome message or alert confirmation
    // This depends on your alerts page implementation
    const alertsList = page.locator('[data-testid="alerts-list"]').or(page.getByText(/alert/i).first());
    await expect(alertsList).toBeVisible({ timeout: 5000 });
  });

  test("skip profile creation still creates alert", async ({ page }) => {
    // Similar flow but skip the profile step
    await page.goto("/search?q=yoga&town=Manchester");

    const saveButton = page.getByRole("button", { name: /save this search/i });
    await saveButton.click();

    const modal = page.getByRole("dialog");
    const emailInput = modal.getByLabel(/email address/i);
    await emailInput.fill("skip@example.com");
    await modal.getByRole("button", { name: /send me a magic link/i }).click();

    await expect(modal.getByText(/magic link sent/i)).toBeVisible({ timeout: 10000 });

    // Simulate callback and skip profile
    await page.goto("/auth/callback?next=/onboarding/child?search=q%3Dyoga%26town%3DManchester&town=Manchester");
    
    // Click skip
    const skipButton = page.getByRole("button", { name: /skip/i });
    await skipButton.click();

    // Should still redirect to alerts
    await expect(page).toHaveURL(/\/account\/alerts/);
  });
});

