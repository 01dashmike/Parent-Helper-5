/**
 * Parent Helper - Stable Build Repair Script (Next 15)
 * Cleans caches, reinstalls stable packages, rebuilds,
 * and verifies both Supabase anon + service keys.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envFile = path.join(root, ".env.local");
const backupDir = path.join(root, "backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const envBackup = path.join(backupDir, `.env.local.backup-${timestamp}`);

// ---------- 1. Backup ----------
console.log("🔒 Backing up .env.local...");
if (fs.existsSync(envFile)) {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  fs.copyFileSync(envFile, envBackup);
  console.log(`✅ Backed up to: ${envBackup}`);
} else {
  console.warn("⚠️ No .env.local found — skipping backup.");
}

// ---------- 2. Clear caches ----------
const dirs = [".next", ".turbo", "node_modules/.cache"];
console.log("\n🧹 Cleaning caches...");
for (const dir of dirs) {
  const full = path.join(root, dir);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`🗑️ Removed ${dir}`);
  }
}

// ---------- 3. Reinstall stable Next toolchain ----------
console.log("\n📦 Reinstalling stable Next.js toolchain...");
try {
  execSync(
    "npm install --save-exact next@15.5.6 react@18.3.1 react-dom@18.3.1",
    { stdio: "inherit" }
  );
} catch (err) {
  console.error("❌ Dependency reinstall failed:", err);
  process.exit(1);
}

// ---------- 4. Build ----------
console.log("\n⚙️ Running clean rebuild...");
try {
  execSync("npm run build:next", { stdio: "inherit" });
  console.log("✅ Build completed successfully!");
} catch (err) {
  console.error("💥 Build failed:", err.message);
  if (fs.existsSync(envBackup)) {
    fs.copyFileSync(envBackup, envFile);
    console.log("♻️ Restored .env.local from backup due to failure.");
  }
  process.exit(1);
}

// ---------- 5. Load env vars ----------
function loadEnv() {
  const env = {};
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, "utf8").split("\n");
    for (const line of lines) {
      if (line.trim() && !line.startsWith("#")) {
        const [key, ...rest] = line.split("=");
        env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
      }
    }
  }
  return env;
}

const env = loadEnv();

const SUPABASE_URL =
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("\n🔍 Verifying Supabase credentials...");

if (!SUPABASE_URL) {
  console.warn("⚠️ No Supabase URL found in .env.local.");
} else {
  let verified = false;

  // Test helper
  async function testSupabaseConnection(label, key) {
    if (!key) {
      console.warn(`⚠️ Missing ${label}.`);
      return;
    }
    try {
      const supabase = createClient(SUPABASE_URL, key);
      const { error } = await supabase.from("blog_posts_ai").select("*").limit(1);
      if (error) throw error;
      console.log(`✅ Supabase connection verified with ${label}`);
      verified = true;
    } catch (err) {
      console.error(`❌ ${label} failed:`, err.message);
    }
  }

  // Sequentially test both keys
  const run = async () => {
    await testSupabaseConnection("SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
    await testSupabaseConnection("ANON_KEY", ANON_KEY);
    if (!verified)
      console.error("💥 No valid Supabase connection could be established.");
  };

  // Execute async test
  run().then(() => {
    console.log("\n🚀 All done! You can now run:");
    console.log("   npm run dev");
  });
}
