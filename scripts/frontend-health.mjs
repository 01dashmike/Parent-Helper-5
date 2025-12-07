#!/usr/bin/env node
/**
 * Frontend Health Summary
 * Analyzes lint errors, type errors, warnings, and calculates stability score
 */

import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

// Allowed error patterns (warnings that are acceptable)
const ALLOWED_ERRORS = [
    /unused.*import/i,
    /is defined but never used/i,
    /prefer.*const/i,
    /@typescript-eslint\/no-explicit-any/i,
];

// Critical error patterns (must fix)
const CRITICAL_ERRORS = [
    /cannot find module/i,
    /is not defined/i,
    /cannot find name/i,
    /property.*does not exist/i,
    /type.*is not assignable/i,
    /unexpected token/i,
    /syntax error/i,
];

// Refactoring indicators
const REFACTOR_INDICATORS = [
    /any.*type/i,
    /@ts-ignore/i,
    /@ts-nocheck/i,
    /eslint-disable/i,
    /complexity/i,
    /cyclomatic/i,
    /too many/i,
];

function runESLint() {
    try {
        console.log(chalk.blue("▶ Running ESLint..."));
        const output = execSync("npx eslint . --ext .ts,.tsx --format json 2>&1", {
            cwd: ROOT_DIR,
            encoding: "utf-8",
            stdio: "pipe",
        });
        const parsed = JSON.parse(output);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        // ESLint returns non-zero exit code if there are errors
        try {
            const output = error.stdout?.toString() || error.stderr?.toString() || "";
            // Try to extract JSON from output (might have other text)
            const jsonMatch = output.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            // Try parsing entire output
            if (output.trim() && output.trim().startsWith("[")) {
                return JSON.parse(output);
            }
        } catch (parseError) {
            // If parsing fails, return empty results
            console.log(chalk.yellow("  ⚠ Could not parse ESLint JSON output"));
        }
        return [];
    }
}

function runTypeCheck() {
    try {
        console.log(chalk.blue("▶ Running TypeScript type check..."));
        const output = execSync("npx tsc --noEmit --pretty false", {
            cwd: ROOT_DIR,
            encoding: "utf-8",
            stdio: "pipe",
        });
        return { errors: [], warnings: [] };
    } catch (error) {
        const output = error.stdout?.toString() || error.stderr?.toString() || "";
        return parseTypeScriptErrors(output);
    }
}

function parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split("\n");
    let currentError = null;

    for (const line of lines) {
        // Match TypeScript error format: file.ts(123,45): error TS2345: Message
        // Also handle: file.ts:123:45 - error TS2345: Message
        const errorMatch = line.match(/^(.+?)(?:\((\d+),(\d+)\)|:(\d+):(\d+)):\s*(error|warning)\s+(TS\d+):\s*(.+)$/);
        if (errorMatch) {
            if (currentError) {
                errors.push(currentError);
            }
            const [, file, lineNum1, col1, lineNum2, col2, severity, code, message] = errorMatch;
            currentError = {
                file: file.trim(),
                line: parseInt(lineNum1 || lineNum2),
                column: parseInt(col1 || col2),
                severity: severity === "error" ? "error" : "warning",
                code,
                message: message.trim(),
            };
        } else if (currentError && line.trim() && !line.trim().startsWith(" ")) {
            // Continuation of error message (indented lines)
            if (line.trim().length > 0) {
                currentError.message += " " + line.trim();
            }
        } else if (currentError && (!line.trim() || line.match(/^\s*$/))) {
            // Empty line ends current error
            errors.push(currentError);
            currentError = null;
        } else if (currentError && line.trim()) {
            // Additional context lines
            currentError.message += " " + line.trim();
        }
    }
    if (currentError) {
        errors.push(currentError);
    }

    return {
        errors: errors.filter((e) => e.severity === "error"),
        warnings: errors.filter((e) => e.severity === "warning"),
    };
}

function analyzeFiles(eslintResults, typeErrors) {
    const fileStats = new Map();

    // Process ESLint results
    for (const file of eslintResults) {
        if (!file.filePath) continue;
        const relPath = relative(ROOT_DIR, file.filePath);
        const errors = file.messages?.filter((m) => m.severity === 2) || [];
        const warnings = file.messages?.filter((m) => m.severity === 1) || [];

        if (!fileStats.has(relPath)) {
            fileStats.set(relPath, { errors: 0, warnings: 0, issues: [] });
        }
        const stats = fileStats.get(relPath);
        stats.errors += errors.length;
        stats.warnings += warnings.length;
        stats.issues.push(...errors.map((e) => ({ type: "error", rule: e.ruleId, message: e.message })));
        stats.issues.push(...warnings.map((w) => ({ type: "warning", rule: w.ruleId, message: w.message })));
    }

    // Process TypeScript errors
    for (const error of typeErrors.errors) {
        const relPath = relative(ROOT_DIR, error.file);
        if (!fileStats.has(relPath)) {
            fileStats.set(relPath, { errors: 0, warnings: 0, issues: [] });
        }
        const stats = fileStats.get(relPath);
        stats.errors += 1;
        stats.issues.push({ type: "error", rule: error.code, message: error.message });
    }

    return fileStats;
}

function categorizeErrors(eslintResults, typeErrors) {
    const allowed = [];
    const forbidden = [];
    const warnings = [];

    // Categorize ESLint issues
    for (const file of eslintResults) {
        for (const message of file.messages || []) {
            const isAllowed = ALLOWED_ERRORS.some((pattern) => pattern.test(message.message));
            const isCritical = CRITICAL_ERRORS.some((pattern) => pattern.test(message.message));

            if (message.severity === 2) {
                // Error
                if (isAllowed) {
                    allowed.push({ file: file.filePath, ...message });
                } else {
                    forbidden.push({ file: file.filePath, ...message, critical: isCritical });
                }
            } else if (message.severity === 1) {
                // Warning
                warnings.push({ file: file.filePath, ...message });
            }
        }
    }

    // Categorize TypeScript errors
    for (const error of typeErrors.errors) {
        const isAllowed = ALLOWED_ERRORS.some((pattern) => pattern.test(error.message));
        const isCritical = CRITICAL_ERRORS.some((pattern) => pattern.test(error.message));

        if (isAllowed) {
            allowed.push({ file: error.file, ...error });
        } else {
            forbidden.push({ file: error.file, ...error, critical: isCritical });
        }
    }

    return { allowed, forbidden, warnings };
}

function identifyRefactorAreas(fileStats) {
    const refactorAreas = [];
    const areaPatterns = {
        "Type Safety": /any|@ts-ignore|@ts-nocheck/i,
        "Unused Code": /unused|never used|defined but never/i,
        "Complexity": /complexity|cyclomatic|too many/i,
        "Import Organization": /import.*order|unused.*import/i,
        "React Hooks": /react-hooks|exhaustive-deps|missing dependency/i,
        "Accessibility": /a11y|aria|accessibility/i,
        "Performance": /performance|useMemo|useCallback/i,
    };

    for (const [file, stats] of fileStats.entries()) {
        const issues = stats.issues || [];
        const areaCounts = {};

        for (const issue of issues) {
            const message = issue.message || "";
            for (const [area, pattern] of Object.entries(areaPatterns)) {
                if (pattern.test(message) || pattern.test(issue.rule || "")) {
                    areaCounts[area] = (areaCounts[area] || 0) + 1;
                }
            }
        }

        for (const [area, count] of Object.entries(areaCounts)) {
            refactorAreas.push({ area, file, count, totalIssues: stats.errors + stats.warnings });
        }
    }

    // Aggregate by area
    const aggregated = new Map();
    for (const item of refactorAreas) {
        if (!aggregated.has(item.area)) {
            aggregated.set(item.area, { area: item.area, files: 0, issues: 0, fileList: [] });
        }
        const agg = aggregated.get(item.area);
        agg.files += 1;
        agg.issues += item.count;
        agg.fileList.push({ file: item.file, count: item.count });
    }

    return Array.from(aggregated.values())
        .sort((a, b) => b.issues - a.issues)
        .slice(0, 10);
}

function calculateStabilityScore(stats) {
    let score = 10;

    // Deduct for forbidden errors (critical issues)
    const criticalErrors = stats.forbidden.filter((e) => e.critical).length;
    score -= Math.min(criticalErrors * 0.5, 4); // Max 4 points deduction

    // Deduct for other forbidden errors
    const otherErrors = stats.forbidden.filter((e) => !e.critical).length;
    score -= Math.min(otherErrors * 0.1, 3); // Max 3 points deduction

    // Deduct for warnings
    score -= Math.min(stats.warnings.length * 0.05, 2); // Max 2 points deduction

    // Deduct for type errors
    score -= Math.min(stats.typeErrors * 0.2, 1); // Max 1 point deduction

    return Math.max(1, Math.round(score * 10) / 10);
}

function getFileCounts() {
    try {
        const countFiles = (dir, ext) => {
            let count = 0;
            try {
                const entries = readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
                        count += countFiles(fullPath, ext);
                    } else if (entry.isFile() && entry.name.endsWith(ext)) {
                        count += 1;
                    }
                }
            } catch {
                // Skip directories we can't read
            }
            return count;
        };

        return {
            tsx: countFiles(join(ROOT_DIR, "app"), ".tsx") + countFiles(join(ROOT_DIR, "components"), ".tsx"),
            ts: countFiles(join(ROOT_DIR, "app"), ".ts") + countFiles(join(ROOT_DIR, "components"), ".ts") + countFiles(join(ROOT_DIR, "lib"), ".ts"),
        };
    } catch {
        return { tsx: 0, ts: 0 };
    }
}

async function main() {
    console.log(chalk.bold.cyan("\n📊 Frontend Health Summary\n"));
    console.log(chalk.gray("=".repeat(70)));

    // Run analyses
    const eslintResults = runESLint();
    const typeCheckResults = runTypeCheck();
    const fileStats = analyzeFiles(eslintResults, typeCheckResults);
    const categorized = categorizeErrors(eslintResults, typeCheckResults);

    // Get file counts
    const fileCounts = getFileCounts();

    // Identify refactor areas
    const refactorAreas = identifyRefactorAreas(fileStats);

    // Calculate stability score
    const stabilityScore = calculateStabilityScore({
        forbidden: categorized.forbidden,
        warnings: categorized.warnings,
        typeErrors: typeCheckResults.errors.length,
    });

    // Get top affected files
    const topFiles = Array.from(fileStats.entries())
        .map(([file, stats]) => ({
            file,
            total: stats.errors + stats.warnings,
            errors: stats.errors,
            warnings: stats.warnings,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    const criticalCount = categorized.forbidden.filter((e) => e.critical).length;

    // Quick summary table
    console.log(chalk.bold("\n📋 Quick Summary\n"));
    console.log(chalk.gray("─".repeat(70)));
    console.log(chalk.white(`  Lint Errors (Allowed):     ${chalk.green(chalk.bold(categorized.allowed.length))}`));
    console.log(chalk.white(`  Lint Errors (Forbidden):   ${chalk.red(chalk.bold(categorized.forbidden.length))}`));
    if (criticalCount > 0) {
        console.log(chalk.white(`    └─ Critical:              ${chalk.red(chalk.bold(criticalCount))}`));
    }
    console.log(chalk.white(`  Warnings:                  ${chalk.yellow(chalk.bold(categorized.warnings.length))}`));
    console.log(chalk.white(`  Type Errors:               ${chalk.red(chalk.bold(typeCheckResults.errors.length))}`));
    if (typeCheckResults.warnings.length > 0) {
        console.log(chalk.white(`  Type Warnings:             ${chalk.yellow(chalk.bold(typeCheckResults.warnings.length))}`));
    }
    console.log(chalk.white(`  Files Analyzed:            ${chalk.blue(chalk.bold(fileCounts.ts + fileCounts.tsx))}`));
    const scoreColorDisplay = stabilityScore >= 8 ? chalk.green : stabilityScore >= 6 ? chalk.yellow : chalk.red;
    console.log(chalk.white(`  Stability Score:           ${scoreColorDisplay(chalk.bold(`${stabilityScore}/10`))}`));
    console.log(chalk.gray("─".repeat(70)));

    // Detailed metrics
    console.log(chalk.bold("\n📈 Detailed Metrics\n"));

    console.log(chalk.white("Lint Errors:"));
    console.log(chalk.green(`  ✅ Allowed: ${chalk.bold(categorized.allowed.length)}`));
    console.log(chalk.red(`  ❌ Forbidden: ${chalk.bold(categorized.forbidden.length)}`));
    if (criticalCount > 0) {
        console.log(chalk.red(`     └─ Critical: ${chalk.bold(criticalCount)}`));
    }

    console.log(chalk.yellow(`\n⚠️  Warnings: ${chalk.bold(categorized.warnings.length)}`));

    console.log(chalk.red(`\n🔴 Type Errors: ${chalk.bold(typeCheckResults.errors.length)}`));
    if (typeCheckResults.warnings.length > 0) {
        console.log(chalk.yellow(`  Type Warnings: ${chalk.bold(typeCheckResults.warnings.length)}`));
    }

    console.log(chalk.blue(`\n📁 Total Files Analyzed:`));
    console.log(`  TypeScript/TSX: ${fileCounts.ts + fileCounts.tsx} files`);

    // Top affected files
    if (topFiles.length > 0) {
        console.log(chalk.bold("\n🔝 Top 10 Most Affected Files\n"));
        topFiles.forEach((file, index) => {
            const color = file.errors > 0 ? chalk.red : chalk.yellow;
            console.log(color(`  ${index + 1}. ${file.file}`));
            console.log(`     ${file.errors} errors, ${file.warnings} warnings (${file.total} total)`);
        });
    }

    // Refactor areas
    if (refactorAreas.length > 0) {
        console.log(chalk.bold("\n🔧 Top Areas Needing Refactor\n"));
        refactorAreas.forEach((area, index) => {
            console.log(chalk.cyan(`  ${index + 1}. ${area.area}`));
            console.log(`     ${area.issues} issues across ${area.files} files`);
            if (area.fileList.length > 0) {
                const topFiles = area.fileList.sort((a, b) => b.count - a.count).slice(0, 3);
                topFiles.forEach((f) => {
                    console.log(chalk.gray(`     └─ ${f.file}: ${f.count} issues`));
                });
            }
        });
    }

    // Stability score
    console.log(chalk.bold("\n📊 Stability Score\n"));
    const scoreColor =
        stabilityScore >= 8 ? chalk.green : stabilityScore >= 6 ? chalk.yellow : chalk.red;
    const scoreBar = "█".repeat(Math.round(stabilityScore)) + "░".repeat(10 - Math.round(stabilityScore));
    console.log(scoreColor(`  ${stabilityScore}/10 ${scoreBar}`));

    if (stabilityScore >= 8) {
        console.log(chalk.green("  ✅ Frontend is in excellent health"));
    } else if (stabilityScore >= 6) {
        console.log(chalk.yellow("  ⚠️  Frontend needs attention but is manageable"));
    } else {
        console.log(chalk.red("  ❌ Frontend requires immediate refactoring"));
    }

    // Recommendations
    console.log(chalk.bold("\n💡 Recommendations\n"));
    if (categorized.forbidden.length > 0) {
        console.log(chalk.red(`  • Fix ${categorized.forbidden.length} forbidden lint errors`));
    }
    if (criticalCount > 0) {
        console.log(chalk.red(`  • Address ${criticalCount} critical errors immediately`));
    }
    if (typeCheckResults.errors.length > 0) {
        console.log(chalk.red(`  • Resolve ${typeCheckResults.errors.length} TypeScript errors`));
    }
    if (refactorAreas.length > 0) {
        console.log(chalk.yellow(`  • Focus on: ${refactorAreas[0].area} (${refactorAreas[0].issues} issues)`));
    }
    if (categorized.warnings.length > 50) {
        console.log(chalk.yellow(`  • Reduce warnings (currently ${categorized.warnings.length})`));
    }

    console.log(chalk.gray("\n" + "=".repeat(70) + "\n"));

    // Return exit code based on critical issues
    if (criticalCount > 0 || typeCheckResults.errors.length > 20) {
        process.exit(1);
    }
    process.exit(0);
}

main().catch((error) => {
    console.error(chalk.red("\n❌ Fatal error:"), error);
    process.exit(1);
});

