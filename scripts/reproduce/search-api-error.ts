#!/usr/bin/env node
/**
 * Reproduce: Search API fetch error
 * 
 * Scenario: When /api/search fails (network error, 500, etc.)
 * Expected: Error message displayed to user
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceSearchApiError(): Promise<void> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept API calls and force an error
    await page.route("**/api/search*", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal server error" }),
        headers: { "Content-Type": "application/json" },
      });
    });
    
    console.log("▶ Navigating to search page...");
    await page.goto(`${BASE_URL}/search?town=London&q=music`, { waitUntil: "networkidle" });
    
    // Wait for error to appear
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorText = await page.textContent("body");
    const hasError = errorText?.includes("couldn't load classes") || 
                     errorText?.includes("try again") ||
                     errorText?.includes("error");
    
    if (hasError) {
      console.log("✅ REPRODUCED: Search API error displayed");
    } else {
      console.log("❌ NOT REPRODUCED: No error message found");
      console.log("   Page content:", errorText?.substring(0, 200));
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceSearchApiError().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

