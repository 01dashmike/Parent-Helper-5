// Simple script for summarising ESLint JSON output in a markdown report.
// Note: This file intentionally avoids TypeScript-specific syntax so that it
// can be treated as plain JavaScript when required.

const fs = await import("node:fs/promises");
const path = await import("node:path");

async function main() {
  const root = process.cwd();
  const reportPath = path.join(root, "eslint-report-latest.json");

  let raw;
  try {
    raw = await fs.readFile(reportPath, "utf8");
  } catch (error) {
    console.error(`Could not read ${reportPath}:`, error);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(raw);
  } catch (error) {
    console.error(`Could not parse ${reportPath} as JSON:`, error);
    process.exit(1);
    return;
  }

  const byRuleCount = new Map<string, number>();
  const fileCounts = new Map<string, number>();
  const ruleFilesAppApi = new Map<string, Set<string>>();
  const ruleFilesComponents = new Map<string, Set<string>>();

  for (const file of report) {
    const relPath = path.relative(root, file.filePath);
    const messages = file.messages ?? [];
    if (!messages.length) continue;

    // Count messages per file (errors + warnings)
    fileCounts.set(relPath, (fileCounts.get(relPath) || 0) + messages.length);

    for (const msg of messages) {
      if (!msg.ruleId) continue;
      byRuleCount.set(msg.ruleId, (byRuleCount.get(msg.ruleId) || 0) + 1);

      if (relPath.startsWith("app/api/")) {
        if (!ruleFilesAppApi.has(msg.ruleId)) {
          ruleFilesAppApi.set(msg.ruleId, new Set());
        }
        ruleFilesAppApi.get(msg.ruleId)!.add(relPath);
      }

      if (relPath.startsWith("components/")) {
        if (!ruleFilesComponents.has(msg.ruleId)) {
          ruleFilesComponents.set(msg.ruleId, new Set());
        }
        ruleFilesComponents.get(msg.ruleId)!.add(relPath);
      }
    }
  }

  // Build markdown
  let md = "";
  md += "# ESLint Summary\n\n";

  // By Rule
  md += "## By Rule\n\n";
  if (byRuleCount.size === 0) {
    md += "_No ESLint problems found._\n\n";
  } else {
    md += "| Rule | Count |\n";
    md += "| --- | ---: |\n";
    const sortedRules = Array.from(byRuleCount.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    for (const [ruleId, count] of sortedRules) {
      md += `| \`${ruleId}\` | ${count} |\n`;
    }
    md += "\n";
  }

  // Top 20 Files by Error Count
  md += "## Top 20 Files by Error Count\n\n";
  if (fileCounts.size === 0) {
    md += "_No ESLint problems found._\n\n";
  } else {
    const topFiles = Array.from(fileCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 20);

    md += "| Rank | File | Count |\n";
    md += "| ---: | --- | ---: |\n";
    topFiles.forEach(([file, count], index) => {
      md += `| ${index + 1} | \`${file}\` | ${count} |\n`;
    });
    md += "\n";
  }

  // Rules affecting app/api/**
  md += "## Rules affecting `app/api/**`\n\n";
  if (ruleFilesAppApi.size === 0) {
    md += "_No rules currently reported under `app/api/**`._\n\n";
  } else {
    const sorted = Array.from(ruleFilesAppApi.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [ruleId, files] of sorted) {
      const count = byRuleCount.get(ruleId) ?? 0;
      md += `- \`${ruleId}\` — ${count} occurrences in ${files.size} file(s)\n`;
      const fileList = Array.from(files).sort();
      fileList.forEach((f) => {
        md += `  - \`${f}\`\n`;
      });
    }
    md += "\n";
  }

  // Rules affecting components/**
  md += "## Rules affecting `components/**`\n\n";
  if (ruleFilesComponents.size === 0) {
    md += "_No rules currently reported under `components/**`._\n\n";
  } else {
    const sorted = Array.from(ruleFilesComponents.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [ruleId, files] of sorted) {
      const count = byRuleCount.get(ruleId) ?? 0;
      md += `- \`${ruleId}\` — ${count} occurrences in ${files.size} file(s)\n`;
      const fileList = Array.from(files).sort();
      fileList.forEach((f) => {
        md += `  - \`${f}\`\n`;
      });
    }
    md += "\n";
  }

  const outPath = path.join(root, "eslint-summary.md");
  await fs.writeFile(outPath, md, "utf8");
  // eslint-disable-next-line no-console -- script output
  console.log(`Wrote ESLint summary to ${outPath}`);
}

void main();


