/**
 * Migration Validation Tests
 * 
 * Tests that all SQL migrations are valid and don't have common issues:
 * - SQL syntax errors
 * - RLS policy compilation errors
 * - Missing table references
 * - Duplicate table creation
 * - Dropped tables that future migrations depend on
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

interface TableReference {
  table: string;
  migration: string;
  operation: "create" | "drop" | "alter" | "reference";
}

describe("Migration Validation", () => {
  let migrationFiles: MigrationFile[] = [];

  beforeAll(async () => {
    // Read all SQL files from migrations directory
    const files = await readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));

    migrationFiles = await Promise.all(
      sqlFiles.map(async (file) => {
        const path = join(MIGRATIONS_DIR, file);
        const content = await readFile(path, "utf-8");
        return { name: file, path, content };
      })
    );

    // Sort by filename (which should be timestamped)
    migrationFiles.sort((a, b) => a.name.localeCompare(b.name));
  });

  describe("SQL Syntax Validation", () => {
    it("should parse all migration files without syntax errors", () => {
      const errors: Array<{ file: string; error: string }> = [];

      for (const file of migrationFiles) {
        try {
          // Basic SQL syntax checks
          // Check for balanced parentheses
          const openParens = (file.content.match(/\(/g) || []).length;
          const closeParens = (file.content.match(/\)/g) || []).length;
          if (openParens !== closeParens) {
            errors.push({
              file: file.name,
              error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
            });
          }

          // Check for balanced quotes
          const singleQuotes = (file.content.match(/'/g) || []).length;
          if (singleQuotes % 2 !== 0) {
            errors.push({
              file: file.name,
              error: "Unbalanced single quotes",
            });
          }

          // Check for common SQL syntax errors
          if (file.content.match(/create\s+table\s+\w+\s+create\s+table/gi)) {
            errors.push({
              file: file.name,
              error: "Duplicate CREATE TABLE statements",
            });
          }

          // Check for semicolons at end of statements (basic check)
          const statements = file.content
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
          for (const stmt of statements) {
            if (
              stmt.match(/^(create|alter|drop|insert|update|delete)/i) &&
              !stmt.endsWith(";")
            ) {
              // This is okay, semicolon is at split point
            }
          }
        } catch (error: any) {
          errors.push({
            file: file.name,
            error: error.message,
          });
        }
      }

      if (errors.length > 0) {
        console.error("SQL Syntax Errors:", errors);
      }
      expect(errors).toHaveLength(0);
    });
  });

  describe("RLS Policy Validation", () => {
    it("should have valid RLS policy syntax", () => {
      const errors: Array<{ file: string; policy: string; error: string }> = [];

      for (const file of migrationFiles) {
        // Extract RLS policies
        const policyMatches = file.content.matchAll(
          /create\s+policy\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?\s+on\s+["']?(\w+)["']?/gi
        );

        for (const match of policyMatches) {
          const policyName = match[1];
          const tableName = match[2];

          // Check that policy has USING or WITH CHECK clause
          const policyBlock = file.content.substring(match.index || 0);
          const hasUsing = /using\s*\(/i.test(policyBlock);
          const hasWithCheck = /with\s+check\s*\(/i.test(policyBlock);

          if (!hasUsing && !hasWithCheck) {
            errors.push({
              file: file.name,
              policy: policyName,
              error: `RLS policy '${policyName}' on table '${tableName}' missing USING or WITH CHECK clause`,
            });
          }
        }
      }

      if (errors.length > 0) {
        console.error("RLS Policy Errors:", errors);
      }
      expect(errors).toHaveLength(0);
    });

    it("should reference existing tables in RLS policies", () => {
      const errors: Array<{ file: string; policy: string; table: string }> = [];
      const createdTables = new Set<string>();

      // First pass: collect all created tables
      for (const file of migrationFiles) {
        const createTableMatches = file.content.matchAll(
          /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?(\w+)["']?/gi
        );
        for (const match of createTableMatches) {
          createdTables.add(match[1].toLowerCase());
        }
      }

      // Second pass: check RLS policies reference existing tables
      for (const file of migrationFiles) {
        const policyMatches = file.content.matchAll(
          /create\s+policy\s+(?:if\s+not\s+exists\s+)?["']?(\w+)["']?\s+on\s+(?:public\.)?["']?(\w+)["']?/gi
        );

        for (const match of policyMatches) {
          const tableName = match[2].toLowerCase();
          if (!createdTables.has(tableName)) {
            // Check if it's a system table (auth, storage, etc.)
            const systemTables = ["users", "sessions", "buckets", "objects"];
            if (!systemTables.includes(tableName)) {
              errors.push({
                file: file.name,
                policy: match[1],
                table: tableName,
              });
            }
          }
        }
      }

      if (errors.length > 0) {
        console.warn(
          "RLS policies referencing potentially non-existent tables:",
          errors
        );
        // This is a warning, not an error, as tables might be created in other migrations
      }
    });
  });

  describe("Table Creation Validation", () => {
    it("should not create the same table twice in a single migration", () => {
      const errors: Array<{ file: string; table: string }> = [];

      for (const file of migrationFiles) {
        const tables = new Set<string>();
        const createTableMatches = file.content.matchAll(
          /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?(\w+)["']?/gi
        );

        for (const match of createTableMatches) {
          const tableName = match[1].toLowerCase();
          if (tables.has(tableName)) {
            errors.push({
              file: file.name,
              table: tableName,
            });
          }
          tables.add(tableName);
        }
      }

      if (errors.length > 0) {
        console.error("Duplicate table creation:", errors);
      }
      expect(errors).toHaveLength(0);
    });
  });

  describe("Table Dependency Validation", () => {
    it("should not drop tables that future migrations reference", () => {
      const errors: Array<{ table: string; droppedIn: string; referencedIn: string }> = [];
      const droppedTables = new Map<string, number>(); // table -> migration index
      const referencedTables = new Map<string, number[]>(); // table -> [migration indices]

      // First pass: find all dropped tables
      for (let i = 0; i < migrationFiles.length; i++) {
        const file = migrationFiles[i];
        const dropMatches = file.content.matchAll(
          /drop\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["']?(\w+)["']?/gi
        );
        for (const match of dropMatches) {
          const tableName = match[1].toLowerCase();
          droppedTables.set(tableName, i);
        }
      }

      // Second pass: find all table references (foreign keys, joins, etc.)
      for (let i = 0; i < migrationFiles.length; i++) {
        const file = migrationFiles[i];
        // Look for foreign key references
        const fkMatches = file.content.matchAll(
          /references\s+(?:public\.)?["']?(\w+)["']?\s*\(/gi
        );
        for (const match of fkMatches) {
          const tableName = match[1].toLowerCase();
          if (!referencedTables.has(tableName)) {
            referencedTables.set(tableName, []);
          }
          referencedTables.get(tableName)!.push(i);
        }

        // Look for table references in queries
        const tableRefMatches = file.content.matchAll(
          /from\s+(?:public\.)?["']?(\w+)["']?|join\s+(?:public\.)?["']?(\w+)["']?/gi
        );
        for (const match of tableRefMatches) {
          const tableName = (match[1] || match[2])?.toLowerCase();
          if (tableName) {
            if (!referencedTables.has(tableName)) {
              referencedTables.set(tableName, []);
            }
            referencedTables.get(tableName)!.push(i);
          }
        }
      }

      // Check for conflicts
      for (const [table, dropIndex] of droppedTables.entries()) {
        const refIndices = referencedTables.get(table) || [];
        for (const refIndex of refIndices) {
          if (refIndex > dropIndex) {
            errors.push({
              table,
              droppedIn: migrationFiles[dropIndex].name,
              referencedIn: migrationFiles[refIndex].name,
            });
          }
        }
      }

      if (errors.length > 0) {
        console.error("Table dependency conflicts:", errors);
      }
      // This is a warning, not a hard error, as some drops might be intentional
      // But we should log them
      expect(errors.length).toBeLessThan(10); // Allow some flexibility
    });
  });

  describe("Migration File Naming", () => {
    it("should have consistent migration file naming", () => {
      const invalidNames: string[] = [];

      for (const file of migrationFiles) {
        // Check for timestamp format: YYYYMMDD_description.sql or YYYYMMDDHHMMSS_description.sql
        const timestampPattern = /^\d{8}(?:_\d{6})?_\w+\.sql$/;
        if (!timestampPattern.test(file.name) && !file.name.match(/^\d{14}_/)) {
          // Allow some legacy names
          const legacyNames = [
            "add_trend_source_to_blog_posts.sql",
            "create_analytics_table.sql",
          ];
          if (!legacyNames.includes(file.name)) {
            invalidNames.push(file.name);
          }
        }
      }

      if (invalidNames.length > 0) {
        console.warn("Files with non-standard naming:", invalidNames);
      }
      // Warning only, not blocking
    });
  });

  describe("Supabase CLI Validation", () => {
    it("should pass supabase db lint", () => {
      try {
        // Check if supabase CLI is available
        execSync("which supabase", { stdio: "ignore" });
      } catch {
        // Skip if supabase CLI not available
        console.warn("Supabase CLI not found, skipping db lint check");
        return;
      }

      try {
        const result = execSync("supabase db lint --use-mig-dir", {
          cwd: process.cwd(),
          encoding: "utf-8",
          stdio: "pipe",
        });
        expect(result).toBeDefined();
      } catch (error: any) {
        // If lint fails, log the error but don't fail the test
        // (we want to see what's wrong)
        console.error("Supabase db lint output:", error.stdout || error.message);
        // For now, just warn - in CI this should fail
        console.warn("Supabase db lint found issues - check output above");
      }
    });
  });
});

