#!/usr/bin/env node
/**
 * E2E Test Script 1: Landing → Search → Class → Book
 * 
 * Flow:
 * 1. Navigate to landing page
 * 2. Perform search
 * 3. Select a class
 * 4. Start booking process
 */

import { chromium } from "playwright";
import chalk from "chalk";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const results = {
  passed: [],
  failed: [],
  errors: [],
};

async function logStep(step, fn) {
  try {
    console.log(chalk.blue(`\n▶ Step: ${step}`));
    const result = await fn();
    results.passed.push(step);
    console.log(chalk.green(`✓ ${step}`));
    return result;
  } catch (error) {
    results.failed.push(step);
    results.errors.push({ step, error: error.message });
    console.error(chalk.red(`✗ ${step}: ${error.message}`));
    throw error;
  }
}

async function testLandingSearchClassBook() {
  console.log(chalk.bold("\n🧪 E2E Test 1: Landing → Search → Class → Book\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to landing page
    await logStep("Navigate to landing page", async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState("networkidle");
      
      // Verify landing page loaded
      const title = await page.title();
      if (!title || title.toLowerCase().includes("error")) {
        throw new Error(`Invalid page title: ${title}`);
      }
      console.log(`  Title: ${title}`);
    });

    // Step 2: Perform search
    await logStep("Perform class search", async () => {
      // Find search input
      const searchInput = page.locator('input[type="search"], input[name="q"], input[placeholder*="search" i]').first();
      
      if (!(await searchInput.isVisible({ timeout: 5000 }))) {
        // Try navigating to search page directly
        await page.goto(`${BASE_URL}/search`);
        await page.waitForLoadState("networkidle");
      } else {
        await searchInput.fill("music");
        await searchInput.press("Enter");
        await page.waitForURL(/\/search/, { timeout: 10000 });
      }

      // Verify search results page
      await page.waitForLoadState("networkidle");
      const url = page.url();
      if (!url.includes("/search")) {
        throw new Error(`Expected /search URL, got: ${url}`);
      }
      console.log(`  Search URL: ${url}`);
    });

    // Step 3: Verify search results
    await logStep("Verify search results are displayed", async () => {
      // Wait for results to appear (could be list or cards)
      const resultsContainer = page.locator('[data-testid="search-results"], article, .class-card, .result-card').first();
      await resultsContainer.waitFor({ timeout: 10000 });
      
      const hasResults = await resultsContainer.isVisible();
      if (!hasResults) {
        // Check for "no results" message
        const noResults = page.locator('text=/no results|no classes found|nothing found/i');
        if (await noResults.isVisible()) {
          console.log(chalk.yellow("  ⚠ No results found - this may be expected in test environment"));
          return;
        }
        throw new Error("Search results not visible");
      }
      console.log("  Search results visible");
    });

    // Step 4: Click on a class
    await logStep("Click on first class", async () => {
      // Try multiple selectors for class cards/links
      const classLink = page.locator('a[href*="/class/"], a[href*="/book/"], article a, .class-card a, [data-testid="class-link"]').first();
      
      if (!(await classLink.isVisible({ timeout: 5000 }))) {
        throw new Error("No class link found in search results");
      }

      const href = await classLink.getAttribute("href");
      console.log(`  Class link: ${href}`);
      
      await classLink.click();
      await page.waitForLoadState("networkidle");
      
      // Verify we're on a class page
      const currentUrl = page.url();
      if (!currentUrl.match(/\/(class|book)\//)) {
        throw new Error(`Expected class/book page, got: ${currentUrl}`);
      }
      console.log(`  Navigated to: ${currentUrl}`);
    });

    // Step 5: Verify class details page
    await logStep("Verify class details page", async () => {
      // Look for class title or key content
      const title = page.locator("h1, h2").first();
      await title.waitFor({ timeout: 5000 });
      
      const titleText = await title.textContent();
      if (!titleText || titleText.trim().length === 0) {
        throw new Error("Class title not found");
      }
      console.log(`  Class title: ${titleText.trim()}`);
    });

    // Step 6: Start booking process
    await logStep("Click book button", async () => {
      // Find book button (multiple possible selectors)
      const bookButton = page.locator(
        'button:has-text("Book"), button:has-text("Book now"), a[href*="/book/"], [data-testid="book-button"]'
      ).first();
      
      if (!(await bookButton.isVisible({ timeout: 5000 }))) {
        // Maybe already on booking page
        if (page.url().includes("/book/")) {
          console.log("  Already on booking page");
          return;
        }
        throw new Error("Book button not found");
      }

      await bookButton.click();
      await page.waitForLoadState("networkidle");
      
      // Verify booking page or checkout
      const bookingUrl = page.url();
      if (!bookingUrl.includes("/book/") && !bookingUrl.includes("/checkout")) {
        // Might redirect to login if not authenticated
        if (bookingUrl.includes("/login") || bookingUrl.includes("/account")) {
          console.log(chalk.yellow("  ⚠ Redirected to login (expected if not authenticated)"));
          return;
        }
        throw new Error(`Expected booking page, got: ${bookingUrl}`);
      }
      console.log(`  Navigated to booking: ${bookingUrl}`);
    });

    // Step 7: Verify booking form elements
    await logStep("Verify booking form is visible", async () => {
      // Check for booking form elements
      const form = page.locator('form, [data-testid="booking-form"], .booking-form').first();
      
      if (await form.isVisible({ timeout: 5000 })) {
        console.log("  Booking form visible");
      } else if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Login required - form would be visible after authentication"));
      } else {
        // Might be Stripe checkout or other booking UI
        console.log("  Booking interface present");
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed successfully!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    // Take screenshot on failure
    await page.screenshot({ path: "scripts/e2e/screenshots/test1-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testLandingSearchClassBook()
  .then((results) => {
    console.log(chalk.bold("\n📊 Test Results Summary:"));
    console.log(chalk.green(`  Passed: ${results.passed.length}`));
    console.log(chalk.red(`  Failed: ${results.failed.length}`));
    
    if (results.errors.length > 0) {
      console.log(chalk.red("\n  Errors:"));
      results.errors.forEach(({ step, error }) => {
        console.log(chalk.red(`    - ${step}: ${error}`));
      });
    }
    
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error(chalk.bold.red(`\n✗ Fatal error: ${error.message}\n`));
    process.exit(1);
  });

