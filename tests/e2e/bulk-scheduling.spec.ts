import { test, expect } from "@playwright/test";

test.describe("Bulk Scheduling", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to provider login (adjust URL as needed)
    await page.goto("/provider/login");
    // Add login steps here if needed
  });

  test("should create Mon/Wed occurrences for 6 weeks", async ({ page }) => {
    // Navigate to a class schedule page
    await page.goto("/provider/classes/1/schedule");

    // Click "Add Repeating Schedule"
    await page.click('text="+ Add Repeating Schedule"');

    // Select Monday and Wednesday
    await page.click('button:has-text("Mon")');
    await page.click('button:has-text("Wed")');

    // Set start date (today)
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    await page.fill('input[type="date"]:nth-of-type(1)', startDate);

    // Set end date (6 weeks later)
    const sixWeeksLater = new Date(today);
    sixWeeksLater.setDate(today.getDate() + 42);
    const endDate = sixWeeksLater.toISOString().split("T")[0];
    await page.fill('input[type="date"]:nth-of-type(2)', endDate);

    // Set start time
    await page.fill('input[type="time"]', "10:00");

    // Set duration
    await page.fill('input[type="number"]:nth-of-type(1)', "60");

    // Click Preview
    await page.click('button:has-text("Preview")');

    // Verify preview shows occurrences
    await expect(page.locator('text=/\\d+ occurrence/')).toBeVisible();

    // Click Create Occurrences
    await page.click('button:has-text("Create Occurrences")');

    // Wait for success (adjust based on your implementation)
    await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 10000 });

    // Verify occurrences appear in the table
    const occurrenceRows = page.locator('tbody tr');
    await expect(occurrenceRows).toHaveCount(12); // 6 weeks * 2 days = 12 occurrences
  });

  test("should exclude dates from schedule", async ({ page }) => {
    await page.goto("/provider/classes/1/schedule");
    await page.click('text="+ Add Repeating Schedule"');

    // Select Monday
    await page.click('button:has-text("Mon")');

    // Set dates
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14);
    const endDateStr = endDate.toISOString().split("T")[0];

    await page.fill('input[type="date"]:nth-of-type(1)', startDate);
    await page.fill('input[type="date"]:nth-of-type(2)', endDateStr);

    // Add exclude date
    const excludeDate = new Date(today);
    excludeDate.setDate(today.getDate() + 7);
    const excludeDateStr = excludeDate.toISOString().split("T")[0];
    await page.fill('input[type="date"]:nth-of-type(3)', excludeDateStr);
    await page.click('button:has-text("Add")');

    // Verify exclude date appears
    await expect(page.locator(`text="${excludeDateStr}"`)).toBeVisible();

    // Set time and duration
    await page.fill('input[type="time"]', "10:00");
    await page.fill('input[type="number"]:nth-of-type(1)', "60");

    // Preview and verify excluded date is not in preview
    await page.click('button:has-text("Preview")');
    // The excluded date should not appear in the preview table
  });

  test("should prevent overlapping occurrences", async ({ page }) => {
    // This test assumes there's already an occurrence at 10:00-11:00 on a specific date
    await page.goto("/provider/classes/1/schedule");

    // Try to create overlapping occurrence
    await page.click('text="+ Add Repeating Schedule"');
    await page.click('button:has-text("Mon")');

    // Set dates to include the existing occurrence
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    await page.fill('input[type="date"]:nth-of-type(1)', startDate);
    await page.fill('input[type="date"]:nth-of-type(2)', startDate);

    await page.fill('input[type="time"]', "10:00");
    await page.fill('input[type="number"]:nth-of-type(1)', "60");

    await page.click('button:has-text("Create Occurrences")');

    // Should show error about conflicts
    await expect(page.locator('text=/conflict|overlap/i')).toBeVisible({ timeout: 5000 });
  });
});

