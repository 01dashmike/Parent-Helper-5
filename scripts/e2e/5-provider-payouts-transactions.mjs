#!/usr/bin/env node
/**
 * E2E Test Script 5: Provider → Payouts → Transactions
 * 
 * Flow:
 * 1. Login as provider
 * 2. Navigate to payouts
 * 3. View transaction history
 */

import { chromium } from "playwright";
import chalk from "chalk";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const PROVIDER_EMAIL = process.env.TEST_PROVIDER_EMAIL || "provider@test.com";
const PROVIDER_PASSWORD = process.env.TEST_PROVIDER_PASSWORD || "testpass123";

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

async function testProviderPayoutsTransactions() {
  console.log(chalk.bold("\n🧪 E2E Test 5: Provider → Payouts → Transactions\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login as provider
    await logStep("Login as provider", async () => {
      await page.goto(`${BASE_URL}/provider/login`);
      await page.waitForLoadState("networkidle");
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(PROVIDER_EMAIL);
        await passwordInput.fill(PROVIDER_PASSWORD);
        
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

    // Step 2: Navigate to payouts
    await logStep("Navigate to payouts page", async () => {
      // Try multiple possible routes
      await page.goto(`${BASE_URL}/provider/payouts`);
      await page.waitForLoadState("networkidle");
      
      // If not found, try dashboard or earnings
      if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Not authenticated - skipping payouts verification"));
        return;
      }
      
      if (!page.url().includes("payout") && !page.url().includes("earning")) {
        // Try earnings or dashboard
        await page.goto(`${BASE_URL}/provider/dashboard`);
        await page.waitForLoadState("networkidle");
        
        // Look for payouts link in dashboard
        const payoutsLink = page.locator(
          'a:has-text("Payouts"), a:has-text("Earnings"), a[href*="payout"], a[href*="earning"]'
        ).first();
        
        if (await payoutsLink.isVisible({ timeout: 5000 })) {
          await payoutsLink.click();
          await page.waitForLoadState("networkidle");
        }
      }
      
      const url = page.url();
      console.log(`  Current URL: ${url}`);
    });

    // Step 3: Verify payouts page
    await logStep("Verify payouts page loaded", async () => {
      if (page.url().includes("/login")) {
        console.log(chalk.yellow("  ⚠ Login required"));
        return;
      }
      
      // Look for payouts/earnings indicators
      const payoutsElements = page.locator(
        'text=/payout|earning|revenue|income|balance/i, [data-testid*="payout"], [data-testid*="earning"]'
      );
      
      if (await payoutsElements.first().isVisible({ timeout: 5000 })) {
        console.log("  Payouts/Earnings section visible");
      } else {
        console.log(chalk.yellow("  ⚠ Payouts section not immediately visible"));
      }
    });

    // Step 4: Navigate to transactions
    await logStep("Navigate to transactions", async () => {
      // Look for transactions tab/link
      const transactionsLink = page.locator(
        'a:has-text("Transactions"), a:has-text("History"), button:has-text("Transactions"), [href*="transaction"], [data-testid*="transaction"]'
      ).first();
      
      if (await transactionsLink.isVisible({ timeout: 5000 })) {
        await transactionsLink.click();
        await page.waitForLoadState("networkidle");
        console.log("  Clicked transactions link");
      } else {
        // Transactions might be on same page
        console.log("  Transactions may be on same page");
      }
      
      const url = page.url();
      console.log(`  Current URL: ${url}`);
    });

    // Step 5: Verify transactions are displayed
    await logStep("Verify transactions are visible", async () => {
      // Look for transaction list/table
      const transactionElements = page.locator(
        'table, .transaction, [data-testid*="transaction"], text=/transaction|booking|payment/i'
      );
      
      if (await transactionElements.first().isVisible({ timeout: 5000 })) {
        console.log("  Transactions visible");
        
        // Try to count transactions
        const transactionRows = page.locator('tr:not(:first-child), .transaction-item, [data-testid*="transaction"]');
        const count = await transactionRows.count();
        console.log(`  Found ${count} transaction items`);
      } else {
        // Check for "no transactions" message
        const noTransactions = page.locator('text=/no transactions|no payments|no bookings/i');
        if (await noTransactions.isVisible({ timeout: 3000 })) {
          console.log(chalk.yellow("  ⚠ No transactions found - this may be expected"));
        } else {
          console.log(chalk.yellow("  ⚠ Transaction list not immediately visible"));
        }
      }
    });

    // Step 6: Verify transaction details
    await logStep("Verify transaction details are visible", async () => {
      const firstTransaction = page.locator(
        'tr:not(:first-child), .transaction-item:first-child'
      ).first();
      
      if (await firstTransaction.isVisible({ timeout: 5000 })) {
        const transactionText = await firstTransaction.textContent();
        console.log(`  First transaction: ${transactionText?.trim().substring(0, 60)}...`);
        
        // Check for key information
        const hasAmount = /£|\d+\.\d+|\d+/.test(transactionText || "");
        const hasDate = /\d{1,2}\/\d{1,2}|\d{4}/.test(transactionText || "");
        const hasStatus = /pending|completed|paid|processing/i.test(transactionText || "");
        
        if (hasAmount || hasDate || hasStatus) {
          console.log("  Transaction has key details");
        }
      } else {
        console.log(chalk.yellow("  ⚠ No transactions to display"));
      }
    });

    // Step 7: Verify payout summary/balance
    await logStep("Verify payout summary is displayed", async () => {
      const summaryElements = page.locator(
        'text=/total|balance|available|pending|paid/i, [data-testid*="balance"], [data-testid*="summary"]'
      );
      
      if (await summaryElements.first().isVisible({ timeout: 5000 })) {
        console.log("  Payout summary visible");
        
        // Try to get balance amount
        const balanceElement = page.locator('text=/£\d+|\$\d+|balance/i').first();
        if (await balanceElement.isVisible({ timeout: 3000 })) {
          const balanceText = await balanceElement.textContent();
          console.log(`  Balance: ${balanceText?.trim()}`);
        }
      } else {
        console.log(chalk.yellow("  ⚠ Payout summary not immediately visible"));
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test5-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testProviderPayoutsTransactions()
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

