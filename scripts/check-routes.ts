#!/usr/bin/env tsx

/**
 * Route Checker Script
 * 
 * Scans for <Link href="..."> patterns and validates:
 * - Target files/pages exist
 * - Dynamic params are correctly formatted
 * - Routes are not broken from refactors
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve, dirname, relative } from "path";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";

interface RouteIssue {
  file: string;
  line: number;
  href: string;
  issue: string;
  severity: "error" | "warning";
}

interface RouteInfo {
  path: string;
  isDynamic: boolean;
  params: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const APP_DIR = join(PROJECT_ROOT, "app");
const COMPONENTS_DIR = join(PROJECT_ROOT, "components");

// Extract all route patterns from app directory
function getAllRoutes(): Map<string, RouteInfo> {
  const routes = new Map<string, RouteInfo>();

  function scanDirectory(dir: string, basePath: string = ""): void {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other non-route directories
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        scanDirectory(fullPath, relativePath);
      } else if (entry.name === "page.tsx" || entry.name === "page.jsx" || entry.name === "page.ts" || entry.name === "page.js") {
        // Convert file path to route path
        const routePath = basePath
          .replace(/\[([^\]]+)\]/g, ":$1") // Convert [param] to :param for matching
          .replace(/\\/g, "/")
          .replace(/^\//, "");

        const dynamicParams = (basePath.match(/\[([^\]]+)\]/g) || []).map((p) => p.slice(1, -1));

        routes.set(routePath, {
          path: basePath.replace(/\\/g, "/"),
          isDynamic: dynamicParams.length > 0,
          params: dynamicParams,
        });
      }
    }
  }

  scanDirectory(APP_DIR);
  return routes;
}

// Extract href values from Link components
function extractHrefs(filePath: string): Array<{ href: string; line: number }> {
  const content = readFileSync(filePath, "utf-8");
  const hrefs: Array<{ href: string; line: number }> = [];

  // Match various Link patterns:
  // <Link href="...">
  // <Link href={'...'}>
  // <Link href={`...`}>
  // href="/path"
  // href={"/path"}
  // href={`/path/${variable}`}
  const patterns = [
    /<Link[^>]+href=["']([^"']+)["'][^>]*>/g,
    /<Link[^>]+href=\{["']([^"']+)["']\}[^>]*>/g,
    /href=["']([^"']+)["']/g,
    /href=\{["']([^"']+)["']\}/g,
  ];

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const href = match[1];
        // Skip external URLs, mailto, tel, etc.
        if (href && !href.match(/^(https?:|mailto:|tel:|#|javascript:)/)) {
          hrefs.push({ href: href.trim(), line: i + 1 });
        }
      }
    }
  }

  return hrefs;
}

// Normalize route path for comparison
function normalizeRoute(href: string): string {
  // Remove query params and hash
  const path = href.split("?")[0].split("#")[0];
  // Remove leading/trailing slashes
  return path.replace(/^\/+|\/+$/g, "");
}

// Check if route exists
function checkRoute(href: string, routes: Map<string, RouteInfo>): { valid: boolean; issue?: string } {
  const normalized = normalizeRoute(href);

  if (!normalized) {
    return { valid: true }; // Root route
  }

  // Check exact match
  if (routes.has(normalized)) {
    return { valid: true };
  }

  // Check dynamic routes
  for (const [routePath, routeInfo] of routes.entries()) {
    if (!routeInfo.isDynamic) continue;

    // Convert route pattern to regex
    const pattern = routePath.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(normalized)) {
      // Extract params from href
      const routeParts = routePath.split("/");
      const hrefParts = normalized.split("/");

      if (routeParts.length === hrefParts.length) {
        const params: Record<string, string> = {};
        let valid = true;

        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(":")) {
            const paramName = routeParts[i].slice(1);
            params[paramName] = hrefParts[i];
          } else if (routeParts[i] !== hrefParts[i]) {
            valid = false;
            break;
          }
        }

        if (valid) {
          return { valid: true };
        }
      }
    }
  }

  // Check if it's a file path (static asset)
  const staticPath = join(PROJECT_ROOT, "public", href);
  if (existsSync(staticPath)) {
    return { valid: true };
  }

  return {
    valid: false,
    issue: `Route not found: /${normalized}`,
  };
}

// Main function
async function main() {
  console.log("🔍 Scanning for routes...\n");

  const routes = getAllRoutes();
  console.log(`✓ Found ${routes.size} routes\n`);

  console.log("🔍 Scanning for Link components...\n");

  // Find all component files recursively
  async function findFiles(dir: string, extensions: string[] = [".tsx", ".ts", ".jsx", ".js"]): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(PROJECT_ROOT, fullPath);

      // Skip ignored directories
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...(await findFiles(fullPath, extensions)));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        // Skip test files
        if (!entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
          files.push(relativePath);
        }
      }
    }

    return files;
  }

  const componentFiles = await findFiles(join(PROJECT_ROOT, "components"));
  const appFiles = await findFiles(join(PROJECT_ROOT, "app"));
  const allFiles = [...componentFiles, ...appFiles];

  const issues: RouteIssue[] = [];

  for (const file of allFiles) {
    const filePath = join(PROJECT_ROOT, file);

    try {
      const hrefs = extractHrefs(filePath);

      for (const { href, line } of hrefs) {
        // Skip template literals with variables (can't statically check)
        if (href.includes("${") || href.includes("{")) {
          continue;
        }

        const check = checkRoute(href, routes);

        if (!check.valid) {
          issues.push({
            file: relative(PROJECT_ROOT, filePath),
            line,
            href,
            issue: check.issue || "Unknown issue",
            severity: "error",
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error processing ${file}:`, error);
    }
  }

  // Print results
  if (issues.length === 0) {
    console.log("✅ No broken routes found!\n");
    return;
  }

  console.log(`❌ Found ${issues.length} broken route(s):\n`);

  // Group by file
  const issuesByFile = new Map<string, RouteIssue[]>();
  for (const issue of issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, []);
    }
    issuesByFile.get(issue.file)!.push(issue);
  }

  for (const [file, fileIssues] of issuesByFile.entries()) {
    console.log(`📄 ${file}`);
    for (const issue of fileIssues) {
      console.log(`   Line ${issue.line}: ${issue.href}`);
      console.log(`   ${issue.severity === "error" ? "❌" : "⚠️ "} ${issue.issue}`);
    }
    console.log();
  }

  // Exit with error code if issues found
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

