#!/usr/bin/env node
/**
 * Reproduce: URL sync infinite loop
 * 
 * Scenario: When filter changes cause infinite URL updates
 * Expected: URL should update once, not repeatedly
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceUrlSyncLoop(): Promise<void> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Track URL changes
    const urlChanges: string[] = [];
    let currentUrl = "";
    
    page.on("framenavigated", () => {
      const newUrl = page.url();
      if (newUrl !== currentUrl) {
        urlChanges.push(newUrl);
        currentUrl = newUrl;
      }
    });
    
    console.log("▶ Navigating to search page...");
    await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
    
    const initialUrl = page.url();
    console.log(`   Initial URL: ${initialUrl}`);
    
    // Change a filter
    console.log("▶ Changing town filter...");
    await page.fill('input[placeholder*="town"], input[aria-label*="town"]', "London");
    
    // Wait and observe URL changes
    await page.waitForTimeout(2000);
    
    // Count unique URL changes
    const uniqueUrls = new Set(urlChanges);
    const changeCount = uniqueUrls.size;
    
    console.log(`   URL changed ${changeCount} times`);
    
    if (changeCount > 3) {
      console.log("❌ REPRODUCED: URL sync loop detected");
      console.log("   URLs:", Array.from(uniqueUrls).slice(0, 5));
    } else if (changeCount === 0) {
      console.log("⚠️  NOT REPRODUCED: URL did not update (might be expected)");
    } else {
      console.log("✅ NOT REPRODUCED: URL updated normally (1-3 times is expected)");
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceUrlSyncLoop().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

