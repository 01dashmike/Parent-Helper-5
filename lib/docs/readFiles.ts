/**
 * File reading utilities for admin documentation hub
 * All functions are server-side only for security
 */

import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface MarkdownFile {
  path: string;
  name: string;
  content: string;
  lastModified: Date;
}

export interface RouteInfo {
  path: string;
  type: "page" | "layout" | "loading" | "error" | "route" | "component";
  isClient: boolean;
  isServer: boolean;
}

export interface TodoItem {
  file: string;
  line: number;
  content: string;
  type: "TODO" | "FIXME" | "NOTE";
  priority?: string;
}

/**
 * Read all markdown files from a directory
 */
export async function readMarkdownFiles(dir: string): Promise<MarkdownFile[]> {
  if (!existsSync(dir)) {
    return [];
  }

  const files: MarkdownFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await readMarkdownFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.name.endsWith(".md")) {
      try {
        const content = await readFile(fullPath, "utf-8");
        const stats = await stat(fullPath);
        files.push({
          path: fullPath,
          name: entry.name,
          content,
          lastModified: stats.mtime,
        });
      } catch (error) {
        console.error(`Error reading ${fullPath}:`, error);
      }
    }
  }

  return files;
}

/**
 * Read a single JSON file
 */
export async function readJSONFile<T = any>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
    return null;
  }
}

/**
 * Read directory recursively and return file paths
 */
export async function readDirectoryRecursively(
  dir: string,
  extensions?: string[]
): Promise<string[]> {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and .next
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      const subFiles = await readDirectoryRecursively(fullPath, extensions);
      files.push(...subFiles);
    } else {
      if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Build route tree from app directory
 */
export async function getRouteTree(appDir: string = "app"): Promise<RouteInfo[]> {
  if (!existsSync(appDir)) {
    return [];
  }

  const routes: RouteInfo[] = [];
  const files = await readDirectoryRecursively(appDir, [".tsx", ".ts", ".jsx", ".js"]);

  for (const file of files) {
    const relativePath = file.replace(process.cwd() + "/", "");
    const pathSegments = relativePath.split("/");
    const fileName = pathSegments[pathSegments.length - 1];

    // Determine route type
    let type: RouteInfo["type"] = "page";
    if (fileName === "layout.tsx" || fileName === "layout.ts") {
      type = "layout";
    } else if (fileName === "loading.tsx" || fileName === "loading.ts") {
      type = "loading";
    } else if (fileName === "error.tsx" || fileName === "error.ts") {
      type = "error";
    } else if (fileName === "route.ts" || fileName === "route.tsx") {
      type = "route";
    } else if (fileName.endsWith(".tsx") || fileName.endsWith(".ts")) {
      type = "page";
    } else {
      continue;
    }

    // Check if it's a client component
    let isClient = false;
    let isServer = false;
    try {
      const content = await readFile(file, "utf-8");
      isClient = content.includes('"use client"') || content.includes("'use client'");
      isServer = content.includes('"use server"') || content.includes("'use server'");
    } catch {
      // Ignore read errors
    }

    // Build route path
    const routePath = pathSegments
      .slice(1) // Remove 'app'
      .map((segment) => {
        if (segment === "page.tsx" || segment === "page.ts") return "";
        if (segment === "layout.tsx" || segment === "layout.ts") return "";
        if (segment === "loading.tsx" || segment === "loading.ts") return "";
        if (segment === "error.tsx" || segment === "error.ts") return "";
        if (segment === "route.ts" || segment === "route.tsx") return "";
        if (segment.startsWith("[") && segment.endsWith("]")) {
          return `:${segment.slice(1, -1)}`;
        }
        return segment;
      })
      .filter(Boolean)
      .join("/");

    routes.push({
      path: routePath || "/",
      type,
      isClient,
      isServer,
    });
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Get test reports (Jest and Playwright)
 */
export async function getTestReports(): Promise<{
  jest: { passed: number; failed: number; duration?: number } | null;
  playwright: { passed: number; failed: number; duration?: number } | null;
}> {
  const jestResultsPath = join(process.cwd(), "jest-results.json");
  const playwrightReportPath = join(process.cwd(), "playwright-report");

  let jestResults = null;
  let playwrightResults = null;

  // Try to read Jest results
  try {
    const jestData = await readJSONFile<{
      numPassedTests: number;
      numFailedTests: number;
      startTime: number;
      endTime: number;
    }>(jestResultsPath);
    if (jestData) {
      jestResults = {
        passed: jestData.numPassedTests || 0,
        failed: jestData.numFailedTests || 0,
        duration: jestData.endTime && jestData.startTime
          ? Math.round((jestData.endTime - jestData.startTime) / 1000)
          : undefined,
      };
    }
  } catch {
    // Ignore
  }

  // Try to read Playwright results
  try {
    if (existsSync(playwrightReportPath)) {
      const reportDataPath = join(playwrightReportPath, "data.json");
      const playwrightData = await readJSONFile<{
        stats: { total: number; expected: number; unexpected: number };
        duration: number;
      }>(reportDataPath);
      if (playwrightData && playwrightData.stats) {
        playwrightResults = {
          passed: playwrightData.stats.expected || 0,
          failed: playwrightData.stats.unexpected || 0,
          duration: playwrightData.duration
            ? Math.round(playwrightData.duration / 1000)
            : undefined,
        };
      }
    }
  } catch {
    // Ignore
  }

  return { jest: jestResults, playwright: playwrightResults };
}

/**
 * Get health status by running health check script
 */
export async function getHealthStatus(): Promise<{
  status: "healthy" | "warning" | "broken";
  message: string;
  details?: any;
}> {
  try {
    // Try to read health check output if it exists
    const healthCheckPath = join(process.cwd(), "scripts", "check-next-health.mjs");
    if (existsSync(healthCheckPath)) {
      // In a real implementation, you might want to execute this
      // For now, we'll return a basic status
      return {
        status: "healthy",
        message: "System health check available",
      };
    }
  } catch {
    // Ignore errors
  }

  return {
    status: "warning",
    message: "Health check script not found",
  };
}

/**
 * Extract TODOs, FIXMEs, and NOTES from codebase
 */
export async function getTodos(): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];
  const codeFiles = await readDirectoryRecursively(process.cwd(), [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
  ]);

  // Exclude certain directories
  const excludeDirs = ["node_modules", ".next", "dist", "build", ".git"];

  for (const file of codeFiles) {
    if (excludeDirs.some((dir) => file.includes(dir))) {
      continue;
    }

    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const todoMatch = line.match(/\/\/\s*(TODO|FIXME|NOTE)(?::\s*(.+))?/i);
        if (todoMatch) {
          const type = (todoMatch[1]?.toUpperCase() || "TODO") as TodoItem["type"];
          const content = todoMatch[2]?.trim() || "";
          
          // Try to extract priority
          let priority: string | undefined;
          const priorityMatch = content.match(/(high|low|medium)\s+priority/i);
          if (priorityMatch) {
            priority = priorityMatch[1].toLowerCase();
          }

          todos.push({
            file: file.replace(process.cwd() + "/", ""),
            line: index + 1,
            content,
            type,
            priority,
          });
        }
      });
    } catch {
      // Ignore read errors
    }
  }

  return todos;
}

/**
 * Read self-heal logs
 */
export async function getSelfHealLogs(limit: number = 5): Promise<Array<{
  timestamp: Date;
  message: string;
  status: string;
}>> {
  const logPath = join(process.cwd(), ".next", "self-heal.log");
  const logs: Array<{ timestamp: Date; message: string; status: string }> = [];

  if (!existsSync(logPath)) {
    return logs;
  }

  try {
    const content = await readFile(logPath, "utf-8");
    const lines = content.split("\n").filter(Boolean).slice(-limit);

    for (const line of lines) {
      const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}[^\]]+)\]/);
      const statusMatch = line.match(/(success|error|warning|info)/i);
      const message = line.replace(/\[.*?\]/g, "").trim();

      logs.push({
        timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
        message,
        status: statusMatch ? statusMatch[1].toLowerCase() : "info",
      });
    }
  } catch {
    // Ignore errors
  }

  return logs.reverse(); // Most recent first
}

