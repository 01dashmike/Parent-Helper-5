/**
 * Add role column to users table
 * 
 * This script adds the 'role' column to the users table if it doesn't exist.
 * Run with: node scripts/add-users-role-column.mjs
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local first, then fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

async function addRoleColumn() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error("❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
    process.exit(1);
  }

  console.log("🔧 Adding 'role' column to users table...");

  try {
    // Try to check if column exists by selecting it
    const { error: checkError } = await supabase
      .from("users")
      .select("role")
      .limit(0);

    if (!checkError) {
      console.log("✅ 'role' column already exists in users table");
      return;
    }

    // Column doesn't exist, need to add it
    // Since Supabase JS client doesn't support DDL directly, we'll use the REST API
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Use Supabase's REST API to execute SQL
    // Note: This requires the pg_net extension or a custom function
    // For now, we'll provide instructions
    console.log("\n⚠️  Cannot automatically add column via Supabase JS client.");
    console.log("📝 Please run this SQL in your Supabase SQL Editor:\n");
    console.log("   ┌─────────────────────────────────────────────────────────┐");
    console.log("   │ ALTER TABLE public.users                                  │");
    console.log("   │ ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;          │");
    console.log("   └─────────────────────────────────────────────────────────┘");
    console.log("\n   Then run the seed script again:");
    console.log("   node scripts/seed-admin-test-data.mjs\n");

  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

addRoleColumn();
