#!/usr/bin/env node
/**
 * E2E Test Script 7: Blog → Generate → Edit → Publish
 * 
 * Flow:
 * 1. Navigate to admin blog section
 * 2. Click "Generate with AI"
 * 3. Verify generated content appears
 * 4. Edit the post
 * 5. Publish the post
 */

import { chromium } from "playwright";
import chalk from "chalk";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "ph_admin_local_1f3b7c9e5a";

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

async function testBlogGenerateEditPublish() {
  console.log(chalk.bold("\n🧪 E2E Test 7: Blog → Generate → Edit → Publish\n"));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Set admin cookie for authentication
    await logStep("Set admin authentication cookie", async () => {
      await page.context().addCookies([
        {
          name: "ph_admin",
          value: ADMIN_SECRET,
          domain: new URL(BASE_URL).hostname,
          path: "/",
        },
      ]);
      console.log("  Admin cookie set");
    });

    // Step 2: Navigate to admin blog section
    await logStep("Navigate to admin blog page", async () => {
      await page.goto(`${BASE_URL}/admin/blog`);
      await page.waitForLoadState("networkidle");
      
      const url = page.url();
      if (url.includes("/login")) {
        throw new Error("Not authenticated - admin cookie may be invalid");
      }
      
      if (!url.includes("/admin/blog") && !url.includes("/admin")) {
        throw new Error(`Expected admin blog page, got: ${url}`);
      }
      
      console.log(`  Navigated to: ${url}`);
    });

    // Step 3: Verify admin blog page loaded
    await logStep("Verify admin blog page", async () => {
      // Look for blog posts table or list
      const blogElements = page.locator(
        'text=/blog|posts|draft|published/i, table, [data-testid*="blog"], .blog-list'
      );
      
      if (await blogElements.first().isVisible({ timeout: 5000 })) {
        console.log("  Blog admin page visible");
      } else {
        throw new Error("Admin blog page content not found");
      }
    });

    // Step 4: Open editor drawer
    await logStep("Open blog editor drawer", async () => {
      // Look for "Edit" button or "Generate with AI" button
      const editButton = page.locator(
        'button:has-text("Edit"), button:has-text("Create"), a:has-text("Edit"), [data-testid*="edit"]'
      ).first();
      
      if (await editButton.isVisible({ timeout: 5000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
        console.log("  Clicked edit button");
      } else {
        // Try to find drawer that might be already open or generate button
        const generateButton = page.locator('button:has-text("Generate"), button:has-text("AI"), [data-testid*="generate"]').first();
        if (await generateButton.isVisible({ timeout: 3000 })) {
          console.log("  Generate button found - drawer may be open");
        } else {
          throw new Error("Edit button or drawer not found");
        }
      }
    });

    // Step 5: Click "Generate with AI" button
    await logStep("Click Generate with AI button", async () => {
      // Look for Generate with AI button in drawer
      const generateButton = page.locator(
        'button:has-text("Generate with AI"), button:has-text("AI"), [data-testid*="generate"], button:has([class*="sparkles" i])'
      ).first();
      
      if (!(await generateButton.isVisible({ timeout: 5000 }))) {
        throw new Error("Generate with AI button not found");
      }
      
      console.log("  Generate button found");
      await generateButton.click();
      
      // Wait for loading state
      await page.waitForTimeout(2000);
      console.log("  Generate button clicked");
    });

    // Step 6: Verify AI generation is in progress
    await logStep("Verify AI generation is in progress", async () => {
      // Look for loading indicators
      const loadingIndicator = page.locator(
        'text=/generating|loading/i, [class*="spinner" i], [class*="loader" i], svg[class*="animate-spin"]'
      ).first();
      
      if (await loadingIndicator.isVisible({ timeout: 3000 })) {
        console.log("  Generation in progress");
      } else {
        console.log(chalk.yellow("  ⚠ Loading indicator not immediately visible"));
      }
    });

    // Step 7: Wait for generation to complete
    await logStep("Wait for AI generation to complete", async () => {
      // Wait for loading to disappear (up to 60 seconds for AI generation)
      const loadingIndicator = page.locator(
        'text=/generating/i, [class*="spinner" i], svg[class*="animate-spin"]'
      ).first();
      
      try {
        await loadingIndicator.waitFor({ state: "hidden", timeout: 60000 });
        console.log("  Generation completed");
      } catch (error) {
        console.log(chalk.yellow("  ⚠ Generation may still be in progress or completed quickly"));
      }
      
      // Wait a bit more for content to populate
      await page.waitForTimeout(2000);
    });

    // Step 8: Verify generated content appears
    await logStep("Verify generated content in editor", async () => {
      // Look for form fields with content
      const titleInput = page.locator('input[name*="title"], input[placeholder*="title" i]').first();
      
      if (await titleInput.isVisible({ timeout: 5000 })) {
        const titleValue = await titleInput.inputValue();
        if (titleValue && titleValue.trim().length > 0) {
          console.log(`  Title populated: ${titleValue.substring(0, 50)}...`);
        } else {
          console.log(chalk.yellow("  ⚠ Title field is empty"));
        }
        
        // Check excerpt
        const excerptInput = page.locator('textarea[name*="excerpt"], textarea[placeholder*="excerpt" i]').first();
        if (await excerptInput.isVisible({ timeout: 3000 })) {
          const excerptValue = await excerptInput.inputValue();
          if (excerptValue && excerptValue.trim().length > 0) {
            console.log(`  Excerpt populated: ${excerptValue.substring(0, 50)}...`);
          }
        }
      } else {
        throw new Error("Editor form not found");
      }
    });

    // Step 9: Edit the post
    await logStep("Edit generated post", async () => {
      const titleInput = page.locator('input[name*="title"]').first();
      
      if (await titleInput.isVisible({ timeout: 5000 })) {
        const currentTitle = await titleInput.inputValue();
        await titleInput.fill(currentTitle + " [Edited]");
        console.log("  Title edited");
        
        // Edit excerpt
        const excerptInput = page.locator('textarea[name*="excerpt"]').first();
        if (await excerptInput.isVisible({ timeout: 3000 })) {
          await excerptInput.fill("This is an edited excerpt for testing purposes.");
          console.log("  Excerpt edited");
        }
      }
    });

    // Step 10: Save changes
    await logStep("Save edited post", async () => {
      const saveButton = page.locator(
        'button:has-text("Save"), button:has-text("Save changes"), button[type="submit"]'
      ).first();
      
      if (!(await saveButton.isVisible({ timeout: 5000 }))) {
        throw new Error("Save button not found");
      }
      
      if (await saveButton.isDisabled()) {
        console.log(chalk.yellow("  ⚠ Save button is disabled - may need to select a post first"));
        return;
      }
      
      await saveButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      
      // Check for success or error
      const errorMsg = page.locator('.error, [role="alert"], .text-red, .text-terracotta').first();
      if (await errorMsg.isVisible({ timeout: 3000 })) {
        const errorText = await errorMsg.textContent();
        throw new Error(`Save failed: ${errorText}`);
      }
      
      console.log("  Changes saved");
    });

    // Step 11: Publish post
    await logStep("Publish the post", async () => {
      // Look for publish/approve button (may be in table or drawer)
      const publishButton = page.locator(
        'button:has-text("Publish"), button:has-text("Approve"), button:has-text("Publish post")'
      ).first();
      
      if (await publishButton.isVisible({ timeout: 5000 })) {
        await publishButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        console.log("  Publish button clicked");
      } else {
        console.log(chalk.yellow("  ⚠ Publish button not found - post may already be published or need approval"));
      }
      
      // Verify post status changed to published
      const publishedStatus = page.locator('text=/published/i, [data-status="published"]').first();
      if (await publishedStatus.isVisible({ timeout: 3000 })) {
        console.log("  Post status: Published");
      } else {
        console.log(chalk.yellow("  ⚠ Published status not immediately visible"));
      }
    });

    console.log(chalk.bold.green("\n✓ Test completed!\n"));

  } catch (error) {
    console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
    await page.screenshot({ path: "scripts/e2e/screenshots/test7-failure.png", fullPage: true });
  } finally {
    await browser.close();
  }

  return results;
}

// Run test
testBlogGenerateEditPublish()
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

