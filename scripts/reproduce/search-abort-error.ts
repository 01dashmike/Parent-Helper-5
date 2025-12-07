#!/usr/bin/env node
/**
 * Reproduce: Search AbortError
 * 
 * Scenario: When search request is aborted (rapid filter changes)
 * Expected: AbortError should be handled gracefully, no error shown
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceSearchAbortError(): Promise<void> {
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
    
    console.log("▶ Navigating to search page...");
    await page.goto(`${BASE_URL}/search?town=London`, { waitUntil: "networkidle" });
    
    // Rapidly change filters to trigger abort
    console.log("▶ Rapidly changing filters to trigger abort...");
    await page.fill('input[placeholder*="town"]', "Bristol");
    await page.waitForTimeout(100);
    await page.fill('input[placeholder*="town"]', "Manchester");
    await page.waitForTimeout(100);
    await page.fill('input[placeholder*="town"]', "Leeds");
    await page.waitForTimeout(100);
    await page.fill('input[placeholder*="town"]', "Birmingham");
    
    // Wait for final request to complete
    await page.waitForTimeout(2000);
    
    // Check if AbortError was logged (should not be)
    const abortErrors = consoleErrors.filter((err) => 
      err.includes("AbortError") || err.includes("aborted")
    );
    
    if (abortErrors.length > 0) {
      console.log("❌ REPRODUCED: AbortError detected in console");
      console.log("   Errors:", abortErrors);
    } else {
      console.log("✅ NOT REPRODUCED: AbortError handled gracefully");
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceSearchAbortError().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

