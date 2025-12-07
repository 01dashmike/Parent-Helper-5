#!/usr/bin/env node

/**
 * Migration Verification Script
 * Validates migration files and checks for consistency
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const migrationsDir = join(projectRoot, "supabase", "migrations");

async function verifyMigrations() {
  console.log("🔍 Verifying migration files...\n");

  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));

    if (sqlFiles.length === 0) {
      console.log("⚠️  No migration files found");
      return { success: true, warnings: ["No migrations"] };
    }

    console.log(`Found ${sqlFiles.length} migration file(s)\n`);

    const errors = [];
    const warnings = [];

    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const content = await readFile(filePath, "utf-8");

      // Check naming convention: YYYYMMDD_description.sql or YYYYMMDDHHMMSS_description.sql
      const namePattern = /^(\d{8}|\d{14})_[a-z0-9_]+\.sql$/i;
      if (!namePattern.test(file)) {
        errors.push(
          `Invalid filename: ${file} (must be YYYYMMDD_description.sql or YYYYMMDDHHMMSS_description.sql)`,
        );
      }

      // Check for common SQL issues
      if (content.includes("DROP TABLE") || content.includes("DROP COLUMN")) {
        warnings.push(`${file}: Contains DROP statements (potential breaking change)`);
      }

      // Check for balanced parentheses
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`${file}: Unbalanced parentheses`);
      }

      // Check for basic SQL syntax
      if (!content.trim()) {
        errors.push(`${file}: File is empty`);
      }

      console.log(`✓ ${file}`);
    }

    if (errors.length > 0) {
      console.error("\n❌ Errors found:");
      errors.forEach((err) => console.error(`  - ${err}`));
      return { success: false, errors, warnings };
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      warnings.forEach((warn) => console.log(`  - ${warn}`));
    }

    console.log("\n✅ All migration files are valid");
    return { success: true, warnings };
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("⚠️  Migrations directory not found, skipping verification");
      return { success: true, warnings: ["No migrations directory"] };
    }
    throw error;
  }
}

// Run verification
verifyMigrations()
  .then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

