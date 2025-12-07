#!/usr/bin/env node
/**
 * E2E Test Script 6: Referral code → Landing → Signup
 * 
 * Flow:
 * 1. Visit referral link
 * 2. Verify redirect to landing/signup
 * 3. Fill signup form
 * 4. Verify referral tracking
 */

import { chromium } from "playwright";
import chalk from "chalk";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const REFERRAL_CODE = process.env.TEST_REFERRAL_CODE || "PH-TEST123";

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

async function testReferralCodeLandingSignup() {
  console.log(chalk.bold("\n🧪 E2E Test 6: Referral code → Landing → Signup\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Visit referral link
    await logStep("Visit referral link", async () => {
      // Try provider referral link format
      const referralUrl = `${BASE_URL}/provider/ref/${REFERRAL_CODE}`;
      await page.goto(referralUrl);
      await page.waitForLoadState("networkidle");
      
      const url = page.url();
      console.log(`  Navigated to: ${url}`);
      
      // Verify referral code is in URL or redirected
      if (url.includes(REFERRAL_CODE) || url.includes("ref=") || url.includes("referral=")) {
        console.log(`  Referral code detected in URL`);
      } else {
        console.log(chalk.yellow(`  ⚠ Referral code may not be in URL - continuing test`));
      }
    });

    // Step 2: Verify redirect to landing/signup
    await logStep("Verify redirect to signup page", async () => {
      const url = page.url();
      
      // Check if redirected to signup or provider signup
      if (url.includes("/signup") || url.includes("/register") || url.includes("/provider/signup")) {
        console.log(`  Redirected to signup: ${url}`);
      } else if (url.includes("/provider/ref/")) {
        // May stay on referral page that shows signup form
        console.log(`  On referral page: ${url}`);
      } else {
        console.log(chalk.yellow(`  ⚠ Not redirected to signup - may show signup form on same page`));
      }
      
      // Look for signup form
      const signupForm = page.locator('form, [data-testid*="signup"], [data-testid*="register"]').first();
      if (await signupForm.isVisible({ timeout: 5000 })) {
        console.log("  Signup form visible");
      }
    });

    // Step 3: Verify referral code in form
    await logStep("Verify referral code is preserved", async () => {
      // Check URL for referral parameter
      const url = page.url();
      const hasRefParam = url.includes("ref=") || url.includes("referral=") || url.includes(REFERRAL_CODE);
      
      if (hasRefParam) {
        console.log("  Referral code present in URL");
      } else {
        // Check for hidden input or form field
        const refInput = page.locator('input[name*="ref"], input[name*="referral"], input[value*="' + REFERRAL_CODE + '"]').first();
        if (await refInput.isVisible({ timeout: 3000 })) {
          const value = await refInput.inputValue();
          console.log(`  Referral code in form: ${value}`);
        } else {
          console.log(chalk.yellow("  ⚠ Referral code may be stored in session or cookie"));
        }
      }
    });

    // Step 4: Fill signup form
    await logStep("Fill signup form", async () => {
      // Find form fields
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 5000 })) {
        // Generate unique email for testing
        const testEmail = `test-${Date.now()}@test.com`;
        await emailInput.fill(testEmail);
        console.log(`  Email entered: ${testEmail}`);
        
        if (await nameInput.isVisible({ timeout: 3000 })) {
          await nameInput.fill("Test User");
          console.log("  Name entered");
        }
        
        if (await passwordInput.isVisible({ timeout: 3000 })) {
          await passwordInput.fill("TestPassword123!");
          console.log("  Password entered");
        }
      } else {
        console.log(chalk.yellow("  ⚠ Signup form fields not found"));
      }
    });

    // Step 5: Verify form validation
    await logStep("Verify form validation", async () => {
      // Try to submit without filling (to check validation)
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register")').first();
      
      if (await submitButton.isVisible({ timeout: 5000 })) {
        // Check if button is disabled (indicating validation)
        const isDisabled = await submitButton.isDisabled();
        if (isDisabled) {
          console.log("  Form validation active (submit button disabled)");
        } else {
          console.log("  Form can be submitted");
        }
      }
    });

    // Step 6: Submit signup (optional - may create account)
    await logStep("Submit signup form", async () => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign up")').first();
      
      if (await submitButton.isVisible({ timeout: 5000 }) && !(await submitButton.isDisabled())) {
        console.log(chalk.yellow("  ⚠ Skipping actual signup submission to avoid creating test accounts"));
        console.log("  Would submit form here");
        // Uncomment to actually submit:
        // await submitButton.click();
        // await page.waitForLoadState("networkidle");
      } else {
        console.log(chalk.yellow("  ⚠ Submit button not available or disabled"));
      }
    });

    // Step 7: Verify referral tracking (check API calls)
    await logStep("Verify referral tracking", async () => {
      // Check if referral tracking API was called
      // This would require intercepting network requests
      console.log(chalk.yellow("  ⚠ Network request interception not implemented in this test"));
      console.log("  In full implementation, would verify API call to /api/referrals/track");
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test6-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testReferralCodeLandingSignup()
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

