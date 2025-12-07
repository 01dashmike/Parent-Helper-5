#!/usr/bin/env node

/**
 * Seed script to create demo families with different loyalty tiers
 * Usage: node scripts/seed-loyalty-demo.mjs
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const demoFamilies = [
  {
    name: "The Smiths",
    email: "smiths-demo@parenthelper.co.uk",
    tier: "bronze",
    loyaltyScore: 15,
    conversions: 2,
    streakDays: 3,
    visitsCount: 10,
  },
  {
    name: "The Jones Family",
    email: "jones-demo@parenthelper.co.uk",
    tier: "silver",
    loyaltyScore: 45,
    conversions: 7,
    streakDays: 12,
    visitsCount: 35,
    recsClicked: 8,
    blogReads: 5,
  },
  {
    name: "The Williams Family",
    email: "williams-demo@parenthelper.co.uk",
    tier: "gold",
    loyaltyScore: 72,
    conversions: 15,
    streakDays: 28,
    visitsCount: 85,
    recsClicked: 25,
    blogReads: 12,
  },
  {
    name: "The Brown Family",
    email: "brown-demo@parenthelper.co.uk",
    tier: "platinum",
    loyaltyScore: 92,
    conversions: 30,
    streakDays: 45,
    visitsCount: 150,
    recsClicked: 50,
    blogReads: 20,
  },
];

async function seedLoyaltyDemo() {
  console.log("🌱 Seeding loyalty demo data...\n");

  for (const family of demoFamilies) {
    const familyId = randomUUID();
    const userId = randomUUID(); // Mock user ID
    
    // Create family profile (if table exists)
    try {
      await supabase
        .from("family_profiles")
        .upsert({
          id: familyId,
          user_id: userId,
          name: family.name,
          email: family.email,
          created_at: new Date().toISOString(),
        }, {
          onConflict: "email",
        });
      console.log(`✅ Created/updated family profile: ${family.name}`);
    } catch (error) {
      console.warn(`⚠️  Could not create family profile (table might not exist): ${error.message}`);
    }

    // Create engagement score
    const lastActive = new Date();
    lastActive.setDate(lastActive.getDate() - (family.streakDays > 0 ? 0 : 2));
    
    const lastStreakDate = family.streakDays > 0 
      ? new Date(lastActive.getTime() - (family.streakDays - 1) * 24 * 60 * 60 * 1000)
      : null;

    try {
      const { error: scoreError } = await supabase
        .from("engagement_scores")
        .upsert({
          family_id: familyId,
          visits_count: family.visitsCount,
          avg_session_time: 300, // 5 minutes
          last_active: lastActive.toISOString(),
          recs_clicked: family.recsClicked || 0,
          blog_reads: family.blogReads || 0,
          conversions: family.conversions,
          loyalty_score: family.loyaltyScore.toString(),
          loyalty_tier: family.tier,
          streak_days: family.streakDays,
          last_streak_date: lastStreakDate?.toISOString().split("T")[0] || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "family_id",
        });

      if (scoreError) {
        console.error(`❌ Error creating engagement score for ${family.name}:`, scoreError);
      } else {
        console.log(`✅ Created engagement score for ${family.name} (${family.tier} tier, ${family.streakDays} day streak)`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n✨ Loyalty demo seeding complete!");
  console.log("\nDemo families created:");
  demoFamilies.forEach((f) => {
    console.log(`  - ${f.name}: ${f.tier} tier (${f.conversions} bookings, ${f.streakDays} day streak)`);
  });
}

seedLoyaltyDemo().catch((error) => {
  console.error("💥 Seeding failed:", error);
  process.exit(1);
});

