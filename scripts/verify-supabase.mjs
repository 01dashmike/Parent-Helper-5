import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import chalk from "chalk";

const root = process.cwd();
const envFile = path.join(root, ".env.local");

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
const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error(chalk.red("⚠️ Supabase URL missing in .env.local."));
  process.exit(1);
}

if (!SUPABASE_URL.startsWith("https://")) {
  console.warn(chalk.yellow("⚠️ Supabase URL is missing the https:// prefix."));
}

async function testConnection(label, key) {
  if (!key) {
    console.warn(chalk.yellow(`⚠️ Missing ${label}.`));
    return false;
  }
  try {
    const supabase = createClient(SUPABASE_URL, key, { fetch });
    const { error } = await supabase.from("blog_posts_ai").select("*").limit(1);
    if (error) throw error;
    console.log(chalk.green(`✅ Verified with ${label}`));
    return true;
  } catch (err) {
    console.error(chalk.red(`❌ ${label} failed: ${err.message}`));
    return false;
  }
}

let success = false;
const run = async () => {
  const serviceOk = await testConnection("SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
  const anonOk = await testConnection("ANON_KEY", ANON_KEY);
  success = serviceOk || anonOk;

  if (!success) {
    console.error(chalk.red("\n💥 No valid Supabase connection established. Check URL/keys or resume your Supabase project."));
    process.exit(1);
  } else {
    console.log(chalk.blue("\nSupabase verification complete."));
    process.exit(0);
  }
};

run();
