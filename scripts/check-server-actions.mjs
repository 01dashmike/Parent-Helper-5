// Fail build if a 'use server' file exports anything that's not an async function

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const badFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip common output dirs
      if ([".next", "node_modules", "public", "backups"].includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const src = fs.readFileSync(full, "utf8");
      if (!/^(['"])use server\1/m.test(src)) continue;

      // Find any non-async exports
      // - allow: export async function foo(...) { ... }
      // - disallow: export { something }, export const x = ..., export function notAsync...
      const reIllegal =
        /export\s+(?:\{[\s\S]*?\}|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|function\s+(?!async))/m;

      if (reIllegal.test(src)) badFiles.push(full);
    }
  }
}

walk(path.join(root, "app"));
walk(path.join(root, "components")); // sometimes actions live with components

if (badFiles.length) {
  console.error("\n🚫 Invalid exports in 'use server' modules:");
  for (const f of badFiles) console.error(" -", path.relative(root, f));
  console.error(
    "\nFix: move schemas/types/constants to separate non-'use server' files (e.g. schema.ts)\n" +
      "and only export async functions from server action files."
  );
  process.exit(1);
} else {
  console.log("✅ Server action exports look good.");
}





