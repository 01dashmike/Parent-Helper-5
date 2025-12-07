/**
 * Load test script for bookings-related endpoints
 * 
 * Usage: npx tsx scripts/load/bookings.ts
 * 
 * Note: Adjust endpoint based on available bookings API routes.
 * This script tests a generic GET endpoint pattern.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOTAL_REQUESTS = parseInt(process.env.LOAD_TEST_REQUESTS || "200", 10);
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS || "10", 10);

// Test different booking-related endpoints
const ENDPOINTS = [
  "/api/book/start", // This is a POST, but we'll test error handling
  // Add other booking endpoints as needed
];

interface LatencyStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p50: number;
  p95: number;
  p99: number;
}

interface TestResult {
  success: number;
  failure: number;
  latencies: number[];
  statusCodes: Record<number, number>;
  errors: string[];
}

async function makeRequest(endpoint: string): Promise<{ status: number; latency: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // For POST endpoints, send minimal valid payload
    const isPost = endpoint.includes("/start");
    const options: RequestInit = {
      method: isPost ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };
    
    if (isPost) {
      // Send minimal payload - will likely fail validation but tests endpoint availability
      options.body = JSON.stringify({
        classId: 1,
        occurrenceId: 1,
        parentName: "Test",
        parentEmail: "test@example.com",
        parentPhone: "07123456789",
        childName: "Test Child",
        childAge: 5,
      });
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    const latency = Date.now() - startTime;
    const status = response.status;
    
    // Accept 200-299 as success, 400-499 as expected validation errors
    if (status >= 200 && status < 500) {
      // Try to parse response
      await response.json().catch(() => null);
      return { status, latency };
    }
    
    const text = await response.text().catch(() => "");
    return { status, latency, error: `HTTP ${status}: ${text.substring(0, 100)}` };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    return {
      status: 0,
      latency,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

function calculateStats(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p50: 0, p95: 0, p99: 0 };
  }
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    min: sorted[0],
    max: sorted[len - 1],
    mean: sorted.reduce((a, b) => a + b, 0) / len,
    median: sorted[Math.floor(len / 2)],
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
  };
}

async function runLoadTest(): Promise<void> {
  console.log(`\n🚀 Starting load test for bookings endpoints`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Total requests: ${TOTAL_REQUESTS}`);
  console.log(`   Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`   ⚠️  Note: Testing endpoint availability and error handling\n`);
  
  const result: TestResult = {
    success: 0,
    failure: 0,
    latencies: [],
    statusCodes: {},
    errors: [],
  };
  
  const startTime = Date.now();
  let completed = 0;
  const endpoint = ENDPOINTS[0] || "/api/book/start";
  
  // Run requests in batches
  for (let batch = 0; batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS); batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - completed);
    const batchPromises: Promise<void>[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(
        makeRequest(endpoint).then((response) => {
          result.latencies.push(response.latency);
          
          // Count 2xx and 4xx (validation errors) as "success" (endpoint is working)
          if (response.status >= 200 && response.status < 500) {
            result.success++;
          } else {
            result.failure++;
            if (response.error) {
              result.errors.push(response.error);
            }
          }
          
          result.statusCodes[response.status] = (result.statusCodes[response.status] || 0) + 1;
          completed++;
          
          if (completed % 50 === 0) {
            process.stdout.write(`\r   Progress: ${completed}/${TOTAL_REQUESTS} requests completed`);
          }
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    // Small delay between batches
    if (batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS) - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  
  const totalTime = Date.now() - startTime;
  const stats = calculateStats(result.latencies);
  
  console.log(`\n\n📊 Results for ${endpoint}`);
  console.log("=" .repeat(60));
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful (2xx/4xx): ${result.success} (${((result.success / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`Failed (5xx/network): ${result.failure} (${((result.failure / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Requests/sec: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  console.log("\n📈 Latency Distribution (ms):");
  console.log(`   Min: ${stats.min.toFixed(0)}`);
  console.log(`   Max: ${stats.max.toFixed(0)}`);
  console.log(`   Mean: ${stats.mean.toFixed(0)}`);
  console.log(`   Median: ${stats.median.toFixed(0)}`);
  console.log(`   P50: ${stats.p50.toFixed(0)}`);
  console.log(`   P95: ${stats.p95.toFixed(0)}`);
  console.log(`   P99: ${stats.p99.toFixed(0)}`);
  console.log("\n📋 Status Codes:");
  Object.entries(result.statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count}`);
    });
  
  if (result.errors.length > 0) {
    console.log("\n⚠️  Sample Errors:");
    const uniqueErrors = [...new Set(result.errors)].slice(0, 5);
    uniqueErrors.forEach((error) => {
      console.log(`   - ${error}`);
    });
  }
  
  console.log("=" .repeat(60));
}

// Run the test
runLoadTest().catch((error) => {
  console.error("❌ Load test failed:", error);
  process.exit(1);
});

