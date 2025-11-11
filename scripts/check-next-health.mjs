#!/usr/bin/env node

import fs from "node:fs";

const REQUIRED = [
  ".next/server/pages/_document.js",
  ".next/server/pages/_app.js",
  ".next/server/build-manifest.json",
];

let bad = false;
for (const f of REQUIRED) {
  if (!fs.existsSync(f)) {
    console.error(`❌ Missing ${f}`);
    bad = true;
  } else if (fs.readFileSync(f, "utf8").includes("return null")) {
    console.error(`❌ Invalid content in ${f}`);
    bad = true;
  }
}

if (bad) {
  console.error("🚨 Run: node scripts/self-heal-next.mjs");
  process.exit(1);
} else {
  console.log("✅ Next.js health check passed");
}
