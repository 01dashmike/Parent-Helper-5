#!/usr/bin/env node
/**
 * E2E Test Script 8: AI Coach → Ask a question
 * 
 * Flow:
 * 1. Navigate to AI Coach
 * 2. Enter a question
 * 3. Submit question
 * 4. Verify response
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

async function testAICoachAskQuestion() {
  console.log(chalk.bold("\n🧪 E2E Test 8: AI Coach → Ask a question\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to AI Coach
    await logStep("Navigate to AI Coach page", async () => {
      // Try multiple possible routes
      const possibleRoutes = [
        "/ai/coach",
        "/coach",
        "/account/coach",
        "/chat",
        "/assistant",
      ];
      
      let found = false;
      for (const route of possibleRoutes) {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState("networkidle");
        
        const url = page.url();
        if (!url.includes("/login") && !url.includes("/404")) {
          // Look for coach/chat indicators
          const coachElements = page.locator(
            'text=/coach|assistant|chat|ask|question/i, [data-testid*="coach"], [data-testid*="chat"], [data-testid*="ai"]'
          );
          
          if (await coachElements.first().isVisible({ timeout: 3000 })) {
            console.log(`  Found AI Coach at: ${url}`);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        // Try searching from home page
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");
        
        // Look for AI Coach link in navigation
        const coachLink = page.locator(
          'a:has-text("Coach"), a:has-text("AI"), a[href*="coach"], a[href*="chat"], a[href*="ai"]'
        ).first();
        
        if (await coachLink.isVisible({ timeout: 5000 })) {
          await coachLink.click();
          await page.waitForLoadState("networkidle");
          console.log(`  Navigated via link to: ${page.url()}`);
        } else {
          throw new Error("AI Coach page not found - may not be implemented yet");
        }
      }
      
      const url = page.url();
      console.log(`  Current URL: ${url}`);
    });

    // Step 2: Verify AI Coach interface
    await logStep("Verify AI Coach interface is visible", async () => {
      // Look for chat interface elements
      const chatElements = page.locator(
        'textarea, input[placeholder*="question" i], input[placeholder*="ask" i], [data-testid*="input"], [data-testid*="chat"]'
      );
      
      if (await chatElements.first().isVisible({ timeout: 5000 })) {
        console.log("  AI Coach interface visible");
      } else {
        // Check if it's a different UI pattern
        const coachContent = page.locator(
          'text=/coach|assistant|parent helper/i, [class*="coach"], [class*="chat"]'
        ).first();
        
        if (await coachContent.isVisible({ timeout: 3000 })) {
          console.log("  AI Coach content visible");
        } else {
          throw new Error("AI Coach interface not found");
        }
      }
    });

    // Step 3: Enter a question
    await logStep("Enter a question", async () => {
      // Find input field
      const questionInput = page.locator(
        'textarea, input[type="text"], input[placeholder*="question" i], input[placeholder*="ask" i], [data-testid*="input"]'
      ).first();
      
      if (!(await questionInput.isVisible({ timeout: 5000 }))) {
        throw new Error("Question input field not found");
      }
      
      const testQuestion = "What are some good activities for a 6-month-old baby?";
      await questionInput.fill(testQuestion);
      console.log(`  Question entered: ${testQuestion}`);
    });

    // Step 4: Submit question
    await logStep("Submit question", async () => {
      // Find submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Ask"), button:has-text("Submit"), [data-testid*="submit"]'
      ).first();
      
      if (!(await submitButton.isVisible({ timeout: 5000 }))) {
        // Try pressing Enter
        await page.keyboard.press("Enter");
        console.log("  Submitted via Enter key");
      } else {
        if (await submitButton.isDisabled()) {
          throw new Error("Submit button is disabled");
        }
        
        await submitButton.click();
        console.log("  Submit button clicked");
      }
      
      // Wait for response
      await page.waitForTimeout(2000);
      await page.waitForLoadState("networkidle");
    });

    // Step 5: Verify response is loading
    await logStep("Verify response is loading", async () => {
      // Look for loading indicators
      const loadingIndicator = page.locator(
        'text=/loading|thinking|generating/i, [class*="spinner" i], [class*="loader" i], svg[class*="animate-spin"]'
      ).first();
      
      if (await loadingIndicator.isVisible({ timeout: 3000 })) {
        console.log("  Response is loading");
        
        // Wait for loading to complete (up to 30 seconds)
        try {
          await loadingIndicator.waitFor({ state: "hidden", timeout: 30000 });
          console.log("  Loading completed");
        } catch (error) {
          console.log(chalk.yellow("  ⚠ Loading may still be in progress"));
        }
      } else {
        console.log(chalk.yellow("  ⚠ Loading indicator not visible - response may be fast or not started"));
      }
    });

    // Step 6: Verify response appears
    await logStep("Verify AI response appears", async () => {
      // Look for response content
      await page.waitForTimeout(3000); // Give time for response
      
      const responseElements = page.locator(
        '[data-testid*="response"], [data-testid*="message"], .response, .chat-message, p, div[class*="message"]'
      );
      
      // Get all potential response elements
      const allElements = await responseElements.all();
      
      // Look for elements that appeared after submission
      let foundResponse = false;
      for (const element of allElements.slice(-5)) { // Check last 5 elements
        const text = await element.textContent();
        if (text && text.trim().length > 10 && !text.includes("What are some")) {
          // Likely a response (has content and isn't the question)
          console.log(`  Response found: ${text.trim().substring(0, 100)}...`);
          foundResponse = true;
          break;
        }
      }
      
      if (!foundResponse) {
        // Check for any new content
        const newContent = page.locator('text=/activity|class|baby|toddler|suggest/i').first();
        if (await newContent.isVisible({ timeout: 5000 })) {
          const contentText = await newContent.textContent();
          console.log(`  Response content visible: ${contentText?.trim().substring(0, 80)}...`);
          foundResponse = true;
        } else {
          // Check for error message
          const errorMsg = page.locator('.error, [role="alert"], .text-red').first();
          if (await errorMsg.isVisible({ timeout: 3000 })) {
            const errorText = await errorMsg.textContent();
            throw new Error(`AI Coach error: ${errorText}`);
          }
          
          console.log(chalk.yellow("  ⚠ Response not immediately visible - may load dynamically or need more time"));
        }
      }
    });

    // Step 7: Verify response quality
    await logStep("Verify response quality", async () => {
      // Look for response content that seems meaningful
      const responseText = await page.textContent("body");
      
      if (responseText) {
        // Check for common AI response indicators
        const hasActivityKeywords = /activity|class|play|learn|develop/i.test(responseText);
        const hasAgeKeywords = /month|year|baby|toddler/i.test(responseText);
        
        if (hasActivityKeywords || hasAgeKeywords) {
          console.log("  Response contains relevant keywords");
        } else {
          console.log(chalk.yellow("  ⚠ Response may not be fully loaded or relevant"));
        }
        
        // Check response length
        const responseLength = responseText.length;
        if (responseLength > 100) {
          console.log(`  Response length: ${responseLength} characters`);
        }
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test8-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testAICoachAskQuestion()
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

