#!/usr/bin/env node

/**
 * Safe Dead Code Cleanup
 * 
 * Only deletes files/exports that are confirmed unused after manual verification.
 * This script is conservative and requires explicit confirmation.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// Read the dead code report
const REPORT_PATH = path.join(ROOT, "dead-code-report.md");

interface CleanupAction {
  type: "delete" | "convert";
  file: string;
  export?: string;
  reason: string;
}

// Manually verified safe-to-delete files (after checking for false positives)
const SAFE_TO_DELETE: string[] = [
  // These are confirmed unused after manual verification
  // Add files here only after careful review
];

// Manually verified unused exports to convert to internal
const EXPORTS_TO_CONVERT: Array<{ file: string; export: string }> = [
  // Add exports here to convert from export to internal
];

function deleteFile(filePath: string): boolean {
  const fullPath = path.join(ROOT, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete ${filePath}:`, error);
    return false;
  }
}

function convertExportToInternal(filePath: string, exportName: string): boolean {
  const fullPath = path.join(ROOT, filePath);
  try {
    let content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split("\n");
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match export function/const/class/type
      if (exportName === "default") {
        // Convert export default to const
        if (/^export\s+default\s+(function|const|class)/.test(line)) {
          lines[i] = line.replace(/^export\s+default\s+/, "");
          modified = true;
        } else if (/^export\s+default/.test(line)) {
          // For other default exports, add const name
          const nextLine = lines[i + 1];
          if (nextLine && /^(\w+)/.test(nextLine)) {
            const name = nextLine.match(/^(\w+)/)?.[1];
            if (name) {
              lines[i] = `const ${name} = `;
              // Find the closing and add export at end
              let depth = 0;
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].includes("{")) depth++;
                if (lines[j].includes("}")) depth--;
                if (depth === 0 && lines[j].trim().endsWith(";")) {
                  lines[j] = lines[j].replace(/;$/, "");
                  lines.splice(j + 1, 0, `export default ${name};`);
                  break;
                }
              }
              modified = true;
            }
          }
        }
      } else {
        // Convert named export to internal
        const exportRegex = new RegExp(`^export\\s+(?:async\\s+)?(function|const|class|type|interface|enum)\\s+${exportName}\\b`);
        if (exportRegex.test(line)) {
          lines[i] = line.replace(/^export\s+/, "");
          modified = true;
        } else if (line.includes(`export {`) && line.includes(exportName)) {
          // Remove from export list
          const newLine = line.replace(new RegExp(`\\b${exportName}\\s*(?:,|})`, "g"), "").replace(/,?\s*,/, ",");
          if (newLine.match(/export\s*\{\s*\}/)) {
            // Empty export, remove line
            lines[i] = "";
          } else {
            lines[i] = newLine;
          }
          modified = true;
        }
      }
    }
    
    if (modified) {
      content = lines.filter(l => l !== "" || lines.indexOf(l) === 0).join("\n");
      fs.writeFileSync(fullPath, content, "utf8");
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to convert export in ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log("🧹 Safe Dead Code Cleanup\n");
  
  if (!fs.existsSync(REPORT_PATH)) {
    console.error("❌ Dead code report not found. Run find-dead-code.ts first.");
    process.exit(1);
  }
  
  const actions: CleanupAction[] = [];
  const results = {
    deleted: [] as string[],
    converted: [] as string[],
    failed: [] as string[],
  };
  
  // Process file deletions
  for (const file of SAFE_TO_DELETE) {
    if (deleteFile(file)) {
      results.deleted.push(file);
      actions.push({ type: "delete", file, reason: "Confirmed unused" });
    } else {
      results.failed.push(file);
    }
  }
  
  // Process export conversions
  for (const { file, export: exp } of EXPORTS_TO_CONVERT) {
    if (convertExportToInternal(file, exp)) {
      results.converted.push(`${file}:${exp}`);
      actions.push({ type: "convert", file, export: exp, reason: "Converted to internal helper" });
    } else {
      results.failed.push(`${file}:${exp}`);
    }
  }
  
  // Generate summary
  console.log("📊 Cleanup Summary:");
  console.log(`  - Files deleted: ${results.deleted.length}`);
  console.log(`  - Exports converted: ${results.converted.length}`);
  console.log(`  - Failed: ${results.failed.length}\n`);
  
  if (results.deleted.length > 0) {
    console.log("Deleted files:");
    results.deleted.forEach(f => console.log(`  ✓ ${f}`));
    console.log("");
  }
  
  if (results.converted.length > 0) {
    console.log("Converted exports:");
    results.converted.forEach(f => console.log(`  ✓ ${f}`));
    console.log("");
  }
  
  if (results.failed.length > 0) {
    console.log("Failed operations:");
    results.failed.forEach(f => console.log(`  ✗ ${f}`));
    console.log("");
  }
  
  // Write cleanup log
  const logPath = path.join(ROOT, "dead-code-cleanup-log.md");
  const log: string[] = [];
  log.push("# Dead Code Cleanup Log");
  log.push("");
  log.push(`Generated: ${new Date().toISOString()}`);
  log.push("");
  log.push("## Actions Performed");
  log.push("");
  
  if (actions.length === 0) {
    log.push("No cleanup actions were performed. Add files/exports to SAFE_TO_DELETE or EXPORTS_TO_CONVERT arrays in the script.");
  } else {
    for (const action of actions) {
      if (action.type === "delete") {
        log.push(`- **Deleted**: \`${action.file}\` - ${action.reason}`);
      } else {
        log.push(`- **Converted**: \`${action.file}\` → \`${action.export}\` - ${action.reason}`);
      }
    }
  }
  
  fs.writeFileSync(logPath, log.join("\n"), "utf8");
  console.log(`📝 Cleanup log written to: ${logPath}\n`);
  
  if (SAFE_TO_DELETE.length === 0 && EXPORTS_TO_CONVERT.length === 0) {
    console.log("ℹ️  No cleanup actions configured.");
    console.log("   Review dead-code-report.md and add confirmed unused files/exports to this script.");
  }
}

main();

