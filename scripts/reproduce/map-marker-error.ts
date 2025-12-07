#!/usr/bin/env node
/**
 * Reproduce: Map marker rendering error
 * 
 * Scenario: When Leaflet map fails to render markers (invalid coordinates, etc.)
 * Expected: Map should handle errors gracefully, show fallback or error message
 */

import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function reproduceMapMarkerError(): Promise<void> {
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
    
    console.log("▶ Navigating to search page with results...");
    await page.goto(`${BASE_URL}/search?town=London&q=music`, { waitUntil: "networkidle" });
    
    // Wait for map to load
    await page.waitForTimeout(3000);
    
    // Check for map-related errors
    const mapErrors = consoleErrors.filter((err) => 
      err.includes("leaflet") ||
      err.includes("marker") ||
      err.includes("cluster") ||
      err.includes("map") ||
      err.includes("coordinates") ||
      err.includes("latitude") ||
      err.includes("longitude")
    );
    
    // Check if map container exists
    const mapExists = await page.locator('[class*="map"], [id*="map"]').count() > 0;
    const hasErrorFallback = await page.locator('text=/No locations|error/i').count() > 0;
    
    if (mapErrors.length > 0) {
      console.log("❌ REPRODUCED: Map marker errors detected");
      console.log("   Errors:", mapErrors.slice(0, 3));
    } else if (!mapExists && !hasErrorFallback) {
      console.log("⚠️  REPRODUCED: Map not rendered and no fallback");
    } else {
      console.log("✅ NOT REPRODUCED: Map rendered without errors");
      if (hasErrorFallback) {
        console.log("   (Fallback message shown, which is acceptable)");
      }
    }
    
  } catch (error) {
    console.error("❌ Script error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

reproduceMapMarkerError().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

