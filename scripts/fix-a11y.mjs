import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const cheerio = require("cheerio");

/**
 * Runs accessibility audit on HTML and automatically fixes common issues
 * This is a simplified version for the .mjs script
 */
function runA11yAudit(html) {
  const $ = cheerio.load(html);
  const issues = [];
  let fixed = 0;

  // Missing alt text
  $("img:not([alt])").each((_, el) => {
    const src = $(el).attr("src") || "unknown";
    const isDecorative = src.includes("decoration") || src.includes("spacer") || src.includes("divider");
    const altText = isDecorative ? "" : "Image description";
    $(el).attr("alt", altText);
    issues.push({ type: "missing-alt", element: "img", message: `Missing alt on image: ${src}`, fix: `Added alt="${altText}"` });
    fixed++;
  });

  // Inputs without labels
  $("input:not([aria-label]):not([aria-labelledby]):not([id])").each((_, el) => {
    const type = $(el).attr("type") || "text";
    const name = $(el).attr("name") || "input";
    const placeholder = $(el).attr("placeholder") || "";
    const inferredLabel = placeholder || name.charAt(0).toUpperCase() + name.slice(1);
    $(el).attr("aria-label", inferredLabel);
    issues.push({ type: "missing-label", element: "input", message: `Input missing accessible name: ${type}`, fix: `Added aria-label="${inferredLabel}"` });
    fixed++;
  });

  // Textareas without labels
  $("textarea:not([aria-label]):not([aria-labelledby]):not([id])").each((_, el) => {
    const placeholder = $(el).attr("placeholder") || "";
    const inferredLabel = placeholder || "Text area";
    $(el).attr("aria-label", inferredLabel);
    issues.push({ type: "missing-label", element: "textarea", message: "Textarea missing accessible name", fix: `Added aria-label="${inferredLabel}"` });
    fixed++;
  });

  // Heading order
  let lastLevel = 0;
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName[1], 10);
    if (lastLevel > 0 && level - lastLevel > 1) {
      issues.push({ type: "heading-order", element: el.tagName, message: `Skipped heading level: ${el.tagName} after h${lastLevel}` });
    }
    lastLevel = level;
  });

  // Missing lang attribute
  if (!$("html").attr("lang")) {
    $("html").attr("lang", "en");
    issues.push({ type: "missing-lang", element: "html", message: "Missing lang attribute on html element", fix: 'Added lang="en"' });
    fixed++;
  }

  return { html: $.html(), issues, fixed };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Ensure reports directory exists
const reportsDir = path.join(projectRoot, "tests", "reports");
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

const logFile = path.join(reportsDir, "a11y-fixes.log");

// Clear previous log
if (fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, `A11y Auto-Fix Report - ${new Date().toISOString()}\n\n`);
}

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and .next build artifacts that aren't useful
            if (!file.startsWith(".") && file !== "node_modules") {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith(".html")) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

async function fixA11yIssues() {
    console.log("♿️ Starting accessibility auto-fix...\n");

    // Look for HTML files in common locations
    const searchDirs = [
        path.join(projectRoot, ".next", "server", "app"),
        path.join(projectRoot, "public"),
        path.join(projectRoot, "app"),
    ];

    const htmlFiles = [];
    for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
            const files = findHtmlFiles(dir);
            htmlFiles.push(...files);
        }
    }

    if (htmlFiles.length === 0) {
        console.log("⚠️  No HTML files found. Run 'npm run build' first to generate HTML files.");
        return;
    }

    let totalFixed = 0;
    let totalIssues = 0;

    for (const filePath of htmlFiles) {
        try {
            const html = fs.readFileSync(filePath, "utf8");
            const result = await runA11yAudit(html);

            if (result.issues.length > 0) {
                // Write fixed HTML back
                fs.writeFileSync(filePath, result.html, "utf8");

                // Log issues
                const relativePath = path.relative(projectRoot, filePath);
                const logEntry = `\n${"=".repeat(80)}\nFile: ${relativePath}\nFixed: ${result.fixed} issues\n${"=".repeat(80)}\n${result.issues.map((i) => `[${i.type}] ${i.element}: ${i.message}${i.fix ? ` → ${i.fix}` : ""}`).join("\n")}\n`;

                fs.appendFileSync(logFile, logEntry);
                console.log(`♿️  Fixed ${result.fixed} a11y issues in ${relativePath}`);

                totalFixed += result.fixed;
                totalIssues += result.issues.length;
            }
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
        }
    }

    console.log(`\n✅ A11y auto-fix complete.`);
    console.log(`   Total issues found: ${totalIssues}`);
    console.log(`   Total fixes applied: ${totalFixed}`);
    console.log(`   Log file: ${path.relative(projectRoot, logFile)}`);
}

// Also check React/TSX files for common a11y issues
async function checkSourceFiles() {
    console.log("\n🔍 Checking source files for a11y issues...\n");

    const sourceDirs = [
        path.join(projectRoot, "app"),
        path.join(projectRoot, "components"),
    ];

    const tsxFiles = [];
    for (const dir of sourceDirs) {
        if (fs.existsSync(dir)) {
            const files = findHtmlFiles(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));
            tsxFiles.push(...files);
        }
    }

    const sourceIssues = [];

    for (const filePath of tsxFiles.slice(0, 50)) {
        // Limit to first 50 files to avoid performance issues
        try {
            const content = fs.readFileSync(filePath, "utf8");

            // Check for common patterns
            const missingAlt = /<img\s+[^>]*(?!alt=)[^>]*>/g;
            const matches = content.match(missingAlt);
            if (matches) {
                const relativePath = path.relative(projectRoot, filePath);
                sourceIssues.push({
                    file: relativePath,
                    type: "missing-alt",
                    count: matches.length,
                });
            }
        } catch (error) {
            // Skip files that can't be read
        }
    }

    if (sourceIssues.length > 0) {
        const logEntry = `\n${"=".repeat(80)}\nSource File Issues (TSX/JSX)\n${"=".repeat(80)}\n${sourceIssues.map((i) => `${i.file}: ${i.count} ${i.type} issue(s)`).join("\n")}\n`;
        fs.appendFileSync(logFile, logEntry);
        console.log(`⚠️  Found ${sourceIssues.length} files with potential a11y issues`);
    }
}

fixA11yIssues()
    .then(() => checkSourceFiles())
    .catch((error) => {
        console.error("❌ Error running a11y fix:", error);
        process.exit(1);
    });

