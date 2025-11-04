import fs from "fs";
import path from "path";

const cachePath = path.resolve(".next");

if (fs.existsSync(cachePath)) {
  console.log("🧹 Cleaning stale Next.js build cache...");
  fs.rmSync(cachePath, { recursive: true, force: true });
} else {
  console.log("✅ No stale cache found, continuing build...");
}
