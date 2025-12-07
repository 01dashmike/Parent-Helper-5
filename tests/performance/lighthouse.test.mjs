import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure reports directory exists
const reportsDir = path.join(__dirname, "../reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// URLs to test
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const urls = [
  `${baseUrl}/`,
  `${baseUrl}/search?q=music`,
  `${baseUrl}/london`,
  `${baseUrl}/blog`,
];

// Thresholds (0-100 scale)
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  seo: 90,
  bestPractices: 85,
};

/**
 * Run Lighthouse audit on a URL
 */
async function runLighthouseAudit(url) {
  console.log(`\n🔍 Running Lighthouse audit for: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const { lhr } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "seo", "best-practices"],
      logLevel: "info",
    });

    const report = {
      url,
      timestamp: new Date().toISOString(),
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      bestPractices: Math.round(lhr.categories["best-practices"].score * 100),
      metrics: {
        firstContentfulPaint: lhr.audits["first-contentful-paint"]?.numericValue,
        largestContentfulPaint: lhr.audits["largest-contentful-paint"]?.numericValue,
        totalBlockingTime: lhr.audits["total-blocking-time"]?.numericValue,
        cumulativeLayoutShift: lhr.audits["cumulative-layout-shift"]?.numericValue,
      },
    };

    // Save report to file
    const urlSlug = url.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const reportPath = path.join(reportsDir, `lighthouse-${urlSlug}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save full Lighthouse report
    const fullReportPath = path.join(reportsDir, `lighthouse-full-${urlSlug}.json`);
    fs.writeFileSync(fullReportPath, JSON.stringify(lhr, null, 2));

    console.log(`✅ ${url}`);
    console.log(`   Performance: ${report.performance}/100`);
    console.log(`   Accessibility: ${report.accessibility}/100`);
    console.log(`   SEO: ${report.seo}/100`);
    console.log(`   Best Practices: ${report.bestPractices}/100`);

    // Check thresholds
    const failures = [];
    if (report.performance < THRESHOLDS.performance) {
      failures.push(
        `Performance below threshold: ${report.performance} < ${THRESHOLDS.performance}`
      );
    }
    if (report.accessibility < THRESHOLDS.accessibility) {
      failures.push(
        `Accessibility below threshold: ${report.accessibility} < ${THRESHOLDS.accessibility}`
      );
    }
    if (report.seo < THRESHOLDS.seo) {
      failures.push(`SEO below threshold: ${report.seo} < ${THRESHOLDS.seo}`);
    }
    if (report.bestPractices < THRESHOLDS.bestPractices) {
      failures.push(
        `Best Practices below threshold: ${report.bestPractices} < ${THRESHOLDS.bestPractices}`
      );
    }

    if (failures.length > 0) {
      console.error(`\n❌ Threshold failures for ${url}:`);
      failures.forEach((failure) => console.error(`   ${failure}`));
      throw new Error(`Lighthouse thresholds not met for ${url}`);
    }

    return report;
  } finally {
    await browser.close();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Lighthouse performance audits...");
  console.log(`📊 Thresholds: Performance ≥ ${THRESHOLDS.performance}, Accessibility ≥ ${THRESHOLDS.accessibility}, SEO ≥ ${THRESHOLDS.seo}`);

  const results = [];
  let hasFailures = false;

  for (const url of urls) {
    try {
      const report = await runLighthouseAudit(url);
      results.push(report);
    } catch (error) {
      console.error(`\n❌ Error auditing ${url}:`, error.message);
      hasFailures = true;
      results.push({ url, error: error.message });
    }
  }

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    thresholds: THRESHOLDS,
    results,
    summary: {
      total: results.length,
      passed: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
      averagePerformance: Math.round(
        results
          .filter((r) => r.performance)
          .reduce((sum, r) => sum + r.performance, 0) /
          results.filter((r) => r.performance).length
      ),
      averageAccessibility: Math.round(
        results
          .filter((r) => r.accessibility)
          .reduce((sum, r) => sum + r.accessibility, 0) /
        results.filter((r) => r.accessibility).length
      ),
      averageSeo: Math.round(
        results
          .filter((r) => r.seo)
          .reduce((sum, r) => sum + r.seo, 0) /
        results.filter((r) => r.seo).length
      ),
    },
  };

  const summaryPath = path.join(reportsDir, "lighthouse-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log("\n📈 Summary:");
  console.log(`   Total URLs tested: ${summary.summary.total}`);
  console.log(`   Passed: ${summary.summary.passed}`);
  console.log(`   Failed: ${summary.summary.failed}`);
  console.log(`   Average Performance: ${summary.summary.averagePerformance}/100`);
  console.log(`   Average Accessibility: ${summary.summary.averageAccessibility}/100`);
  console.log(`   Average SEO: ${summary.summary.averageSeo}/100`);
  console.log(`\n📄 Reports saved to: ${reportsDir}`);

  if (hasFailures) {
    console.error("\n❌ Some audits failed. Check reports for details.");
    process.exit(1);
  } else {
    console.log("\n✅ All audits passed!");
  }
}

// Run if executed directly (check if this is the main module)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('lighthouse.test.mjs');

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runLighthouseAudit, main };

