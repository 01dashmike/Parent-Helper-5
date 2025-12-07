#!/usr/bin/env node
/**
 * Reproduce: Browser back/forward navigation issues
 * 
 * Scenario: When user clicks browser back/forward, filters should sync correctly
 * Expected: Filters should reflect URL state, no errors
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceBrowserBackForward(): Promise<void> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Track console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    console.log("▶ Step 1: Navigate to search page...");
    await page.goto(`${BASE_URL}/search?town=London`, { waitUntil: "networkidle" });
    
    const town1 = await page.inputValue('input[placeholder*="town"], input[aria-label*="town"]').catch(() => "");
    console.log(`   Town filter: ${town1}`);
    
    console.log("▶ Step 2: Change filters...");
    await page.fill('input[placeholder*="town"], input[aria-label*="town"]', "Bristol");
    await page.waitForTimeout(1000);
    
    const town2 = await page.inputValue('input[placeholder*="town"], input[aria-label*="town"]').catch(() => "");
    console.log(`   Town filter after change: ${town2}`);
    
    console.log("▶ Step 3: Navigate back...");
    await page.goBack();
    await page.waitForTimeout(1000);
    
    const town3 = await page.inputValue('input[placeholder*="town"], input[aria-label*="town"]').catch(() => "");
    const currentUrl = page.url();
    console.log(`   Town filter after back: ${town3}`);
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if filter matches URL
    const urlTown = new URL(currentUrl).searchParams.get("town") || "";
    const matches = town3 === urlTown || town3 === "London";
    
    if (!matches) {
      console.log("❌ REPRODUCED: Filter does not match URL after back navigation");
      console.log(`   Expected: ${urlTown || "London"}, Got: ${town3}`);
    } else if (consoleErrors.length > 0) {
      console.log("❌ REPRODUCED: Errors during navigation");
      console.log("   Errors:", consoleErrors.slice(0, 3));
    } else {
      console.log("✅ NOT REPRODUCED: Browser navigation works correctly");
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceBrowserBackForward().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

