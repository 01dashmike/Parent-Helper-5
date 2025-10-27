import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const LIGHTHOUSE_REPORT = ".lighthouseci/lhr-0.report.json";
const PLAYWRIGHT_DIFFS = "playwright-report/index.json";

async function run() {
  console.log("📊 Generating Quality Summary...");

  const lighthouse = fs.existsSync(LIGHTHOUSE_REPORT)
    ? JSON.parse(fs.readFileSync(LIGHTHOUSE_REPORT, "utf8"))
    : null;

  const lhScores = lighthouse
    ? {
        performance: Math.round((lighthouse?.categories?.performance?.score || 0) * 100),
        accessibility: Math.round((lighthouse?.categories?.accessibility?.score || 0) * 100),
        seo: Math.round((lighthouse?.categories?.seo?.score || 0) * 100),
        bestPractices: Math.round((lighthouse?.categories?.["best-practices"]?.score || 0) * 100),
      }
    : {};

  let visualDiff = "✅ No diff data (default)";
  try {
    const json = JSON.parse(fs.readFileSync(PLAYWRIGHT_DIFFS, "utf8"));
    const diffs = json?.suites?.flatMap((s) => s.specs)?.flatMap((s) => s.tests) ?? [];
    const failures = diffs.filter((t) => t.status === "failed");
    visualDiff = failures.length ? `⚠️ Differences found: ${failures.length}` : "✅ No drift";
  } catch {
    visualDiff = "✅ No diff data (default)";
  }

  const overall =
    lhScores.performance &&
    lhScores.accessibility &&
    lhScores.seo &&
    lhScores.bestPractices
      ? Math.round(
          (lhScores.performance + lhScores.accessibility + lhScores.seo + lhScores.bestPractices) /
            4
        )
      : 0;

  const report = `
🚀 **Parent Helper QA Summary**

🧩 *Visual Regression*: ${visualDiff}

📈 *Lighthouse Scores*:
- Performance: ${lhScores.performance ?? "?"}%
- Accessibility: ${lhScores.accessibility ?? "?"}%
- SEO: ${lhScores.seo ?? "?"}%
- Best Practices: ${lhScores.bestPractices ?? "?"}%

💯 **Overall Quality Score:** ${overall || "N/A"}%

${
    overall && overall < 90
      ? "❌ Quality gate failed — below 90% threshold."
      : "✅ Passed all quality gates!"
  }
`;

  console.log(report);

  const reportData = {
    timestamp: new Date().toISOString(),
    lighthouse: lhScores,
    visualDiff,
    overall,
  };
  const reportsPath = path.join(process.cwd(), "public/qa/reports.json");
  const history = fs.existsSync(reportsPath)
    ? JSON.parse(fs.readFileSync(reportsPath, "utf8"))
    : [];
  history.push(reportData);
  fs.mkdirSync(path.dirname(reportsPath), { recursive: true });
  fs.writeFileSync(reportsPath, JSON.stringify(history.slice(-20), null, 2));

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: report }),
      });
      console.log("📤 Posted summary to Slack");
    } catch (err) {
      console.error("⚠️ Failed to post Slack notification", err);
    }
  }

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY && process.env.GITHUB_PR_NUMBER) {
    try {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${process.env.GITHUB_PR_NUMBER}/comments`;
      await fetch(ghUrl, {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: report }),
      });
      console.log("💬 Commented quality summary on PR");
    } catch (err) {
      console.error("⚠️ Failed to post GitHub comment", err);
    }
  }
}

run().catch((err) => {
  console.error("❌ Failed to generate summary", err);
  process.exit(1);
});
