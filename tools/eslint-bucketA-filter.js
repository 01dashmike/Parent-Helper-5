// Helper script: filter ESLint JSON output down to Bucket A issues in allowed UI files
// Usage:
//   node tools/eslint-bucketA-filter.js <eslint-json-path>

import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "eslint-ui-before.json";

const raw = fs.readFileSync(inputPath, "utf8");
const start = raw.indexOf("[");
if (start === -1) {
  throw new Error("No JSON array found in ESLint output");
}
const json = raw.slice(start);
const data = JSON.parse(json);

// Bucket A rule IDs we are allowed to touch
const ALLOWED_RULES = new Set([
  "@typescript-eslint/no-unused-vars",
  "unused-imports/no-unused-imports",
  "react/no-unescaped-entities",
  "no-useless-return",
  "no-extra-boolean-cast",
  "no-unneeded-ternary",
  "react/button-has-type",
]);

// Disallowed path prefixes
const DISALLOWED_PREFIXES = [
  "app/api/",
  "app/admin/",
  "app/(auth)/",
  "app/(providers)/",
  "app/account/",
  "app/provider/",
  "app/checkout/",
  "app/payments/",
  "app/onboarding/",
  "app/r/",
];

// Disallowed substrings anywhere in path
const DISALLOWED_SUBSTRINGS = [
  "payment",
  "payments",
  "checkout",
  "onboarding",
  "stripe",
  "referral",
  "analytics",
  "rewards",
  "growth",
  "payout",
  "cron",
];

function isAllowedFile(absPath) {
  const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
  if (!(rel.startsWith("app/") || rel.startsWith("components/"))) return null;
  if (DISALLOWED_PREFIXES.some((p) => rel.startsWith(p))) return null;
  if (DISALLOWED_SUBSTRINGS.some((s) => rel.includes(s))) return null;
  return rel;
}

const results = [];

for (const fileResult of data) {
  const rel = isAllowedFile(fileResult.filePath);
  if (!rel) continue;

  const issues = fileResult.messages
    .filter((m) => ALLOWED_RULES.has(m.ruleId))
    .map((m) => ({
      ruleId: m.ruleId,
      line: m.line,
      column: m.column,
      message: m.message,
    }));

  if (issues.length > 0) {
    results.push({ file: rel, issues });
  }
}

process.stdout.write(JSON.stringify(results, null, 2));


