#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const skipMigrations = args.includes("--skip-migrations");

function runCommand(label, command, commandArgs, options = {}) {
  console.log(`\n▶ Running ${label}`);
  const result = spawnSync(command, commandArgs, {
    stdio: "pipe",
    env: process.env,
    ...options,
  });

  if (result.stdout?.length) {
    process.stdout.write(result.stdout.toString());
  }

  if (result.status === 0) {
    console.log(`✅ OK: ${label}`);
    return { failed: false };
  }

  console.error(`❌ FAILED: ${label}`);
  if (result.stderr?.length) {
    process.stderr.write(result.stderr.toString());
  }
  return { failed: true };
}

function ensurePnpm() {
  const check = spawnSync("pnpm", ["--version"], { stdio: "pipe" });
  if (check.status !== 0) {
    console.error("❌ pnpm is not available in PATH. Please install pnpm before running preflight checks.");
    if (check.stderr?.length) {
      process.stderr.write(check.stderr.toString());
    }
    process.exit(1);
  }
  if (check.stdout?.length) {
    console.log(`pnpm version ${check.stdout.toString().trim()}`);
  }
}

ensurePnpm();

const tasks = [
  { label: "pnpm lint", command: "pnpm", args: ["lint"] },
  { label: "pnpm typecheck", command: "pnpm", args: ["typecheck"] },
  !skipMigrations && { label: "pnpm run migration:verify", command: "pnpm", args: ["run", "migration:verify"] },
  { label: "node scripts/check-server-actions.mjs", command: "node", args: ["scripts/check-server-actions.mjs"] },
  { label: "node scripts/check-next-health.mjs", command: "node", args: ["scripts/check-next-health.mjs"] },
].filter(Boolean);

let hasFailures = false;

for (const task of tasks) {
  const { failed } = runCommand(task.label, task.command, task.args);
  if (failed) {
    hasFailures = true;
  }
}

if (hasFailures) {
  console.error("\nPreflight checks finished with failures.");
  process.exit(1);
}

console.log("\nAll preflight checks passed.");
process.exit(0);

