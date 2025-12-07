#!/usr/bin/env node

/**
 * Dead Code Finder
 * 
 * Scans lib/**, components/**, utils/** for:
 * - Unused exports (functions, components, types, constants)
 * - Unused files
 * 
 * Safety checks:
 * - Never deletes Next.js entrypoints (page.tsx, layout.tsx, route.ts)
 * - Never deletes files with "test" or "spec" in name
 * - Never deletes files in app/api, app/provider, app/admin, app/account
 * - Reports unsafe deletions separately
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SCAN_DIRS = ["lib", "components", "utils"];
const EXCLUDE_DIRS = ["app/api", "app/provider", "app/admin", "app/account"];
const EXCLUDE_PATTERNS = [/test/i, /spec/i, /\.test\./, /\.spec\./];
const NEXT_ENTRY_NAMES = new Set(["page", "layout", "route", "loading", "error", "not-found", "template", "default"]);

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];

interface ExportInfo {
  name: string;
  type: "function" | "component" | "type" | "const" | "class" | "default" | "unknown";
  line: number;
}

interface FileInfo {
  path: string;
  relativePath: string;
  exports: ExportInfo[];
  imports: string[];
  isEntryPoint: boolean;
  isExcluded: boolean;
}

function isCodeFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function isExcluded(filePath: string): boolean {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  
  // Check exclude directories
  for (const excludeDir of EXCLUDE_DIRS) {
    if (rel.startsWith(excludeDir + "/") || rel === excludeDir) {
      return true;
    }
  }
  
  // Check exclude patterns
  const fileName = path.basename(filePath);
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(rel)) {
      return true;
    }
  }
  
  return false;
}

function isNextEntryPoint(filePath: string): boolean {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (!rel.startsWith("app/")) return false;
  
  const parsed = path.parse(rel);
  const nameWithoutExt = parsed.name;
  return NEXT_ENTRY_NAMES.has(nameWithoutExt);
}

function collectFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile() && isCodeFile(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractExports(source: string, filePath: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const lines = source.split("\n");
  
  // Match various export patterns
  const patterns = [
    // export function/const/class/type
    /^export\s+(?:async\s+)?(function|const|class|type|interface|enum)\s+(\w+)/gm,
    // export { ... }
    /^export\s*\{\s*([^}]+)\s*\}/gm,
    // export default
    /^export\s+default\s+/gm,
    // export * from
    /^export\s+\*\s+from/gm,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // export function/const/class/type/interface/enum
    const declMatch = line.match(/^export\s+(?:async\s+)?(function|const|class|type|interface|enum)\s+(\w+)/);
    if (declMatch) {
      const [, keyword, name] = declMatch;
      let type: ExportInfo["type"] = "unknown";
      if (keyword === "function") type = "function";
      else if (keyword === "class") type = "class";
      else if (keyword === "type" || keyword === "interface") type = "type";
      else if (keyword === "const") type = "const";
      else if (keyword === "enum") type = "const";
      
      exports.push({ name, type, line: i + 1 });
      continue;
    }
    
    // export default
    if (/^export\s+default/.test(line)) {
      exports.push({ name: "default", type: "default", line: i + 1 });
      continue;
    }
    
    // export { name1, name2, ... }
    const namedMatch = line.match(/^export\s*\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      const names = namedMatch[1]
        .split(",")
        .map(n => n.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      for (const name of names) {
        exports.push({ name, type: "unknown", line: i + 1 });
      }
      continue;
    }
  }
  
  return exports;
}

function extractImports(source: string): string[] {
  const imports: string[] = [];
  
  // Match import statements
  const importPatterns = [
    // import ... from "spec"
    /(?:import|export)\s+(?:.*?\s+from\s+)?["']([^"']+)["']/g,
    // import("spec")
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    // require("spec")
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  
  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
  }
  
  return imports;
}

function resolveImport(fromFile: string, specifier: string, allFiles: Set<string>): string | null {
  // Only local imports
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    return null;
  }
  
  let basePath: string;
  
  if (specifier.startsWith("@/")) {
    const relFromRoot = specifier.slice(2);
    basePath = path.join(ROOT, relFromRoot);
  } else {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  }
  
  // Try with extensions
  const candidates: string[] = [];
  const hasExt = EXTENSIONS.some(ext => basePath.endsWith(ext));
  
  if (hasExt) {
    candidates.push(basePath);
  } else {
    for (const ext of EXTENSIONS) {
      candidates.push(basePath + ext);
      candidates.push(path.join(basePath, "index" + ext));
    }
  }
  
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (allFiles.has(normalized)) {
      return normalized;
    }
  }
  
  return null;
}

function analyzeFiles(): {
  files: Map<string, FileInfo>;
  importGraph: Map<string, Set<string>>;
  exportUsage: Map<string, Map<string, Set<string>>>; // file -> export -> importers
} {
  const allFiles: string[] = [];
  
  // Collect all files
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      allFiles.push(...collectFiles(fullDir));
    }
  }
  
  const allFilesSet = new Set(allFiles.map(f => path.normalize(f)));
  const files = new Map<string, FileInfo>();
  const importGraph = new Map<string, Set<string>>();
  const exportUsage = new Map<string, Map<string, Set<string>>>();
  
  // Analyze each file
  for (const filePath of allFiles) {
    const normalized = path.normalize(filePath);
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    
    let source: string;
    try {
      source = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    
    const exports = extractExports(source, filePath);
    const imports = extractImports(source);
    
    const fileInfo: FileInfo = {
      path: normalized,
      relativePath,
      exports,
      imports,
      isEntryPoint: isNextEntryPoint(filePath),
      isExcluded: isExcluded(filePath),
    };
    
    files.set(normalized, fileInfo);
    importGraph.set(normalized, new Set());
    exportUsage.set(normalized, new Map());
    
    // Resolve imports
    for (const imp of imports) {
      const resolved = resolveImport(filePath, imp, allFilesSet);
      if (resolved) {
        importGraph.get(normalized)!.add(resolved);
      }
    }
  }
  
  // Build reverse graph for export usage
  for (const [fromFile, targets] of importGraph.entries()) {
    for (const toFile of targets) {
      const toFileInfo = files.get(toFile);
      if (!toFileInfo) continue;
      
      // Check if importing specific exports
      const fromSource = fs.readFileSync(fromFile, "utf8");
      const toSource = fs.readFileSync(toFile, "utf8");
      
      // Simple check: if import mentions export name
      for (const exp of toFileInfo.exports) {
        // Check for named import
        const namedImportRegex = new RegExp(`\\b${exp.name}\\b`, "g");
        if (namedImportRegex.test(fromSource)) {
          if (!exportUsage.has(toFile)) {
            exportUsage.set(toFile, new Map());
          }
          if (!exportUsage.get(toFile)!.has(exp.name)) {
            exportUsage.get(toFile)!.set(exp.name, new Set());
          }
          exportUsage.get(toFile)!.get(exp.name)!.add(fromFile);
        }
      }
      
      // Check for default import
      if (toFileInfo.exports.some(e => e.name === "default")) {
        const defaultImportRegex = /import\s+(\w+)\s+from|import\s+default\s+as|import\s+\*\s+as/;
        if (defaultImportRegex.test(fromSource)) {
          if (!exportUsage.has(toFile)) {
            exportUsage.set(toFile, new Map());
          }
          if (!exportUsage.get(toFile)!.has("default")) {
            exportUsage.get(toFile)!.set("default", new Set());
          }
          exportUsage.get(toFile)!.get("default")!.add(fromFile);
        }
      }
    }
  }
  
  return { files, importGraph, exportUsage };
}

function findUnusedFiles(files: Map<string, FileInfo>, importGraph: Map<string, Set<string>>): {
  safe: string[];
  unsafe: string[];
} {
  const safe: string[] = [];
  const unsafe: string[] = [];
  
  // Build reverse graph
  const reverseGraph = new Map<string, Set<string>>();
  for (const file of files.keys()) {
    reverseGraph.set(file, new Set());
  }
  
  for (const [fromFile, targets] of importGraph.entries()) {
    for (const toFile of targets) {
      reverseGraph.get(toFile)!.add(fromFile);
    }
  }
  
  // Find files with no imports
  for (const [file, fileInfo] of files.entries()) {
    const importedBy = reverseGraph.get(file) || new Set();
    
    if (importedBy.size === 0 && !fileInfo.isEntryPoint) {
      if (fileInfo.isExcluded) {
        unsafe.push(fileInfo.relativePath);
      } else {
        safe.push(fileInfo.relativePath);
      }
    }
  }
  
  return { safe, unsafe };
}

function findUnusedExports(
  files: Map<string, FileInfo>,
  exportUsage: Map<string, Map<string, Set<string>>>
): {
  safe: Array<{ file: string; export: ExportInfo }>;
  unsafe: Array<{ file: string; export: ExportInfo }>;
} {
  const safe: Array<{ file: string; export: ExportInfo }> = [];
  const unsafe: Array<{ file: string; export: ExportInfo }> = [];
  
  for (const [file, fileInfo] of files.entries()) {
    if (fileInfo.isEntryPoint) continue;
    
    const usage = exportUsage.get(file) || new Map();
    
    for (const exp of fileInfo.exports) {
      const importers = usage.get(exp.name) || new Set();
      
      if (importers.size === 0) {
        const item = { file: fileInfo.relativePath, export: exp };
        if (fileInfo.isExcluded) {
          unsafe.push(item);
        } else {
          safe.push(item);
        }
      }
    }
  }
  
  return { safe, unsafe };
}

function main() {
  console.log("🔍 Scanning for dead code...\n");
  console.log(`Scanning directories: ${SCAN_DIRS.join(", ")}`);
  console.log(`Excluding: ${EXCLUDE_DIRS.join(", ")}\n`);
  
  const { files, importGraph, exportUsage } = analyzeFiles();
  
  console.log(`Found ${files.size} files to analyze\n`);
  
  const { safe: unusedFilesSafe, unsafe: unusedFilesUnsafe } = findUnusedFiles(files, importGraph);
  const { safe: unusedExportsSafe, unsafe: unusedExportsUnsafe } = findUnusedExports(files, exportUsage);
  
  // Generate report
  const report: string[] = [];
  report.push("# Dead Code Report");
  report.push("");
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push("");
  
  // Unused files
  report.push("## Unused Files");
  report.push("");
  
  if (unusedFilesSafe.length === 0 && unusedFilesUnsafe.length === 0) {
    report.push("✅ No unused files found.");
  } else {
    if (unusedFilesSafe.length > 0) {
      report.push("### Safe to Delete");
      report.push("");
      for (const file of unusedFilesSafe.sort()) {
        report.push(`- \`${file}\``);
      }
      report.push("");
    }
    
    if (unusedFilesUnsafe.length > 0) {
      report.push("### Unsafe to Delete (Excluded Directories)");
      report.push("");
      for (const file of unusedFilesUnsafe.sort()) {
        report.push(`- \`${file}\` ⚠️`);
      }
      report.push("");
    }
  }
  
  // Unused exports
  report.push("## Unused Exports");
  report.push("");
  
  if (unusedExportsSafe.length === 0 && unusedExportsUnsafe.length === 0) {
    report.push("✅ No unused exports found.");
  } else {
    if (unusedExportsSafe.length > 0) {
      report.push("### Safe to Remove or Convert to Internal");
      report.push("");
      const byFile = new Map<string, ExportInfo[]>();
      for (const { file, export: exp } of unusedExportsSafe) {
        if (!byFile.has(file)) {
          byFile.set(file, []);
        }
        byFile.get(file)!.push(exp);
      }
      
      for (const [file, exports] of Array.from(byFile.entries()).sort()) {
        report.push(`#### \`${file}\``);
        for (const exp of exports) {
          report.push(`- \`${exp.name}\` (${exp.type}, line ${exp.line})`);
        }
        report.push("");
      }
    }
    
    if (unusedExportsUnsafe.length > 0) {
      report.push("### Unsafe to Remove (Excluded Directories)");
      report.push("");
      const byFile = new Map<string, ExportInfo[]>();
      for (const { file, export: exp } of unusedExportsUnsafe) {
        if (!byFile.has(file)) {
          byFile.set(file, []);
        }
        byFile.get(file)!.push(exp);
      }
      
      for (const [file, exports] of Array.from(byFile.entries()).sort()) {
        report.push(`#### \`${file}\``);
        for (const exp of exports) {
          report.push(`- \`${exp.name}\` (${exp.type}, line ${exp.line}) ⚠️`);
        }
        report.push("");
      }
    }
  }
  
  // Summary
  report.push("## Summary");
  report.push("");
  report.push(`- Total files analyzed: ${files.size}`);
  report.push(`- Unused files (safe): ${unusedFilesSafe.length}`);
  report.push(`- Unused files (unsafe): ${unusedFilesUnsafe.length}`);
  report.push(`- Unused exports (safe): ${unusedExportsSafe.length}`);
  report.push(`- Unused exports (unsafe): ${unusedExportsUnsafe.length}`);
  report.push("");
  report.push("## Next Steps");
  report.push("");
  report.push("1. Review the 'Safe to Delete' files and exports");
  report.push("2. Delete unused files manually or use the cleanup script");
  report.push("3. Convert unused exports to internal helpers (remove `export` keyword)");
  report.push("4. Keep excluded directories/files for manual review");
  
  const reportPath = path.join(ROOT, "dead-code-report.md");
  fs.writeFileSync(reportPath, report.join("\n"), "utf8");
  
  // Console output
  console.log("📊 Results:");
  console.log(`  - Unused files (safe): ${unusedFilesSafe.length}`);
  console.log(`  - Unused files (unsafe): ${unusedFilesUnsafe.length}`);
  console.log(`  - Unused exports (safe): ${unusedExportsSafe.length}`);
  console.log(`  - Unused exports (unsafe): ${unusedExportsUnsafe.length}`);
  console.log(`\n📝 Full report written to: ${reportPath}\n`);
  
  if (unusedFilesSafe.length > 0) {
    console.log("Safe to delete files:");
    unusedFilesSafe.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    if (unusedFilesSafe.length > 10) {
      console.log(`  ... and ${unusedFilesSafe.length - 10} more`);
    }
    console.log("");
  }
}

main();

