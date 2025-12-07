// scripts/rsc-scan.mts
// Build-time scan for React Server/Client boundary issues.
//
// Heuristics only – regex-based, no AST – but good enough to catch
// obvious violations. It does NOT modify any source files.
//
// Usage (examples, depending on your setup):
//   node scripts/rsc-scan.mts              (if your Node/tooling supports .mts)
//   node --loader ts-node/esm scripts/rsc-scan.mts
//   npx tsx scripts/rsc-scan.mts

import fs from "node:fs";
import path from "node:path";

type Violation = {
  file: string;
  line?: number;
  rule: string;
  detail: string;
};

const ROOT = process.cwd();

const WALK_ROOTS = ["app", "components"];

// Helpers
function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walkDir(start: string): string[] {
  const result: string[] = [];
  const stack: string[] = [start];

  while (stack.length) {
    const current = stack.pop()!;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(current);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        if (entry.startsWith(".")) continue;
        stack.push(path.join(current, entry));
      }
    } else if (stat.isFile()) {
      if (current.endsWith(".ts") || current.endsWith(".tsx")) {
        result.push(current);
      }
    }
  }

  return result;
}

function hasUseClientDirective(source: string): boolean {
  // Simple heuristic: look for "use client" at the top of the file,
  // ignoring leading whitespace and comments.
  const firstLines = source.split(/\r?\n/, 10);
  for (const line of firstLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip non-directive comments
    if (trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;
    if (
      trimmed === '"use client"' ||
      trimmed === "'use client'" ||
      trimmed.startsWith('"use client";') ||
      trimmed.startsWith("'use client';")
    ) {
      return true;
    }
    // First non-comment, non-empty line is not a directive
    return false;
  }
  return false;
}

function collectViolations(): Violation[] {
  const violations: Violation[] = [];

  const files: string[] = [];
  for (const root of WALK_ROOTS) {
    const full = path.join(ROOT, root);
    if (fs.existsSync(full)) {
      files.push(...walkDir(full));
    }
  }

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const source = readFileSafe(filePath);
    if (!source) continue;

    const isClient = hasUseClientDirective(source);

    const lines = source.split(/\r?\n/);

    // Regexes for imports / usage
    const importRegex = /^\s*import\s+(.+?)\s+from\s+["']([^"']+)["'];?\s*$/;
    const requireRegex = /^\s*const\s+.+\s*=\s*require\(\s*["']([^"']+)["']\s*\);?/;

    // Track whether next/link is used in async server functions for non-client files
    let importsNextLink = false;
    let hasAsyncExportedFunction = false;

    // Hooks usage in non-client files
    const hookPattern =
      /\b(useState|useEffect|useMemo|useCallback|useRef)\s*\(/;

    // .client file import in non-client files (ends with Client.tsx)
    const clientImportPattern = /["'][^"']*Client\.tsx["']/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const importMatch = line.match(importRegex);
      const requireMatch = line.match(requireRegex);

      const recordViolation = (rule: string, detail: string) => {
        violations.push({
          file: rel,
          line: i + 1,
          rule,
          detail,
        });
      };

      if (importMatch) {
        const spec = importMatch[1];
        const specifier = importMatch[2];

        if (!isClient) {
          // 1. Files WITHOUT "use client"
          if (specifier === "next/navigation" || specifier === "next/router") {
            recordViolation(
              "server-imports-next-navigation",
              `Non-client file imports \`${specifier}\``,
            );
          }

          if (specifier === "next/link") {
            importsNextLink = true;
          }

          if (
            hookPattern.test(spec) ||
            /\buse(State|Effect|Memo|Callback|Ref)\b/.test(spec)
          ) {
            recordViolation(
              "server-uses-react-hooks",
              `Non-client file imports React hooks: \`${spec.trim()}\``,
            );
          }

          if (clientImportPattern.test(specifier)) {
            recordViolation(
              "server-imports-client-component",
              `Non-client file imports client file \`${specifier}\``,
            );
          }
        } else {
          // 2. Files WITH "use client"
          if (specifier === "next/headers") {
            recordViolation(
              "client-imports-next-headers",
              `Client file imports \`${specifier}\``,
            );
          }

          if (/_actions\.ts$/.test(specifier)) {
            recordViolation(
              "client-imports-server-actions",
              `Client file imports server action module \`${specifier}\``,
            );
          }

          if (
            specifier === "@/lib/supabase.server" ||
            specifier.endsWith("/supabase.server")
          ) {
            recordViolation(
              "client-imports-supabase-server",
              `Client file imports Supabase server client \`${specifier}\``,
            );
          }

          if (
            specifier === "fs" ||
            specifier === "path" ||
            specifier.startsWith("node:fs") ||
            specifier.startsWith("node:path")
          ) {
            recordViolation(
              "client-imports-node-builtin",
              `Client file imports Node builtin \`${specifier}\``,
            );
          }
        }
      } else if (requireMatch && isClient) {
        const specifier = requireMatch[1];
        const recordViolation = (rule: string, detail: string) => {
          violations.push({
            file: rel,
            line: i + 1,
            rule,
            detail,
          });
        };

        if (
          specifier === "fs" ||
          specifier === "path" ||
          specifier.startsWith("node:fs") ||
          specifier.startsWith("node:path")
        ) {
          recordViolation(
            "client-requires-node-builtin",
            `Client file requires Node builtin \`${specifier}\``,
          );
        }
      }

      // Track async exported functions in non-client files for next/link warnings
      if (!isClient) {
        if (
          /^export\s+default\s+async\s+function\b/.test(trimmed) ||
          /^export\s+async\s+function\b/.test(trimmed)
        ) {
          hasAsyncExportedFunction = true;
        }
      }

      // React hook usage in non-client files (even if imported indirectly)
      if (!isClient && hookPattern.test(line)) {
        violations.push({
          file: rel,
          line: i + 1,
          rule: "server-uses-react-hooks",
          detail: "Non-client file uses React hook invocation",
        });
      }

      // .client import via dynamic import or require in non-client files
      if (
        !isClient &&
        /Client\.tsx["']\)/.test(line) &&
        /(import\(|require\()/.test(line)
      ) {
        violations.push({
          file: rel,
          line: i + 1,
          rule: "server-imports-client-component",
          detail: "Non-client file dynamically imports client component",
        });
      }
    }

    // After scanning all lines, add a warning for next/link in async server fn
    if (!isClient && importsNextLink && hasAsyncExportedFunction) {
      violations.push({
        file: rel,
        rule: "server-async-uses-next-link",
        detail:
          "Non-client file imports `next/link` and exports an async function. Verify Link usage inside server components.",
      });
    }
  }

  return violations;
}

function formatReportMarkdown(violations: Violation[]): string {
  let out = "# React Server/Client Boundary Scan\n\n";

  if (!violations.length) {
    out += "_No potential boundary violations detected._\n";
    return out;
  }

  const byRule = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule)!.push(v);
  }

  out += "## Summary by Rule\n\n";
  out += "| Rule | Count |\n";
  out += "| --- | ---: |\n";
  const sortedRules = Array.from(byRule.entries()).sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  for (const [rule, list] of sortedRules) {
    out += `| \`${rule}\` | ${list.length} |\n`;
  }
  out += "\n";

  out += "## Details\n\n";
  for (const [rule, list] of sortedRules) {
    out += `### \`${rule}\`\n\n`;
    const byFile = new Map<string, Violation[]>();
    for (const v of list) {
      if (!byFile.has(v.file)) byFile.set(v.file, []);
      byFile.get(v.file)!.push(v);
    }

    const sortedFiles = Array.from(byFile.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [file, fileViolations] of sortedFiles) {
      out += `- \`${file}\`\n`;
      for (const v of fileViolations) {
        const loc = v.line ? ` (line ${v.line})` : "";
        out += `  -${loc} ${v.detail}\n`;
      }
    }
    out += "\n";
  }

  return out;
}

async function main() {
  const violations = collectViolations();

  // Console output (compact)
  if (!violations.length) {
    // eslint-disable-next-line no-console -- build-time diagnostics
    console.log("[rsc-scan] No potential server/client boundary violations found.");
  } else {
    // eslint-disable-next-line no-console -- build-time diagnostics
    console.log(
      `[rsc-scan] Found ${violations.length} potential server/client boundary issue(s).`,
    );
    const grouped = new Map<string, number>();
    for (const v of violations) {
      grouped.set(v.rule, (grouped.get(v.rule) || 0) + 1);
    }
    for (const [rule, count] of Array.from(grouped.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )) {
      // eslint-disable-next-line no-console -- build-time diagnostics
      console.log(`  - ${rule}: ${count}`);
    }
  }

  const reportMd = formatReportMarkdown(violations);
  const outPath = path.join(ROOT, "rsc-scan-report.md");
  fs.writeFileSync(outPath, reportMd, "utf8");
  // eslint-disable-next-line no-console -- build-time diagnostics
  console.log(`[rsc-scan] Wrote report to ${outPath}`);
}

void main();


