#!/usr/bin/env node

/**
 * This script is for local debugging only.
 * 
 * Usage: node scripts/debug-error.js SCENARIO [json]
 * 
 * Examples:
 *   node scripts/debug-error.js VALIDATION_ERROR
 *   node scripts/debug-error.js CUSTOM '{"codeOverride": "MY_ERROR", "message": "Test"}'
 */

const SUPPORTED_SCENARIOS = [
  "VALIDATION_ERROR",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "MULTI_ERROR",
  "FIELD_VALIDATION_ERROR",
  "CUSTOM",
];

const API_URL = "http://localhost:3000/api/error-sandbox";

async function main() {
  const scenario = process.argv[2];
  const jsonArg = process.argv[3];

  // Validate scenario
  if (!scenario || !SUPPORTED_SCENARIOS.includes(scenario)) {
    console.error("❌ Error: Invalid or missing scenario");
    console.error(`\nSupported scenarios: ${SUPPORTED_SCENARIOS.join(", ")}`);
    console.error(`\nUsage: node scripts/debug-error.js SCENARIO [json]`);
    process.exit(1);
  }

  // Build request body
  const body = { scenario };

  // Parse and merge JSON argument if provided
  if (jsonArg) {
    try {
      const parsedJson = JSON.parse(jsonArg);
      Object.assign(body, parsedJson);
    } catch (error) {
      console.error("❌ Error: Invalid JSON argument");
      console.error(`\n${error.message}`);
      console.error(`\nProvided JSON: ${jsonArg}`);
      process.exit(1);
    }
  }

  // Make request
  try {
    console.log(`\n📤 Sending POST to ${API_URL}`);
    console.log(`📋 Scenario: ${scenario}`);
    if (jsonArg) {
      console.log(`📝 Custom JSON: ${jsonArg}`);
    }
    console.log(`\n${"=".repeat(60)}\n`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get response headers
    const contentType = response.headers.get("content-type") || "N/A";
    const errorVersion = response.headers.get("x-error-version") || "N/A";

    // Parse response body
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (error) {
      const text = await response.text();
      responseBody = { _raw: text, _parseError: error.message };
    }

    // Pretty print results
    console.log("📥 Response:");
    console.log(`\n   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`);
    console.log(`     - Content-Type: ${contentType}`);
    console.log(`     - x-error-version: ${errorVersion}`);
    console.log(`\n   Body:`);
    console.log(JSON.stringify(responseBody, null, 2));
    console.log(`\n${"=".repeat(60)}\n`);

    // Exit with non-zero if error status
    if (response.status >= 400) {
      process.exit(1);
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("fetch failed")) {
      console.error("❌ Error: Could not connect to dev server");
      console.error(`\nMake sure the dev server is running at ${API_URL}`);
      console.error(`\nStart it with: npm run dev`);
    } else {
      console.error("❌ Error:", error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

