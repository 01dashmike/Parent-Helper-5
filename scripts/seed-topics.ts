import { fileURLToPath } from "node:url";
import { getSupabaseServer } from "../lib/supabase.server";

const TOPICS = [
  { topic: "Gentle sleep strategies for newborns", category: "Parenting Advice", intent: "evergreen" },
  { topic: "Tummy time play ideas for rainy days", category: "Activities", intent: "evergreen" },
  { topic: "Sensory play benefits for toddlers", category: "Activities", intent: "evergreen" },
  { topic: "Budget-friendly baby essentials checklist", category: "Parenting Advice", intent: "evergreen" },
  { topic: "Getting started with baby sign language", category: "Parenting Advice", intent: "evergreen" },
  { topic: "Navigating childcare options in the UK", category: "Parenting Advice", intent: "evergreen" },
  {
    topic: "Local guide: things to do with a toddler in Andover",
    category: "Local Guide",
    intent: "local_guide",
    target_locality: "Andover",
    target_postcode_prefix: "SP10",
  },
  {
    topic: "Local guide: exploring Harpenden with little ones",
    category: "Local Guide",
    intent: "local_guide",
    target_locality: "Harpenden",
    target_postcode_prefix: "AL5",
  },
];

export async function seedTopics() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }
  const { error } = await supabase.from("blog_topics_queue").insert(TOPICS);
  if (error) {
    throw new Error(`Failed to seed topics: ${error.message}`);
  }
}

async function run() {
  await seedTopics();
  // eslint-disable-next-line no-console
  console.log("Seeded topics");
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
