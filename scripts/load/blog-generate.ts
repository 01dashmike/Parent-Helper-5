/**
 * Load test script for /api/blog/generate endpoint
 * 
 * Usage: npx tsx scripts/load/blog-generate.ts
 * 
 * Note: This endpoint requires authentication and valid topic IDs.
 * Adjust requests count based on available topics in the database.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TOTAL_REQUESTS = parseInt(process.env.LOAD_TEST_REQUESTS || "100", 10);
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS || "5", 10);

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

async function makeRequest(topicId?: number): Promise<{ status: number; latency: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const body: Record<string, unknown> = {};
    if (topicId) {
      body.topicId = topicId;
    }
    
    const response = await fetch(`${BASE_URL}/api/blog/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const latency = Date.now() - startTime;
    const status = response.status;
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { status, latency, error: `HTTP ${status}: ${text.substring(0, 100)}` };
    }
    
    // Verify response is valid JSON
    await response.json().catch(() => {
      throw new Error("Invalid JSON response");
    });
    
    return { status, latency };
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
  console.log(`\n🚀 Starting load test for /api/blog/generate`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Total requests: ${TOTAL_REQUESTS}`);
  console.log(`   Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`   ⚠️  Note: This endpoint may return 404 if no topics are available\n`);
  
  const result: TestResult = {
    success: 0,
    failure: 0,
    latencies: [],
    statusCodes: {},
    errors: [],
  };
  
  const startTime = Date.now();
  let completed = 0;
  
  // Run requests in batches
  for (let batch = 0; batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS); batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - completed);
    const batchPromises: Promise<void>[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      // Don't pass topicId - let the endpoint pick a topic
      batchPromises.push(
        makeRequest().then((response) => {
          result.latencies.push(response.latency);
          
          if (response.status >= 200 && response.status < 300) {
            result.success++;
          } else {
            result.failure++;
            if (response.error) {
              result.errors.push(response.error);
            }
          }
          
          result.statusCodes[response.status] = (result.statusCodes[response.status] || 0) + 1;
          completed++;
          
          if (completed % 20 === 0) {
            process.stdout.write(`\r   Progress: ${completed}/${TOTAL_REQUESTS} requests completed`);
          }
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    // Delay between batches (this endpoint is CPU-intensive)
    if (batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS) - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  
  const totalTime = Date.now() - startTime;
  const stats = calculateStats(result.latencies);
  
  console.log(`\n\n📊 Results for /api/blog/generate`);
  console.log("=" .repeat(60));
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${result.success} (${((result.success / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${result.failure} (${((result.failure / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
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

