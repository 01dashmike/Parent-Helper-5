/**
 * Run all load tests and generate summary report
 * 
 * Usage: npx tsx scripts/load/run-all.ts
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface TestConfig {
  name: string;
  script: string;
  requests: number;
  concurrent: number;
}

const TESTS: TestConfig[] = [
  { name: "Search API", script: "search.ts", requests: 200, concurrent: 10 },
  { name: "Blog Generate", script: "blog-generate.ts", requests: 100, concurrent: 5 },
  { name: "Provider Dashboard", script: "provider-dashboard.ts", requests: 150, concurrent: 10 },
  { name: "Bookings", script: "bookings.ts", requests: 200, concurrent: 10 },
];

interface TestResult {
  name: string;
  success: number;
  failure: number;
  totalRequests: number;
  totalTime: number;
  requestsPerSec: number;
  latency: {
    min: number;
    max: number;
    mean: number;
    p95: number;
    p99: number;
  };
  statusCodes: Record<number, number>;
  errors: string[];
}

async function runTest(config: TestConfig): Promise<TestResult | null> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${config.name}`);
  console.log("=".repeat(60));
  
  try {
    const scriptPath = path.join(__dirname, config.script);
    const env = {
      ...process.env,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      LOAD_TEST_REQUESTS: config.requests.toString(),
      CONCURRENT_REQUESTS: config.concurrent.toString(),
    };
    
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, { env });
    
    // Parse results from stdout (simplified - in production, use structured output)
    const output = stdout + stderr;
    
    // Extract key metrics using regex
    const successMatch = output.match(/Successful:\s*(\d+)/);
    const failureMatch = output.match(/Failed:\s*(\d+)/);
    const timeMatch = output.match(/Total time:\s*([\d.]+)s/);
    const rpsMatch = output.match(/Requests\/sec:\s*([\d.]+)/);
    const minMatch = output.match(/Min:\s*([\d.]+)/);
    const maxMatch = output.match(/Max:\s*([\d.]+)/);
    const meanMatch = output.match(/Mean:\s*([\d.]+)/);
    const p95Match = output.match(/P95:\s*([\d.]+)/);
    const p99Match = output.match(/P99:\s*([\d.]+)/);
    
    return {
      name: config.name,
      success: successMatch ? parseInt(successMatch[1], 10) : 0,
      failure: failureMatch ? parseInt(failureMatch[1], 10) : 0,
      totalRequests: config.requests,
      totalTime: timeMatch ? parseFloat(timeMatch[1]) : 0,
      requestsPerSec: rpsMatch ? parseFloat(rpsMatch[1]) : 0,
      latency: {
        min: minMatch ? parseFloat(minMatch[1]) : 0,
        max: maxMatch ? parseFloat(maxMatch[1]) : 0,
        mean: meanMatch ? parseFloat(meanMatch[1]) : 0,
        p95: p95Match ? parseFloat(p95Match[1]) : 0,
        p99: p99Match ? parseFloat(p99Match[1]) : 0,
      },
      statusCodes: {},
      errors: [],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Test failed: ${errorMessage}`);
    return null;
  }
}

async function generateReport(results: (TestResult | null)[]): Promise<void> {
  const validResults = results.filter((r): r is TestResult => r !== null);
  
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("📊 LOAD TEST SUMMARY REPORT");
  console.log("=".repeat(80));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  if (validResults.length === 0) {
    console.log("❌ No tests completed successfully");
    return;
  }
  
  // Overall statistics
  const totalRequests = validResults.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccess = validResults.reduce((sum, r) => sum + r.success, 0);
  const totalFailure = validResults.reduce((sum, r) => sum + r.failure, 0);
  const totalTime = validResults.reduce((sum, r) => sum + r.totalTime, 0);
  const avgRPS = validResults.reduce((sum, r) => sum + r.requestsPerSec, 0) / validResults.length;
  
  console.log("📈 OVERALL STATISTICS");
  console.log("-".repeat(80));
  console.log(`Total Tests: ${validResults.length}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Total Successful: ${totalSuccess} (${((totalSuccess / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Total Failed: ${totalFailure} (${((totalFailure / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`Average Requests/sec: ${avgRPS.toFixed(2)}\n`);
  
  // Per-endpoint results
  console.log("📋 PER-ENDPOINT RESULTS");
  console.log("-".repeat(80));
  
  validResults.forEach((result) => {
    const successRate = ((result.success / result.totalRequests) * 100).toFixed(1);
    console.log(`\n${result.name}:`);
    console.log(`  Requests: ${result.totalRequests}`);
    console.log(`  Success Rate: ${successRate}%`);
    console.log(`  Requests/sec: ${result.requestsPerSec.toFixed(2)}`);
    console.log(`  Latency (ms):`);
    console.log(`    Mean: ${result.latency.mean.toFixed(0)}`);
    console.log(`    P95: ${result.latency.p95.toFixed(0)}`);
    console.log(`    P99: ${result.latency.p99.toFixed(0)}`);
  });
  
  // Performance ranking
  console.log("\n🏆 PERFORMANCE RANKING (by P95 latency)");
  console.log("-".repeat(80));
  const ranked = [...validResults].sort((a, b) => a.latency.p95 - b.latency.p95);
  ranked.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: P95=${result.latency.p95.toFixed(0)}ms`);
  });
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-".repeat(80));
  const slowEndpoints = validResults.filter((r) => r.latency.p95 > 1000);
  if (slowEndpoints.length > 0) {
    console.log("⚠️  Endpoints with P95 > 1000ms:");
    slowEndpoints.forEach((r) => {
      console.log(`   - ${r.name}: ${r.latency.p95.toFixed(0)}ms`);
    });
  }
  
  const highFailureRate = validResults.filter((r) => (r.failure / r.totalRequests) > 0.1);
  if (highFailureRate.length > 0) {
    console.log("\n⚠️  Endpoints with >10% failure rate:");
    highFailureRate.forEach((r) => {
      const rate = ((r.failure / r.totalRequests) * 100).toFixed(1);
      console.log(`   - ${r.name}: ${rate}%`);
    });
  }
  
  if (slowEndpoints.length === 0 && highFailureRate.length === 0) {
    console.log("✅ All endpoints performing within acceptable thresholds");
  }
  
  console.log("\n" + "=".repeat(80));
  
  // Save report to file
  const reportPath = path.join(__dirname, "load-test-report.txt");
  const reportContent = `LOAD TEST SUMMARY REPORT
Generated: ${new Date().toISOString()}
Base URL: ${BASE_URL}

OVERALL STATISTICS
Total Tests: ${validResults.length}
Total Requests: ${totalRequests}
Total Successful: ${totalSuccess} (${((totalSuccess / totalRequests) * 100).toFixed(1)}%)
Total Failed: ${totalFailure} (${((totalFailure / totalRequests) * 100).toFixed(1)}%)
Total Time: ${totalTime.toFixed(2)}s
Average Requests/sec: ${avgRPS.toFixed(2)}

PER-ENDPOINT RESULTS
${validResults.map((r) => `
${r.name}:
  Requests: ${r.totalRequests}
  Success Rate: ${((r.success / r.totalRequests) * 100).toFixed(1)}%
  Requests/sec: ${r.requestsPerSec.toFixed(2)}
  Latency (ms): Mean=${r.latency.mean.toFixed(0)}, P95=${r.latency.p95.toFixed(0)}, P99=${r.latency.p99.toFixed(0)}
`).join("")}
`;
  
  await fs.writeFile(reportPath, reportContent);
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

async function main() {
  console.log("🚀 Starting load test suite");
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const results: (TestResult | null)[] = [];
  
  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  await generateReport(results);
}

main().catch((error) => {
  console.error("❌ Load test suite failed:", error);
  process.exit(1);
});

