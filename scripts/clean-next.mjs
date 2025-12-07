import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const sh = (cmd) => execSync(cmd, { stdio: "inherit", env: process.env });

try {
  console.log("🧹 Cleaning up Next.js cache and locked ports...");

  try {
    sh('pkill -f "next|node.*3000"');
  } catch {}

  try {
    sh("lsof -ti :3000 | xargs kill -9");
  } catch {}

  if (existsSync(".next")) {
    try {
      sh("chmod -R u+w .next");
    } catch {}
    try {
      sh("npx rimraf .next");
    } catch {}
  }

  if (existsSync("node_modules/.cache")) {
    try {
      sh("npx rimraf node_modules/.cache");
    } catch {}
  }

  console.log("✅ Clean complete. Safe to rebuild.");
} catch (error) {
  console.error("❌ Clean failed:", error?.message || error);
  process.exit(1);
}

