import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import chalk from "chalk";

const root = process.cwd();
const requiredFiles = [
  ".next/server/middleware-manifest.json",
  ".next/build-manifest.json",
  ".next/server/app-path-routes-manifest.json",
  ".next/server/required-server-files.json",
];

function timestamp() {
  return new Date().toISOString();
}

async function fileMissing(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    await fsp.access(fullPath, fs.constants.R_OK);
    return false;
  } catch {
    return true;
  }
}

async function checkCache() {
  const missing = [];
  for (const file of requiredFiles) {
    if (await fileMissing(file)) {
      missing.push(file);
    }
  }
  return missing;
}

async function repairCache(missing) {
  console.warn(
    chalk.yellow(
      `[${timestamp()}] ⚠️  Next.js cache missing or corrupted (missing: ${missing.join(", ")}). Running automatic repair...`
    )
  );

  const cachePath = path.join(root, ".next");
  try {
    fs.rmSync(cachePath, { recursive: true, force: true });
    console.log(chalk.yellow(`[${timestamp()}] 🧹 Removed ${cachePath}`));
  } catch (error) {
    console.error(chalk.red(`[${timestamp()}] ❌ Failed to remove ${cachePath}: ${error.message}`));
    throw error;
  }

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCmd, ["run", "build:next"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_SELF_HEAL: "1" },
  });

  if (result.status !== 0) {
    console.error(
      chalk.red(
        `[${timestamp()}] ❌ Automatic rebuild failed. Please run 'rm -rf .next && npm run build:next' manually.`
      )
    );
    throw new Error("Rebuild failed");
  }

  console.log(chalk.green(`[${timestamp()}] ✅ Next.js cache repaired and validated.`));
}

async function main() {
  if (process.env.NEXT_SELF_HEAL === "1") {
    return process.exit(0);
  }

  const missing = await checkCache();
  if (missing.length === 0) {
    console.log(chalk.blue(`[${timestamp()}] ✅ Next.js cache healthy.`));
    return process.exit(0);
  }

  try {
    await repairCache(missing);
    return process.exit(0);
  } catch (error) {
    return process.exit(1);
  }
}

main();
