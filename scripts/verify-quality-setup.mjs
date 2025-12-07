#!/usr/bin/env node

/**
 * Verification script for quality testing setup
 * Checks that all required dependencies and files are in place
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const checks = [];

// Check dependencies
function checkDependency(name, isDev = true) {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")
    );
    const deps = isDev ? packageJson.devDependencies : packageJson.dependencies;
    const exists = deps && deps[name];
    checks.push({
      name: `${name} ${isDev ? "(dev)" : ""}`,
      status: exists ? "✅" : "❌",
      message: exists ? "Installed" : "Missing - run: npm install -D " + name,
    });
    return exists;
  } catch (error) {
    checks.push({
      name: `Check ${name}`,
      status: "❌",
      message: "Error reading package.json",
    });
    return false;
  }
}

// Check files
function checkFile(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  const exists = fs.existsSync(fullPath);
  checks.push({
    name: description || filePath,
    status: exists ? "✅" : "❌",
    message: exists ? "Exists" : "Missing",
  });
  return exists;
}

// Check directories
function checkDirectory(dirPath, description) {
  const fullPath = path.join(rootDir, dirPath);
  const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  checks.push({
    name: description || dirPath,
    status: exists ? "✅" : "❌",
    message: exists ? "Exists" : "Missing - create directory",
  });
  return exists;
}

console.log("🔍 Verifying Quality Testing Setup...\n");

// Check dependencies
console.log("Checking dependencies...");
checkDependency("@axe-core/playwright", true);
checkDependency("lighthouse", true);
checkDependency("puppeteer", false);
checkDependency("@playwright/test", true);

// Check test files
console.log("\nChecking test files...");
checkFile("tests/a11y/accessibility.spec.ts", "Accessibility test file");
checkFile("tests/performance/lighthouse.test.mjs", "Lighthouse test file");
checkFile("lighthouserc.json", "Lighthouse CI config");

// Check directories
console.log("\nChecking directories...");
checkDirectory("tests/a11y", "A11y test directory");
checkDirectory("tests/performance", "Performance test directory");
checkDirectory("tests/reports", "Reports directory");

// Check package.json scripts
console.log("\nChecking package.json scripts...");
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")
  );
  const scripts = packageJson.scripts || {};
  const requiredScripts = ["test:a11y", "test:perf", "test:quality"];
  requiredScripts.forEach((script) => {
    const exists = scripts[script];
    checks.push({
      name: `Script: ${script}`,
      status: exists ? "✅" : "❌",
      message: exists ? "Defined" : "Missing from package.json",
    });
  });
} catch (error) {
  checks.push({
    name: "Check scripts",
    status: "❌",
    message: "Error reading package.json",
  });
}

// Print results
console.log("\n" + "=".repeat(60));
console.log("Results:");
console.log("=".repeat(60) + "\n");

checks.forEach((check) => {
  console.log(`${check.status} ${check.name}`);
  if (check.message && check.status === "❌") {
    console.log(`   ${check.message}`);
  }
});

const failed = checks.filter((c) => c.status === "❌").length;
const passed = checks.filter((c) => c.status === "✅").length;

console.log("\n" + "=".repeat(60));
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60) + "\n");

if (failed === 0) {
  console.log("✅ All checks passed! Quality testing setup is complete.\n");
  console.log("Next steps:");
  console.log("  1. Start dev server: npm run dev");
  console.log("  2. Run tests: npm run test:quality");
  process.exit(0);
} else {
  console.log("❌ Some checks failed. Please fix the issues above.\n");
  process.exit(1);
}

