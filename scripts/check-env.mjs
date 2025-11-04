import fs from "fs";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ADMIN_SECRET",
];

let envContents = "";
try {
  envContents = fs.readFileSync(".env.local", "utf-8");
} catch (error) {
  console.error("⚠️ Unable to read .env.local. Make sure it exists at project root.");
  process.exit(1);
}

const missing = required.filter((key) => !envContents.includes(`${key}=`));

if (missing.length) {
  console.error("⚠️ Missing environment variables:\n" + missing.join("\n"));
  process.exit(1);
}

console.log("✅ All required environment variables are present.");
