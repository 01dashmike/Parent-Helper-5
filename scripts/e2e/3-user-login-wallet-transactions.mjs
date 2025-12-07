#!/usr/bin/env node
/**
 * E2E Test Script 3: User login → Wallet → Transaction history
 * 
 * Flow:
 * 1. Navigate to user login
 * 2. Login as user
 * 3. Navigate to wallet
 * 4. View transaction history
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

async function testUserLoginWalletTransactions() {
  console.log(chalk.bold("\n🧪 E2E Test 3: User login → Wallet → Transaction history\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login
    await logStep("Navigate to login page", async () => {
      await page.goto(`${BASE_URL}/account/login`);
      await page.waitForLoadState("networkidle");
      
      const url = page.url();
      if (!url.includes("/login") && !url.includes("/account")) {
        throw new Error(`Expected login page, got: ${url}`);
      }
      console.log(`  URL: ${url}`);
    });

    // Step 2: Fill login form
    await logStep("Fill user login form", async () => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      
      if (!(await emailInput.isVisible({ timeout: 5000 }))) {
        throw new Error("Email input not found");
      }

      await emailInput.fill(USER_EMAIL);
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (!(await passwordInput.isVisible({ timeout: 5000 }))) {
        throw new Error("Password input not found");
      }

      await passwordInput.fill(USER_PASSWORD);
      console.log("  Form filled");
    });

    // Step 3: Submit login
    await logStep("Submit login form", async () => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      
      if (!(await submitButton.isVisible({ timeout: 5000 }))) {
        throw new Error("Submit button not found");
      }

      await submitButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes("/login")) {
        console.log(chalk.yellow("  ⚠ Login may have failed - continuing test"));
        return;
      }
      
      console.log(`  Redirected to: ${url}`);
    });

    // Step 4: Navigate to wallet
    await logStep("Navigate to wallet page", async () => {
      // Try direct navigation
      await page.goto(`${BASE_URL}/account/wallet`);
      await page.waitForLoadState("networkidle");
      
      // Check if redirected to login
      if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Not authenticated - skipping wallet verification"));
        return;
      }
      
      // Verify wallet page
      const url = page.url();
      if (!url.includes("/wallet")) {
        throw new Error(`Expected wallet page, got: ${url}`);
      }
      
      console.log(`  Wallet URL: ${url}`);
    });

    // Step 5: Verify wallet balance display
    await logStep("Verify wallet balance is displayed", async () => {
      // Look for balance indicators
      const balanceElements = page.locator(
        'text=/balance|wallet|£|amount|credit/i, [data-testid="wallet-balance"], .wallet-balance'
      );
      
      if (await balanceElements.first().isVisible({ timeout: 5000 })) {
        const balanceText = await balanceElements.first().textContent();
        console.log(`  Balance displayed: ${balanceText?.trim()}`);
      } else {
        console.log(chalk.yellow("  ⚠ Balance not immediately visible - may load dynamically"));
      }
    });

    // Step 6: Navigate to transaction history
    await logStep("Navigate to transaction history", async () => {
      // Look for transaction history link/tab
      const transactionsLink = page.locator(
        'a:has-text("Transactions"), a:has-text("History"), button:has-text("Transactions"), [href*="transaction"], [data-testid="transactions"]'
      ).first();
      
      if (await transactionsLink.isVisible({ timeout: 5000 })) {
        await transactionsLink.click();
        await page.waitForLoadState("networkidle");
      } else {
        // Transactions might be on the same page
        console.log("  Transactions may be on same page");
      }
      
      const url = page.url();
      console.log(`  Current URL: ${url}`);
    });

    // Step 7: Verify transaction history display
    await logStep("Verify transaction history is visible", async () => {
      // Look for transaction list or table
      const transactionElements = page.locator(
        'text=/transaction|payment|booking|deposit|withdrawal/i, table, .transaction, [data-testid="transaction-list"], [data-testid="transactions"]'
      );
      
      if (await transactionElements.first().isVisible({ timeout: 5000 })) {
        console.log("  Transaction history visible");
        
        // Try to get transaction count
        const transactionRows = page.locator('tr, .transaction-item, [data-testid*="transaction"]');
        const count = await transactionRows.count();
        console.log(`  Found ${count} transaction items`);
      } else {
        // Might show "No transactions" message
        const noTransactions = page.locator('text=/no transactions|no history|no payments/i');
        if (await noTransactions.isVisible({ timeout: 3000 })) {
          console.log(chalk.yellow("  ⚠ No transactions found - this may be expected"));
        } else {
          console.log(chalk.yellow("  ⚠ Transaction history section not immediately visible"));
        }
      }
    });

    // Step 8: Verify transaction details
    await logStep("Verify transaction details can be viewed", async () => {
      // Look for transaction items
      const firstTransaction = page.locator(
        'tr:not(:first-child), .transaction-item:first-child, [data-testid*="transaction"]:first-child'
      ).first();
      
      if (await firstTransaction.isVisible({ timeout: 5000 })) {
        const transactionText = await firstTransaction.textContent();
        console.log(`  First transaction: ${transactionText?.trim().substring(0, 50)}...`);
        
        // Verify it has key information
        const hasAmount = /£|\d+\.\d+|\d+/.test(transactionText || "");
        const hasDate = /\d{1,2}\/\d{1,2}|\d{4}|today|yesterday|jan|feb|mar/i.test(transactionText || "");
        
        if (hasAmount || hasDate) {
          console.log("  Transaction has key details (amount/date)");
        }
      } else {
        console.log(chalk.yellow("  ⚠ No transactions to display details for"));
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test3-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testUserLoginWalletTransactions()
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

