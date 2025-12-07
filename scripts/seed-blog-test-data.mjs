/**
 * Seed Blog Test Data
 * 
 * Creates sample blog posts for testing the blog engine.
 * Run with: node scripts/seed-blog-test-data.mjs
 */

import { getSupabaseServer } from "../lib/supabase.server.js";

const BLOG_POSTS = [
  {
    title: "10 Sensory Play Ideas for Rainy Days",
    slug: "10-sensory-play-ideas-rainy-days",
    excerpt: "Keep little ones engaged indoors with these creative sensory activities that require minimal setup.",
    category: "Activities",
    locality: "London",
    postcode_prefix: "SW",
    status: "published",
    body_markdown: `# 10 Sensory Play Ideas for Rainy Days

When the weather keeps you indoors, sensory play is a wonderful way to keep babies and toddlers engaged. Here are our top 10 ideas:

## 1. Rice Sensory Bin
Fill a shallow container with uncooked rice and add scoops, cups, and small toys. Great for fine motor skills!

## 2. Water Play
Set up a water table or use a large bowl. Add measuring cups, funnels, and bath toys.

## 3. Playdough Fun
Homemade or store-bought playdough with cookie cutters and rolling pins.

*And 7 more ideas...*`,
    seo_title: "10 Sensory Play Ideas for Rainy Days | Parent Helper",
    seo_description: "Discover creative indoor sensory activities to keep babies and toddlers engaged on rainy days.",
    tags: ["sensory play", "indoor activities", "toddler activities"],
    reading_time_minutes: 5,
  },
  {
    title: "Gentle Sleep Strategies for Newborns",
    slug: "gentle-sleep-strategies-newborns",
    excerpt: "Evidence-based approaches to help your newborn establish healthy sleep patterns without sleep training.",
    category: "Parenting Advice",
    locality: "Manchester",
    postcode_prefix: "M",
    status: "published",
    body_markdown: `# Gentle Sleep Strategies for Newborns

Establishing healthy sleep patterns in the early months doesn't have to mean strict routines. Here's what works:

## Understanding Newborn Sleep
Newborns sleep in short cycles and wake frequently for feeding. This is normal and necessary.

## Creating a Calm Environment
- Dim lights in the evening
- White noise can help
- Consistent bedtime routine

*More strategies...*`,
    seo_title: "Gentle Sleep Strategies for Newborns | Parent Helper",
    seo_description: "Learn gentle, evidence-based approaches to help your newborn establish healthy sleep patterns.",
    tags: ["sleep", "newborn", "parenting"],
    reading_time_minutes: 8,
  },
  {
    title: "Local Guide: Exploring Harpenden with Little Ones",
    slug: "local-guide-harpenden-little-ones",
    excerpt: "Discover the best baby and toddler-friendly spots in Harpenden, from parks to cafes and classes.",
    category: "Local Guide",
    locality: "Harpenden",
    postcode_prefix: "AL5",
    status: "published",
    body_markdown: `# Local Guide: Exploring Harpenden with Little Ones

Harpenden offers wonderful opportunities for families. Here's our guide:

## Parks and Playgrounds
- **Rothamsted Park** - Large open space with playground
- **Lydekker Park** - Smaller, quieter option

## Family-Friendly Cafes
- Several cafes welcome families with high chairs and changing facilities

## Local Classes
Find music, sensory, and movement classes throughout the week.

*More local recommendations...*`,
    seo_title: "Local Guide: Exploring Harpenden with Little Ones | Parent Helper",
    seo_description: "Discover the best baby and toddler-friendly spots, parks, cafes, and classes in Harpenden.",
    tags: ["local guide", "Harpenden", "family activities"],
    reading_time_minutes: 6,
  },
  {
    title: "Budget-Friendly Baby Essentials Checklist",
    slug: "budget-friendly-baby-essentials-checklist",
    excerpt: "A practical guide to what you really need for your baby, without breaking the bank.",
    category: "Parenting Advice",
    locality: null,
    postcode_prefix: null,
    status: "published",
    body_markdown: `# Budget-Friendly Baby Essentials Checklist

You don't need everything the baby stores suggest! Here's what's truly essential:

## Must-Haves
- Safe sleep space (crib or bassinet)
- Car seat (required by law)
- Nappies and wipes
- Basic clothing (onesies, sleepsuits)

## Nice-to-Haves
- Baby carrier
- Changing mat
- Muslin cloths

*Full checklist...*`,
    seo_title: "Budget-Friendly Baby Essentials Checklist | Parent Helper",
    seo_description: "A practical guide to essential baby items without overspending. What you really need vs. what's nice to have.",
    tags: ["baby essentials", "budget", "new parents"],
    reading_time_minutes: 7,
  },
  {
    title: "Getting Started with Baby Sign Language",
    slug: "getting-started-baby-sign-language",
    excerpt: "Learn how to introduce simple signs to help your baby communicate before they can speak.",
    category: "Parenting Advice",
    locality: "Birmingham",
    postcode_prefix: "B",
    status: "published",
    body_markdown: `# Getting Started with Baby Sign Language

Baby sign language can help reduce frustration and strengthen communication. Here's how to start:

## Why Sign Language?
- Reduces frustration
- Strengthens parent-child bond
- Can accelerate spoken language

## First Signs to Teach
- Milk
- More
- All done
- Sleep

*More tips and resources...*`,
    seo_title: "Getting Started with Baby Sign Language | Parent Helper",
    seo_description: "Learn how to introduce simple signs to help your baby communicate before they can speak.",
    tags: ["sign language", "communication", "baby development"],
    reading_time_minutes: 6,
  },
];

async function seedBlogData() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error("❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  console.log("🌱 Seeding blog test data...");

  try {
    for (const post of BLOG_POSTS) {
      const { data, error } = await supabase
        .from("blog_posts_ai")
        .upsert(post, {
          onConflict: "slug",
        })
        .select()
        .single();

      if (error) {
        console.warn(`⚠️  Failed to seed post "${post.title}":`, error.message);
      } else {
        console.log(`✅ Seeded: ${post.title}`);
      }
    }

    console.log("\n✅ Blog test data seeded successfully!");
    console.log(`\n📝 Created ${BLOG_POSTS.length} blog posts`);
    console.log(`\n🔗 Test routes:`);
    console.log(`   /blog (listing page)`);
    console.log(`   /blog/${BLOG_POSTS[0].slug} (individual post)`);

  } catch (error) {
    console.error("❌ Error seeding blog data:", error);
    process.exit(1);
  }
}

seedBlogData();
