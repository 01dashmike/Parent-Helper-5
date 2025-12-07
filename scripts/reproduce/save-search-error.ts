#!/usr/bin/env node
/**
 * Reproduce: Save search API error
 * 
 * Scenario: When /api/search/save fails (auth error, network error)
 * Expected: Error message displayed to user
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceSaveSearchError(): Promise<void> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept save API and force an error
    await page.route("**/api/search/save", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Failed to save search" }),
        headers: { "Content-Type": "application/json" },
      });
    });
    
    console.log("▶ Navigating to search page...");
    await page.goto(`${BASE_URL}/search?town=London&q=music`, { waitUntil: "networkidle" });
    
    // Wait for save button to appear
    await page.waitForSelector('button:has-text("Save"), button[aria-label*="Save"]', { timeout: 5000 }).catch(() => {
      console.log("⚠️  Save button not found, skipping...");
      console.log("❌ NOT REPRODUCED: Save button not available");
      return;
    });
    
    console.log("▶ Clicking save button...");
    await page.click('button:has-text("Save"), button[aria-label*="Save"]').catch(() => {
      // Button might be disabled or not visible
      console.log("⚠️  Could not click save button");
      console.log("❌ NOT REPRODUCED: Save button not clickable");
      return;
    });
    
    // Wait for error to appear
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorText = await page.textContent("body");
    const hasError = errorText?.includes("Failed to save") || 
                     errorText?.includes("error") ||
                     errorText?.includes("try again");
    
    if (hasError) {
      console.log("✅ REPRODUCED: Save search error displayed");
    } else {
      console.log("❌ NOT REPRODUCED: No error message found");
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceSaveSearchError().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

