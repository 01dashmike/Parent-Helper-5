#!/usr/bin/env tsx

import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const activities = [
  {
    name: "Baby Yoga Winchester",
    description: "Gentle poses and bonding time for new parents and babies.",
    category: "Parent & Baby",
    town: "Winchester",
    postcode: "SO23 7AB",
    latitude: 51.0629,
    longitude: -1.3131,
    is_active: true,
  },
  {
    name: "Toddler Music Makers",
    description: "Sing-along sessions with instruments for curious toddlers.",
    category: "Music & Movement",
    town: "Southampton",
    postcode: "SO14 0DA",
    latitude: 50.9097,
    longitude: -1.4043,
    is_active: true,
  },
  {
    name: "Storytime at The Library",
    description: "Interactive storytelling and craft for under fives.",
    category: "Arts & Crafts",
    town: "Basingstoke",
    postcode: "RG21 7LS",
    latitude: 51.2665,
    longitude: -1.0926,
    is_active: true,
  },
  {
    name: "Mini Explorers Forest School",
    description: "Outdoor adventures helping children learn through nature.",
    category: "Outdoors & Nature",
    town: "Andover",
    postcode: "SP10 3UL",
    latitude: 51.2114,
    longitude: -1.4939,
    is_active: true,
  },
  {
    name: "Splash Babies Swimming",
    description: "Warm water swimming lessons led by experienced instructors.",
    category: "Swimming",
    town: "Winchester",
    postcode: "SO22 5DD",
    latitude: 51.0658,
    longitude: -1.3379,
    is_active: true,
  },
  {
    name: "Saturday Drama Club",
    description: "Confidence-building drama games and performances for ages 6-9.",
    category: "Dance & Drama",
    town: "Salisbury",
    postcode: "SP1 2AA",
    latitude: 51.0693,
    longitude: -1.7957,
    is_active: true,
  },
  {
    name: "Creative Messy Play",
    description: "Sensory stations and messy play in a relaxed setting.",
    category: "Soft Play",
    town: "Fareham",
    postcode: "PO16 0JN",
    latitude: 50.854,
    longitude: -1.179,
    is_active: true,
  },
  {
    name: "After School Coding Lab",
    description: "Intro to coding with robots and games for ages 8-11.",
    category: "STEM",
    town: "Portsmouth",
    postcode: "PO1 2AB",
    latitude: 50.799,
    longitude: -1.091,
    is_active: true,
  },
  {
    name: "Mindful Movers",
    description: "Breathing exercises and gentle stretches for anxious tweens.",
    category: "Wellbeing",
    town: "Winchester",
    postcode: "SO22 4NR",
    latitude: 51.071,
    longitude: -1.335,
    is_active: true,
  },
  {
    name: "Family Cycling Sunday",
    description: "Guided cycle routes with bike safety tips for families.",
    category: "Outdoors & Nature",
    town: "Southampton",
    postcode: "SO16 0YP",
    latitude: 50.9361,
    longitude: -1.4366,
    is_active: true,
  },
  {
    name: "Mini Makers Art Lab",
    description: "Hands-on art experiments inspired by famous artists.",
    category: "Arts & Crafts",
    town: "Bournemouth",
    postcode: "BH2 5LH",
    latitude: 50.7208,
    longitude: -1.8795,
    is_active: true,
  },
  {
    name: "Underwater Explorers",
    description: "Swimming skills and underwater games for ages 5-7.",
    category: "Swimming",
    town: "Poole",
    postcode: "BH15 1LD",
    latitude: 50.715,
    longitude: -1.987,
    is_active: true,
  },
  {
    name: "Little Scientists Lab",
    description: "Exciting experiments and STEM challenges each week.",
    category: "STEM",
    town: "Reading",
    postcode: "RG1 4QA",
    latitude: 51.4543,
    longitude: -0.9781,
    is_active: true,
  },
  {
    name: "Sunrise Baby Massage",
    description: "Certified instructors guide soothing massage routines.",
    category: "Parent & Baby",
    town: "Guildford",
    postcode: "GU1 3QT",
    latitude: 51.2362,
    longitude: -0.5704,
    is_active: true,
  },
  {
    name: "Junior Parkour Club",
    description: "Safe parkour basics and obstacle challenges for kids 9-12.",
    category: "Sports",
    town: "Winchester",
    postcode: "SO23 9NR",
    latitude: 51.0614,
    longitude: -1.3137,
    is_active: true,
  },
  {
    name: "Parent Support Circle",
    description: "Weekly drop-in space with parenting specialists and coffee.",
    category: "Support Groups",
    town: "Alton",
    postcode: "GU34 1HT",
    latitude: 51.149,
    longitude: -0.975,
    is_active: true,
  },
  {
    name: "Weekend Adventure Club",
    description: "Outdoor survival and teamwork activities for adventurous kids.",
    category: "Outdoors & Nature",
    town: "New Forest",
    postcode: "SO42 7WN",
    latitude: 50.8202,
    longitude: -1.5813,
    is_active: true,
  },
  {
    name: "Tiny Tumblers Gymnastics",
    description: "Balance and coordination with soft equipment for under fives.",
    category: "Soft Play",
    town: "Chichester",
    postcode: "PO19 1QG",
    latitude: 50.8367,
    longitude: -0.7792,
    is_active: true,
  },
  {
    name: "Junior Creative Writing Lab",
    description: "Imaginative prompts and storytelling for ages 8-11.",
    category: "Literacy",
    town: "Salisbury",
    postcode: "SP2 7GL",
    latitude: 51.0743,
    longitude: -1.8075,
    is_active: true,
  },
  {
    name: "Family Choir Evenings",
    description: "Feel-good singing for families with live accompanist.",
    category: "Music & Movement",
    town: "Winchester",
    postcode: "SO23 0LB",
    latitude: 51.058,
    longitude: -1.304,
    is_active: true,
  },
];

async function main() {
  console.log(`Seeding ${activities.length} classes...`);
  const { error } = await supabase.from("classes").upsert(activities, {
    onConflict: "name",
  });

  if (error) {
    console.error("Failed to seed classes:", error);
    process.exit(1);
  }

  console.log(
    "✅ Seed data inserted. Run supabase/sql/search.sql to refresh indexes and geo data."
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("Unexpected error while seeding:", error);
  process.exit(1);
});
