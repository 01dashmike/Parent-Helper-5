/**
 * Ensures required Supabase tables and bucket exist, then verifies connectivity.
 */

import chalk from "chalk";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import path from "path";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(chalk.red("❌ Missing Supabase credentials in .env.local"));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { fetch });

const requiredTables = [
  "blog_posts_ai",
  "blog_topics_queue",
  "blog_views",
];

async function getExistingTables() {
  if (!DATABASE_URL) {
    console.warn(
      chalk.yellow(
        "⚠️ DATABASE_URL not set; attempting to inspect tables via Supabase metadata."
      )
    );
    const { data, error } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public");
    if (error) {
      console.error(chalk.red("❌ Unable to inspect tables:"), error.message);
      return [];
    }
    return data.map((row) => row.tablename);
  }

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(
      "select tablename from pg_tables where schemaname = 'public'"
    );
    return res.rows.map((row) => row.tablename);
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️ Unable to query tables via DATABASE_URL (${error.message}). Falling back to Supabase metadata.`
      )
    );
    const { data, error: metaError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public");
    if (metaError) {
      console.error(chalk.red("❌ Unable to inspect tables:"), metaError.message);
      return [];
    }
    return data.map((row) => row.tablename);
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function createMissingSchema(missing) {
  if (!DATABASE_URL) {
    console.error(
      chalk.red(
        "❌ Cannot create tables automatically without DATABASE_URL. Please provide it in .env.local."
      )
    );
    return false;
  }

  const ddl = `
    create extension if not exists "uuid-ossp";
    create table if not exists public.blog_posts_ai (
      id uuid primary key default uuid_generate_v4(),
      title text not null,
      slug text unique not null,
      excerpt text,
      content text,
      category text,
      locality text,
      author text default 'Parent Helper Editorial',
      status text default 'draft',
      sources jsonb default '[]'::jsonb,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    create table if not exists public.blog_topics_queue (
      id uuid primary key default uuid_generate_v4(),
      topic text not null,
      status text default 'pending',
      created_at timestamptz default now()
    );
    create table if not exists public.blog_views (
      id bigserial primary key,
      slug text not null,
      ip text,
      created_at timestamptz default now()
    );
    alter table public.blog_posts_ai enable row level security;
    alter table public.blog_topics_queue enable row level security;
    alter table public.blog_views enable row level security;
  `;

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(ddl);
    return true;
  } catch (error) {
    console.error(chalk.red("❌ Error creating tables:"), error.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket("blog");
  if (error && !error.message?.toLowerCase().includes("not found")) {
    console.error(chalk.red("❌ Error checking storage bucket:"), error.message);
    return;
  }
  if (!data) {
    const { error: createError } = await supabase.storage.createBucket("blog", {
      public: true,
    });
    if (createError) {
      console.error(chalk.red("❌ Failed to create 'blog' bucket:"), createError.message);
    } else {
      console.log(chalk.green("✅ Created 'blog' storage bucket."));
    }
  } else {
    console.log(chalk.green("✅ 'blog' storage bucket exists."));
  }
}

async function verifyKey(label, key) {
  if (!key) {
    console.warn(chalk.yellow(`⚠️ Missing ${label}.`));
    return false;
  }
  try {
    const client = createClient(SUPABASE_URL, key, { fetch });
    const { error } = await client.from("blog_posts_ai").select("id").limit(1);
    if (error) throw error;
    console.log(chalk.green(`✅ Verified Supabase access with ${label}.`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${label} failed:`), error.message);
    return false;
  }
}

async function run() {
  console.log(chalk.cyan("🔍 Checking Supabase schema..."));
  const existing = await getExistingTables();
  const missing = requiredTables.filter((table) => !existing.includes(table));

  let schemaOk = true;

  if (missing.length === 0) {
    console.log(chalk.green("✅ All blog-related tables already exist."));
  } else {
    console.log(chalk.yellow(`🧩 Creating missing tables: ${missing.join(", ")}`));
    const ok = await createMissingSchema(missing);
    if (ok) {
      console.log(chalk.green("✅ Missing tables created successfully."));
    } else {
      console.error(chalk.red("💥 Unable to ensure tables. See errors above."));
      schemaOk = false;
    }
  }

  await ensureBucket();

  console.log(chalk.cyan("\n🔐 Verifying Supabase credentials..."));
  const serviceOk = await verifyKey("SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
  const anonOk = await verifyKey("ANON_KEY", ANON_KEY);

  if (!schemaOk) {
    console.error(
      chalk.red(
        "\n💥 Supabase schema could not be verified or repaired automatically. Check DATABASE_URL connectivity or create tables manually."
      )
    );
  }

  const connectionOk = serviceOk || anonOk;
  if (!connectionOk) {
    console.error(
      chalk.red(
        "\n💥 No valid Supabase connection established. Check URL/keys or resume your Supabase project."
      )
    );
  }

  if (schemaOk && connectionOk) {
    console.log(chalk.blue("\n🏁 Supabase schema verified."));
    process.exit(0);
  }

  process.exit(1);
}

run().catch((error) => {
  console.error(chalk.red("💥 Schema check failed:"), error.message ?? error);
  process.exit(1);
});
