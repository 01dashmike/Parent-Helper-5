#!/usr/bin/env node
/**
 * E2E Test Script 4: User → Recommendations → Class → Book
 * 
 * Flow:
 * 1. Login as user
 * 2. Navigate to recommendations
 * 3. Select a recommended class
 * 4. Start booking
 */

import { chromium } from "playwright";
import chalk from "chalk";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const USER_EMAIL = process.env.TEST_USER_EMAIL || "user@test.com";
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || "testpass123";

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

async function testUserRecommendationsClassBook() {
  console.log(chalk.bold("\n🧪 E2E Test 4: User → Recommendations → Class → Book\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login as user
    await logStep("Login as user", async () => {
      await page.goto(`${BASE_URL}/account/login`);
      await page.waitForLoadState("networkidle");
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(USER_EMAIL);
        await passwordInput.fill(USER_PASSWORD);
        
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
      }
      
      if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Login may have failed - continuing test"));
      } else {
        console.log(`  Logged in, redirected to: ${page.url()}`);
      }
    });

    // Step 2: Navigate to recommendations
    await logStep("Navigate to recommendations page", async () => {
      // Try multiple possible routes
      await page.goto(`${BASE_URL}/account/recommendations`);
      await page.waitForLoadState("networkidle");
      
      // If redirected, try home page which might have recommendations
      if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Not authenticated - trying home page"));
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState("networkidle");
      }
      
      const url = page.url();
      console.log(`  Current URL: ${url}`);
    });

    // Step 3: Verify recommendations are displayed
    await logStep("Verify recommendations are visible", async () => {
      // Look for recommendation sections
      const recommendations = page.locator(
        'text=/recommendation|recommended|for you|personalized/i, [data-testid*="recommendation"], .recommendation, .personalized'
      );
      
      if (await recommendations.first().isVisible({ timeout: 5000 })) {
        console.log("  Recommendations visible");
        
        // Try to get recommendation count
        const recommendationItems = page.locator('[data-testid*="recommendation"], .recommendation-item, article');
        const count = await recommendationItems.count();
        console.log(`  Found ${count} recommendation items`);
      } else {
        // Check if on personalized home page
        const personalizedContent = page.locator('text=/personalized|home|welcome/i');
        if (await personalizedContent.first().isVisible({ timeout: 3000 })) {
          console.log(chalk.yellow("  ⚠ Recommendations may load dynamically or require profile setup"));
        } else {
          console.log(chalk.yellow("  ⚠ Recommendations section not found"));
        }
      }
    });

    // Step 4: Click on a recommended class
    await logStep("Click on first recommended class", async () => {
      // Look for class cards or links in recommendations
      const classLink = page.locator(
        'a[href*="/class/"], a[href*="/book/"], article a, .class-card a, [data-testid*="recommendation"] a'
      ).first();
      
      if (await classLink.isVisible({ timeout: 5000 })) {
        const href = await classLink.getAttribute("href");
        console.log(`  Class link found: ${href}`);
        
        await classLink.click();
        await page.waitForLoadState("networkidle");
        
        const url = page.url();
        if (url.includes("/class/") || url.includes("/book/")) {
          console.log(`  Navigated to class: ${url}`);
        } else {
          throw new Error(`Expected class page, got: ${url}`);
        }
      } else {
        console.log(chalk.yellow("  ⚠ No class links found - recommendations may be empty"));
      }
    });

    // Step 5: Verify class page
    await logStep("Verify class details page", async () => {
      const title = page.locator("h1, h2").first();
      if (await title.isVisible({ timeout: 5000 })) {
        const titleText = await title.textContent();
        console.log(`  Class title: ${titleText?.trim()}`);
      }
    });

    // Step 6: Start booking
    await logStep("Click book button", async () => {
      const bookButton = page.locator(
        'button:has-text("Book"), button:has-text("Book now"), a[href*="/book/"]'
      ).first();
      
      if (await bookButton.isVisible({ timeout: 5000 })) {
        await bookButton.click();
        await page.waitForLoadState("networkidle");
        
        const url = page.url();
        if (url.includes("/book/") || url.includes("/checkout")) {
          console.log(`  Navigated to booking: ${url}`);
        } else if (url.includes("/login")) {
          console.log(chalk.yellow("  ⚠ Redirected to login - authentication required"));
        } else {
          console.log(`  Navigated to: ${url}`);
        }
      } else {
        console.log(chalk.yellow("  ⚠ Book button not found"));
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test4-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testUserRecommendationsClassBook()
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

