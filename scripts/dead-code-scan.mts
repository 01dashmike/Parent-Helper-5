#!/usr/bin/env node

/**
 * Dead code scanner (heuristic)
 *
 * Scans selected directories and reports files that are:
 * - under components/**, app/**, lib/**
 * - never imported by any other file (local imports only)
 * - not special Next.js entrypoints (page.tsx, layout.tsx, route.ts)
 *
 * This is intentionally lightweight and regex-based – it does NOT perform full
 * AST or type analysis. Treat the output as "potentially unused" and review
 * before deleting anything.
 */

import fs from "fs";
import path from "path";

type ImportGraph = Map<string, Set<string>>;

const ROOT = process.cwd();

const SCAN_ROOTS = ["components", "app", "lib"];

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mts", ".mjs", ".cts", ".cjs"];

const NEXT_ENTRY_FILE_NAMES = new Set(["page", "layout", "route"]);

function isCodeFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function isWithinScope(filePath: string): boolean {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  return SCAN_ROOTS.some((prefix) => rel === prefix || rel.startsWith(prefix + "/"));
}

function walkDirectory(dir: string, collected: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, collected);
    } else if (entry.isFile()) {
      if (isWithinScope(fullPath) && isCodeFile(fullPath)) {
        collected.push(fullPath);
      }
    }
  }
}

function collectAllFiles(): string[] {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    const full = path.join(ROOT, root);
    if (fs.existsSync(full)) {
      walkDirectory(full, files);
    }
  }
  return files;
}

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Very simple import matcher:
 * - import ... from "spec"
 * - export ... from "spec"
 * - import("spec")
 */
function extractImportSpecifiers(source: string): string[] {
  const specs: string[] = [];

  const importExportRegex =
    /\b(?:import|export)\s+(?:.+?\sfrom\s+)?["']([^"']+)["']/g;
  const dynamicImportRegex = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = importExportRegex.exec(source)) !== null) {
    specs.push(match[1]);
  }
  while ((match = dynamicImportRegex.exec(source)) !== null) {
    specs.push(match[1]);
  }

  return specs;
}

function resolveModuleSpecifier(
  fromFile: string,
  specifier: string,
  allFilesSet: Set<string>,
): string | null {
  // Only consider local imports under our repo
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    return null;
  }

  let basePath: string;

  if (specifier.startsWith("@/")) {
    const relFromRoot = specifier.slice(2); // remove "@/":
    basePath = path.join(ROOT, relFromRoot);
  } else {
    basePath = path.resolve(path.dirname(fromFile), specifier);
  }

  const candidates: string[] = [];

  const hasExt = EXTENSIONS.includes(path.extname(basePath));
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
    if (allFilesSet.has(normalized)) {
      return normalized;
    }
  }

  return null;
}

function buildImportGraph(allFiles: string[]): ImportGraph {
  const graph: ImportGraph = new Map();
  const allFilesSet = new Set(allFiles.map((f) => path.normalize(f)));

  for (const file of allFiles) {
    const normalizedFile = path.normalize(file);
    const source = readFileSafe(normalizedFile);
    const specs = extractImportSpecifiers(source);

    for (const spec of specs) {
      const resolved = resolveModuleSpecifier(normalizedFile, spec, allFilesSet);
      if (!resolved) continue;

      if (!graph.has(normalizedFile)) {
        graph.set(normalizedFile, new Set());
      }
      graph.get(normalizedFile)!.add(resolved);
    }
  }

  return graph;
}

function buildReverseGraph(graph: ImportGraph, allFiles: string[]): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const file of allFiles) {
    reverse.set(path.normalize(file), new Set());
  }

  for (const [from, targets] of graph.entries()) {
    for (const to of targets) {
      const toNorm = path.normalize(to);
      if (!reverse.has(toNorm)) {
        reverse.set(toNorm, new Set());
      }
      reverse.get(toNorm)!.add(path.normalize(from));
    }
  }

  return reverse;
}

function isNextAppEntry(filePath: string): boolean {
  const rel = path
    .relative(ROOT, filePath)
    .replace(/\\/g, "/");

  if (!rel.startsWith("app/")) return false;

  const parsed = path.parse(rel);
  const fileNameWithoutExt = parsed.name;

  return NEXT_ENTRY_FILE_NAMES.has(fileNameWithoutExt);
}

function toRepoRelative(filePath: string): string {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function main() {
  console.log("🔍 Scanning for potentially unused files...");

  const allFiles = collectAllFiles();
  const graph = buildImportGraph(allFiles);
  const reverse = buildReverseGraph(graph, allFiles);

  const candidates: string[] = [];

  for (const file of allFiles) {
    const rel = toRepoRelative(file);

    // Skip Next.js app entrypoints
    if (isNextAppEntry(file)) continue;

    const importedBy = reverse.get(path.normalize(file)) ?? new Set<string>();

    // If no other file imports this one, it is a candidate
    if (importedBy.size === 0) {
      candidates.push(rel);
    }
  }

  candidates.sort();

  // Terminal output
  console.log("");
  console.log("Potentially unused files (heuristic):");
  if (candidates.length === 0) {
    console.log("✅ No obvious unused files found in components/, app/, or lib/.");
  } else {
    for (const rel of candidates) {
      console.log(`- ${rel}`);
    }
    console.log("");
    console.log(`Total candidates: ${candidates.length}`);
  }

  // Write markdown report
  const reportLines: string[] = [];
  reportLines.push("# Dead Code Scan Report");
  reportLines.push("");
  reportLines.push(
    "_This report is heuristic only. Files listed below appear to have no inbound imports and are not Next.js page/layout/route entrypoints. Review carefully before deleting._",
  );
  reportLines.push("");
  reportLines.push(`- Generated at: ${new Date().toISOString()}`);
  reportLines.push(`- Root: \`${ROOT}\``);
  reportLines.push("");

  if (candidates.length === 0) {
    reportLines.push("No potentially unused files were detected in the scanned directories.");
  } else {
    reportLines.push("## Potentially Unused Files");
    reportLines.push("");
    for (const rel of candidates) {
      reportLines.push(`- \`${rel}\``);
    }
  }

  const reportPath = path.join(ROOT, "dead-code-report.md");
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");

  console.log("");
  console.log(`📝 Report written to ${reportPath}`);
}

main();


