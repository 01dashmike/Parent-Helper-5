/**
 * Seed Provider Test Data
 * 
 * Creates a test provider user and associated data for testing provider flows.
 * Run with: node scripts/seed-provider-test-data.mjs
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local first, then fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

const TEST_PROVIDER_EMAIL = "provider-test@parenthelper.co.uk";
const TEST_PROVIDER_PASSWORD = "TestProvider123!";

function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

async function seedProviderData() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error("❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
    console.error("   SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing");
    process.exit(1);
  }

  console.log("🌱 Seeding provider test data...");

  try {
    // 1. Create provider user in Supabase Auth
    let finalUserId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_PROVIDER_EMAIL,
      password: TEST_PROVIDER_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes("already registered") || authError.code === "email_exists") {
        // User exists, find it
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === TEST_PROVIDER_EMAIL);
        if (!user) {
          throw new Error("User exists but could not be found");
        }
        console.log("✅ Provider user already exists:", user.id);
        finalUserId = user.id;
      } else {
        throw authError;
      }
    } else {
      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("User created but no ID returned");
      }
      console.log("✅ Created provider user:", userId);
      finalUserId = userId;
    }

    // 2. Check if providers table exists, then create provider record
    const { error: providersTableCheck } = await supabase
      .from("providers")
      .select("id")
      .limit(0);
    
    if (providersTableCheck) {
      const isTableMissing = providersTableCheck.message?.includes("does not exist") || 
                            providersTableCheck.code === "42P01" || 
                            providersTableCheck.code === "PGRST204" ||
                            providersTableCheck.message?.includes("Could not find");
      
      if (isTableMissing) {
        console.error("\n❌ The 'providers' table does not exist or has a different structure!");
        console.error("\n📝 The providers table needs to be created via migrations.");
        console.error("   Please run your Supabase migrations to create the required tables.");
        console.error("\n   Error details:", providersTableCheck.message);
        console.error("   Error code:", providersTableCheck.code);
        process.exit(1);
      }
    }

    let providerId;
    // Try to create provider - the table uses 'business_name' and 'owner_email' (both NOT NULL)
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .insert({
        business_name: "Test Provider",
        slug: "test-provider",
        owner_email: TEST_PROVIDER_EMAIL,
      })
      .select()
      .single();

    if (providerError) {
      // Check if it's a column/schema issue
      if (providerError.code === "PGRST204" || providerError.message?.includes("Could not find")) {
        console.error("\n❌ Schema mismatch: The providers table structure doesn't match expected columns.");
        console.error("\n📝 This usually means:");
        console.error("   1. Migrations haven't been run, OR");
        console.error("   2. The table structure is different than expected");
        console.error("\n   Error:", providerError.message);
        console.error("\n   Please check your Supabase migrations and ensure they've been applied.");
        process.exit(1);
      }
      
      // Check for NOT NULL constraint violations
      if (providerError.code === "23502" && providerError.message?.includes("business_name")) {
        // Already tried with business_name, so this shouldn't happen, but handle it
        console.error("\n❌ The 'business_name' column is required but missing from insert.");
        throw providerError;
      }
      
      if (providerError.message?.includes("duplicate") || providerError.code === "23505") {
        // Provider might already exist
        const { data: existingProvider } = await supabase
          .from("providers")
          .select("id")
          .eq("slug", "test-provider")
          .single();
        
        if (existingProvider) {
          console.log("✅ Provider already exists:", existingProvider.id);
          providerId = existingProvider.id;
        } else {
          throw providerError;
        }
      } else {
        throw providerError;
      }
    } else {
      console.log("✅ Created provider:", provider.id);
      providerId = provider.id;
    }

    // 3. Check if providers_users table exists, then link user to provider
    const { error: providersUsersTableCheck } = await supabase
      .from("providers_users")
      .select("user_id")
      .limit(0);
    
    if (providersUsersTableCheck) {
      if (providersUsersTableCheck.message?.includes("does not exist") || providersUsersTableCheck.code === "42P01") {
        console.error("\n❌ The 'providers_users' table does not exist!");
        console.error("\n📝 The providers_users table needs to be created via migrations.");
        console.error("   Please run your Supabase migrations to create the required tables.");
        process.exit(1);
      }
    }

    // Link user to provider in providers_users table
    const { error: linkError } = await supabase
      .from("providers_users")
      .insert({
        user_id: finalUserId,
        provider_id: providerId,
        role: "owner",
        status: "active",
      });

    if (linkError) {
      if (linkError.message?.includes("duplicate") || linkError.code === "23505") {
        console.log("⚠️  Provider link already exists, continuing...");
      } else {
        console.error("❌ Error linking user to provider:", linkError);
        throw linkError;
      }
    } else {
      console.log("✅ Linked user to provider");
    }

    // 4. Create incomplete onboarding record (to test redirect)
    // Check if table exists first
    const { error: onboardingTableCheck } = await supabase
      .from("provider_onboarding")
      .select("provider_id")
      .limit(0);
    
    if (!onboardingTableCheck) {
      // Table exists, try to create record
      const { error: onboardingError } = await supabase
        .from("provider_onboarding")
        .insert({
          provider_id: providerId,
          is_complete: false,
          current_step: 1,
        });

      if (onboardingError) {
        if (onboardingError.message?.includes("duplicate") || onboardingError.code === "23505") {
          console.log("⚠️  Onboarding record already exists, continuing...");
        } else {
          console.log("⚠️  Could not create onboarding record (this is okay):", onboardingError.message);
        }
      } else {
        console.log("✅ Created onboarding record (incomplete)");
      }
    } else {
      console.log("⚠️  provider_onboarding table doesn't exist (this is okay for testing)");
    }

    console.log("\n✅ Provider test data seeded successfully!");
    console.log(`\n📧 Login credentials:`);
    console.log(`   Email: ${TEST_PROVIDER_EMAIL}`);
    console.log(`   Password: ${TEST_PROVIDER_PASSWORD}`);
    console.log(`\n🔗 Test routes:`);
    console.log(`   /provider/login`);
    console.log(`   /provider (will redirect to onboarding)`);
    console.log(`   /provider/onboarding/wizard`);

  } catch (error) {
    console.error("❌ Error seeding provider data:", error);
    process.exit(1);
  }
}

seedProviderData();
