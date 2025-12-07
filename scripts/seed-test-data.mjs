#!/usr/bin/env node
/**
 * Seed test data for automated testing
 * Creates demo families, providers, classes, and analytics events
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seedTestData() {
  console.log("🌱 Seeding test data...");

  try {
    // 1. Seed demo families (bronze/silver/gold tiers)
    console.log("Creating demo families...");
    const families = [
      {
        email: "bronze-family@test.parenthelper.co.uk",
        name: "Bronze Family",
        loyalty_tier: "bronze",
        engagement_score: 30,
        bookings_count: 1,
      },
      {
        email: "silver-family@test.parenthelper.co.uk",
        name: "Silver Family",
        loyalty_tier: "silver",
        engagement_score: 75,
        bookings_count: 5,
      },
      {
        email: "gold-family@test.parenthelper.co.uk",
        name: "Gold Family",
        loyalty_tier: "gold",
        engagement_score: 150,
        bookings_count: 10,
      },
    ];

    for (const family of families) {
      const { error } = await supabase.from("users").upsert(
        {
          email: family.email,
          full_name: family.name,
          metadata: {
            loyalty_tier: family.loyalty_tier,
            engagement_score: family.engagement_score,
            bookings_count: family.bookings_count,
          },
        },
        { onConflict: "email" }
      );

      if (error) {
        console.warn(`Failed to create family ${family.email}:`, error.message);
      } else {
        console.log(`✅ Created ${family.name}`);
      }
    }

    // 2. Seed providers
    console.log("Creating providers...");
    const providers = [
      {
        name: "Test Provider 1",
        contact_email: "provider1@test.parenthelper.co.uk",
        contact_phone: "+44 20 1234 5678",
        status: "active",
      },
      {
        name: "Test Provider 2",
        contact_email: "provider2@test.parenthelper.co.uk",
        contact_phone: "+44 20 9876 5432",
        status: "active",
      },
    ];

    const providerIds = [];
    for (const provider of providers) {
      const { data, error } = await supabase
        .from("providers")
        .upsert(provider, { onConflict: "contact_email" })
        .select("id")
        .single();

      if (error) {
        console.warn(`Failed to create provider ${provider.name}:`, error.message);
      } else {
        providerIds.push(data.id);
        console.log(`✅ Created ${provider.name} (ID: ${data.id})`);
      }
    }

    // 3. Seed sample classes
    console.log("Creating sample classes...");
    if (providerIds.length > 0) {
      const classes = [
        {
          name: "Baby Sensory London",
          description: "Interactive sensory play for babies 6-12 months",
          provider_id: providerIds[0],
          town: "London",
          postcode: "SW1A 1AA",
          category: "sensory",
          age_group_min: 6,
          age_group_max: 12,
          is_featured: true,
        },
        {
          name: "Toddler Music Manchester",
          description: "Music and movement for toddlers",
          provider_id: providerIds[1],
          town: "Manchester",
          postcode: "M1 1AA",
          category: "music",
          age_group_min: 12,
          age_group_max: 24,
          is_featured: false,
        },
        {
          name: "Baby Yoga Birmingham",
          description: "Gentle yoga for babies and parents",
          provider_id: providerIds[0],
          town: "Birmingham",
          postcode: "B1 1AA",
          category: "yoga",
          age_group_min: 3,
          age_group_max: 12,
          is_featured: true,
        },
      ];

      for (const classData of classes) {
        const { error } = await supabase.from("classes").upsert(classData, {
          onConflict: "name",
        });

        if (error) {
          console.warn(`Failed to create class ${classData.name}:`, error.message);
        } else {
          console.log(`✅ Created ${classData.name}`);
        }
      }
    }

    // 4. Seed city (London) with expert tips
    console.log("Creating city data...");
    const { error: cityError } = await supabase.from("cities").upsert(
      {
        slug: "london",
        name: "London",
        description: "Discover baby and toddler classes in London",
        expert_tips: [
          "Many classes offer trial sessions - always worth asking!",
          "Parking can be limited, check public transport options",
          "Book early for popular classes as they fill up quickly",
        ],
      },
      { onConflict: "slug" }
    );

    if (cityError) {
      console.warn("Failed to create city:", cityError.message);
    } else {
      console.log("✅ Created London city data");
    }

    // 5. Seed mock analytics events for dashboards
    console.log("Creating analytics events...");
    const events = [
      {
        event_type: "search",
        payload: {
          query: "baby sensory",
          location: "London",
          category: "sensory",
        },
        session_id: "test-session-1",
      },
      {
        event_type: "class_viewed",
        payload: {
          class_id: 1,
          class_name: "Baby Sensory London",
        },
        session_id: "test-session-1",
      },
      {
        event_type: "search",
        payload: {
          query: "music classes",
          location: "Manchester",
        },
        session_id: "test-session-2",
      },
      {
        event_type: "provider_signup_started",
        payload: {
          provider_name: "New Provider",
        },
        session_id: "test-session-3",
      },
    ];

    for (const event of events) {
      const { error } = await supabase.from("analytics_events").insert(event);

      if (error) {
        console.warn(`Failed to create event ${event.event_type}:`, error.message);
      }
    }

    console.log(`✅ Created ${events.length} analytics events`);

    console.log("\n✨ Test data seeding complete!");
    console.log("\nTest credentials:");
    console.log("  Bronze Family: bronze-family@test.parenthelper.co.uk");
    console.log("  Silver Family: silver-family@test.parenthelper.co.uk");
    console.log("  Gold Family: gold-family@test.parenthelper.co.uk");
    console.log("  Provider 1: provider1@test.parenthelper.co.uk");
    console.log("  Provider 2: provider2@test.parenthelper.co.uk");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  }
}

seedTestData();

