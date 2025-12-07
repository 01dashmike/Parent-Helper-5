#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();

async function scanAndFix(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !full.includes("node_modules") && !full.includes(".next")) {
      await scanAndFix(full);
    }
    if (e.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx"))) {
      let text = await fs.readFile(full, "utf8");
      const original = text;
      
      // Convert throw "text" → throw new Error("text")
      text = text.replace(/throw\s+["'`](.*?)["'`]/g, 'throw new Error("$1")');
      
      // Convert throw { msg } → throw toError({ msg })
      // Only if toError is imported
      if (text.includes('from "@/lib/errors"') || text.includes("from '../lib/errors'")) {
        text = text.replace(/throw\s+(\{[^}]*\})/g, 'throw toError($1)');
      }
      
      // Convert Promise.reject("text") → Promise.reject(new Error("text"))
      text = text.replace(/Promise\.reject\(["'`](.*?)["'`]\)/g, 'Promise.reject(new Error("$1"))');
      
      // Convert Promise.reject({ ... }) → Promise.reject(toError({ ... }))
      if (text.includes('from "@/lib/errors"') || text.includes("from '../lib/errors'")) {
        text = text.replace(/Promise\.reject\((\{[^}]*\})\)/g, 'Promise.reject(toError($1))');
      }
      
      if (text !== original) {
        console.log("🩹 Fixed bad throws in", full);
        await fs.writeFile(full, text);
      }
    }
  }
}

console.log("🔍 Scanning for error handling issues...");
await scanAndFix(path.join(root, "app"));
await scanAndFix(path.join(root, "components"));
await scanAndFix(path.join(root, "lib"));
console.log("✅ ESLint safety fix complete.");

