#!/usr/bin/env node
/**
 * Seed Demo Families Script
 * Creates two realistic demo families with profiles, children, and preferences
 * Then builds recommendations for each
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Generate random password
function generatePassword() {
  return randomBytes(16).toString("hex");
}

// Get postcode coordinates (simplified - in production use geocoding API)
const POSTCODE_COORDS = {
  "SW11 1AA": { lat: 51.4645, lng: -0.1645 }, // Clapham, London
  "M3 2BB": { lat: 53.4808, lng: -2.2426 }, // Manchester city centre
};

// Family A - The Parkers
const PARKERS_DATA = {
  email: "demo_mum@parenthelper.co.uk",
  household: "The Parkers",
  postcode: "SW11 1AA",
  children: [
    { firstName: "Lily", ageYears: 4, interests: ["dance", "art"] },
    { firstName: "Max", ageYears: 7, interests: ["football", "outdoor"] },
  ],
  preferences: {
    radius: 10,
    preferredDays: ["sat", "sun"],
    categories: ["creative", "sports"],
  },
};

// Family B - The Thompsons
const THOMPSONS_DATA = {
  email: "demo_grandparent@parenthelper.co.uk",
  household: "The Thompsons",
  postcode: "M3 2BB",
  children: [
    { firstName: "Ella", ageYears: 9, interests: ["music", "drama"] },
  ],
  preferences: {
    radius: 15,
    preferredDays: ["wed", "fri"],
    categories: ["performance", "music"],
  },
};

async function createUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      // User exists, fetch it
      const { data: existing } = await supabase.auth.admin.listUsers();
      const user = existing?.users?.find((u) => u.email === email);
      if (user) {
        console.log(`  ✓ User ${email} already exists`);
        return user;
      }
    }
    throw error;
  }

  console.log(`  ✓ Created user: ${email}`);
  return data.user;
}

async function createFamilyProfile(userId, household, postcode) {
  const coords = POSTCODE_COORDS[postcode] || { lat: null, lng: null };

  // Check if profile exists
  const { data: existing } = await supabase
    .from("family_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    console.log(`  ✓ Family profile already exists for ${household}`);
    return existing;
  }

  const { data, error } = await supabase
    .from("family_profiles")
    .insert({
      user_id: userId,
      household_name: household,
      postcode,
      home_lat: coords.lat,
      home_lng: coords.lng,
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`  ✓ Created family profile: ${household}`);
  return data;
}

async function createChildProfiles(familyId, children) {
  const profiles = [];

  for (const child of children) {
    const ageMonths = child.ageYears * 12;
    const birthdate = new Date();
    birthdate.setFullYear(birthdate.getFullYear() - child.ageYears);

    // Check if child exists
    const { data: existing } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("family_id", familyId)
      .eq("first_name", child.firstName)
      .single();

    if (existing) {
      console.log(`    ✓ Child ${child.firstName} already exists`);
      profiles.push(existing);
      continue;
    }

    const { data, error } = await supabase
      .from("child_profiles")
      .insert({
        family_id: familyId,
        first_name: child.firstName,
        age_months: ageMonths,
        interests: child.interests,
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`    ✓ Created child profile: ${child.firstName} (${child.ageYears} years)`);
    profiles.push(data);
  }

  return profiles;
}

async function createUserPreferences(userId, preferences) {
  // Check if preferences exist
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing preferences
    const { error } = await supabase
      .from("user_preferences")
      .update({
        default_radius_km: preferences.radius,
        preferred_days: preferences.preferredDays,
        preferred_categories: preferences.categories,
      })
      .eq("user_id", userId);

    if (error) throw error;
    console.log(`  ✓ Updated user preferences`);
    return existing;
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .insert({
      user_id: userId,
      default_radius_km: preferences.radius,
      preferred_days: preferences.preferredDays,
      preferred_categories: preferences.categories,
    })
    .select()
    .single();

  if (error) throw error;
  console.log(`  ✓ Created user preferences`);
  return data;
}

async function buildRecommendations(userId) {
  try {
    // Import the buildRecommendationsForUser function dynamically
    // Note: This requires the function to be available in the Node.js environment
    // For now, we'll use a direct database approach or skip if not available
    
    // Try to call via HTTP if NEXT_PUBLIC_APP_URL is set
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    try {
      const response = await fetch(`${siteUrl}/api/personalisation/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // We can't easily authenticate here, so recommendations will be built on first page load
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
    } catch (err) {
      // API call failed, will be built on first access
      console.log(`  ⚠ Recommendations will be built on first page access`);
    }
    
    return 0;
  } catch (err) {
    console.log(`  ⚠ Could not build recommendations: ${err.message}`);
    return 0;
  }
}

async function seedFamily(familyData) {
  console.log(`\n📦 Seeding ${familyData.household}...`);

  const password = generatePassword();
  const user = await createUser(familyData.email, password);
  const familyProfile = await createFamilyProfile(user.id, familyData.household, familyData.postcode);
  const children = await createChildProfiles(familyProfile.id, familyData.children);
  await createUserPreferences(user.id, familyData.preferences);

  // Note: Recommendations will be built when the demo page is accessed
  // or via the /api/demo/rebuild-recs endpoint
  console.log(`  ℹ️  Recommendations will be built on first page access`);
  const recCount = 0;

  return {
    email: familyData.email,
    password,
    userId: user.id,
    familyId: familyProfile.id,
    recCount,
  };
}

async function resetDemoData() {
  console.log("🗑️  Resetting demo data...");

  // Get demo user IDs
  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUserIds = users?.users
    ?.filter((u) => u.email?.includes("demo_"))
    ?.map((u) => u.id) || [];

  if (demoUserIds.length === 0) {
    console.log("  ✓ No demo users found to reset");
    return;
  }

  // Delete recommendations
  await supabase.from("recommendations").delete().in("user_id", demoUserIds);
  console.log("  ✓ Deleted recommendations");

  // Delete user preferences
  await supabase.from("user_preferences").delete().in("user_id", demoUserIds);
  console.log("  ✓ Deleted user preferences");

  // Delete child profiles (cascade will handle family_profiles)
  const { data: families } = await supabase
    .from("family_profiles")
    .select("id")
    .in("user_id", demoUserIds);

  if (families && families.length > 0) {
    const familyIds = families.map((f) => f.id);
    await supabase.from("child_profiles").delete().in("family_id", familyIds);
    console.log("  ✓ Deleted child profiles");
    await supabase.from("family_profiles").delete().in("id", familyIds);
    console.log("  ✓ Deleted family profiles");
  }

  // Note: We don't delete auth users to preserve consistency
  console.log("  ✓ Reset complete (auth users preserved)");
}

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes("--reset");

  console.log("🌱 Parent Helper Demo Families Seeder\n");

  if (shouldReset) {
    await resetDemoData();
  }

  try {
    const parkers = await seedFamily(PARKERS_DATA);
    const thompsons = await seedFamily(THOMPSONS_DATA);

    console.log("\n✅ Seeding complete!\n");
    console.log("📋 Demo Accounts:");
    console.log(`\n  ${PARKERS_DATA.household}:`);
    console.log(`    Email: ${parkers.email}`);
    console.log(`    Password: ${parkers.password}`);

    console.log(`\n  ${THOMPSONS_DATA.household}:`);
    console.log(`    Email: ${thompsons.email}`);
    console.log(`    Password: ${thompsons.password}`);

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Visit http://localhost:3000/demo/family-tour`);
    console.log(`   2. Click "Re-run AI Recommendations" to build recommendations`);
    console.log(`   3. Or run: curl -X POST http://localhost:3000/api/demo/rebuild-recs`);
    console.log(`\n🌐 View demo: http://localhost:3000/demo/family-tour\n`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

