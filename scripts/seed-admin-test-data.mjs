/**
 * Seed Admin Test Data
 * 
 * Creates a test admin user for testing admin flows.
 * Run with: node scripts/seed-admin-test-data.mjs
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local first, then fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

const TEST_ADMIN_EMAIL = "admin-test@parenthelper.co.uk";
const TEST_ADMIN_PASSWORD = "TestAdmin123!";

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

async function seedAdminData() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error("❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
    console.error("   SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing");
    process.exit(1);
  }

  console.log("🌱 Seeding admin test data...");

  try {
    // 1. Create admin user in Supabase Auth
    let finalUserId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes("already registered") || authError.code === "email_exists") {
        // User exists, find it
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === TEST_ADMIN_EMAIL);
        if (!user) {
          throw new Error("User exists but could not be found");
        }
        console.log("✅ Admin user already exists:", user.id);
        finalUserId = user.id;
      } else {
        throw authError;
      }
    } else {
      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("User created but no ID returned");
      }
      console.log("✅ Created admin user:", userId);
      finalUserId = userId;
    }

    // 2. Check if public.users table exists, then create/update user record
    // First, verify the table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from("users")
      .select("id")
      .limit(0);
    
    if (tableCheckError) {
      if (tableCheckError.message?.includes("does not exist") || tableCheckError.code === "42P01") {
        console.error("\n❌ The 'public.users' table does not exist!");
        console.error("\n📝 To fix this:");
        console.error("   1. Open your Supabase SQL Editor");
        console.error("   2. Run the SQL script: scripts/create-users-table.sql");
        console.error("   3. Then run this seed script again");
        console.error("\n   Or run this SQL directly in Supabase SQL Editor:");
        console.error("   ┌─────────────────────────────────────────────────────────┐");
        console.error("   │ CREATE TABLE IF NOT EXISTS public.users (                │");
        console.error("   │   id UUID PRIMARY KEY REFERENCES auth.users(id),        │");
        console.error("   │   email TEXT NOT NULL,                                  │");
        console.error("   │   role TEXT DEFAULT NULL,                                │");
        console.error("   │   created_at TIMESTAMPTZ DEFAULT NOW(),                │");
        console.error("   │   updated_at TIMESTAMPTZ DEFAULT NOW()                  │");
        console.error("   │ );                                                       │");
        console.error("   └─────────────────────────────────────────────────────────┘");
        process.exit(1);
      }
      // Other errors might be RLS-related, continue anyway
    }
    
    // Now try to create/update user record with admin role
    let roleSet = false;
    
    // Approach 1: Try upsert with role
    const { error: upsertError } = await supabase
      .from("users")
      .upsert({
        id: finalUserId,
        email: TEST_ADMIN_EMAIL,
        role: "admin",
      }, {
        onConflict: "id",
      });
    
    if (!upsertError) {
      console.log("✅ Set user role to admin");
      roleSet = true;
    } else {
      // Approach 2: Try insert (may fail if user exists)
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: finalUserId,
          email: TEST_ADMIN_EMAIL,
          role: "admin",
        });
      
      if (!insertError) {
        console.log("✅ Set user role to admin (via insert)");
        roleSet = true;
      } else {
        // Approach 3: Try update only
        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            email: TEST_ADMIN_EMAIL,
            role: "admin",
          })
          .eq("id", finalUserId);
        
        if (!updateError) {
          console.log("✅ Set user role to admin (via update)");
          roleSet = true;
        } else {
          // Approach 4: Try without role column (in case it doesn't exist)
          const { error: simpleUpsertError } = await supabase
            .from("users")
            .upsert({
              id: finalUserId,
              email: TEST_ADMIN_EMAIL,
            }, {
              onConflict: "id",
            });
          
          if (!simpleUpsertError) {
            console.log("⚠️  Created user record but could not set role");
            console.log("⚠️  The 'role' column may not exist in the users table.");
            console.log("\n📝 To fix this:");
            console.log("   1. Run the SQL script: scripts/create-users-table.sql in Supabase SQL Editor");
            console.log("   2. Or run this SQL directly:");
            console.log("   ┌─────────────────────────────────────────────────────────┐");
            console.log("   │ ALTER TABLE public.users                                │");
            console.log("   │ ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;        │");
            console.log("   │                                                        │");
            console.log("   │ UPDATE public.users                                    │");
            console.log("   │ SET role = 'admin'                                    │");
            console.log(`   │ WHERE id = '${finalUserId}';                          │`);
            console.log("   └─────────────────────────────────────────────────────────┘");
            console.log("\n   After adding the column, run this script again to set the role.");
          } else {
            console.log("⚠️  Could not update users table. This may be due to:");
            console.log("   - Missing 'role' column (add it with ALTER TABLE)");
            console.log("   - RLS policies blocking the operation");
            console.log("   - Table structure differences");
            console.log("⚠️  Auth user was created successfully and can log in.");
            console.log("⚠️  Admin access will require the role to be set manually.");
          }
        }
      }
    }

    if (!roleSet) {
      console.log("\n⚠️  Admin test data partially seeded:");
      console.log("   ✅ Auth user created/exists");
      console.log("   ⚠️  Role not set in users table");
    } else {
      console.log("\n✅ Admin test data seeded successfully!");
    }
    console.log(`\n📧 Login credentials:`);
    console.log(`   Email: ${TEST_ADMIN_EMAIL}`);
    console.log(`   Password: ${TEST_ADMIN_PASSWORD}`);
    console.log(`\n🔗 Test routes:`);
    console.log(`   /admin/login`);
    console.log(`   /admin (will redirect to login if not authenticated)`);
    console.log(`   /admin/blogs`);
    console.log(`   /admin/insights`);

  } catch (error) {
    console.error("❌ Error seeding admin data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

seedAdminData();
