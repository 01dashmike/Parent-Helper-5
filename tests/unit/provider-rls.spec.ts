import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.resolve(
  __dirname,
  "../../supabase/migrations/202511080001_provider_console.sql"
);

test.describe("provider console RLS policies", () => {
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const tables = ["providers_users", "venues", "classes", "class_occurrences", "images"];

  test("enables row level security on all provider tables", () => {
    for (const table of tables) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  test("grants service role full access for each table", () => {
    for (const table of tables) {
      expect(sql).toContain(`"${table} service role access"`);
    }
  });

  test("restricts providers to their own records", () => {
    expect(sql).toContain(`"venues read own provider"`);
    expect(sql).toContain(`"classes read own provider"`);
    expect(sql).toContain(`"class_occurrences read own provider"`);
    expect(sql).toContain(`"images read own provider"`);
  });

  test("allows published classes read access", () => {
    const policy = `"classes read own provider"\n  on public.classes\n  for select`;
    expect(sql).toContain(policy);
    expect(sql).toContain("or classes.is_published = true");
  });
});

