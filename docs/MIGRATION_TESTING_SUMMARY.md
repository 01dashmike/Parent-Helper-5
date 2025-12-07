# Migration Testing System - Implementation Summary

## ✅ Created Files

### Test Files
1. **`tests/unit/migrations/validateMigrations.test.ts`**
   - Unit tests for migration validation
   - Tests SQL syntax, RLS policies, table references, dependencies

2. **`tests/e2e/migrations/migration-flow.spec.ts`**
   - E2E tests for full migration flow
   - Tests against live Supabase instance

### Scripts
3. **`scripts/assert-migrations-clean.mjs`**
   - Comprehensive migration validation script
   - Runs Supabase CLI checks (lint, diff, schema validation)

### CI/CD
4. **`.github/workflows/migrations.yml`**
   - GitHub Actions workflow for migration testing
   - Runs on PRs and pushes to main/develop

### Documentation
5. **`docs/MIGRATION_TESTING.md`**
   - Complete guide for migration testing
   - Troubleshooting and best practices

## 📝 Modified Files

### `package.json`
Added scripts:
- `test:migrations` - Run full migration test suite
- `migration:verify` - Quick migration validation
- `migration:test` - Alias for test:migrations

Updated hooks:
- `prebuild` - Now runs `migration:verify`
- `prestart` - Now runs `migration:verify`

## 🚀 How to Run

### Quick Start

```bash
# Run all migration tests
npm run test:migrations

# Verify migrations (faster, no unit tests)
npm run migration:verify

# Run unit tests only
npm run test:unit tests/unit/migrations/validateMigrations.test.ts

# Run E2E tests (requires Docker)
npm run test:e2e tests/e2e/migrations/migration-flow.spec.ts
```

### Pre-build Verification

Migrations are automatically verified before:
- `npm run build` (via `prebuild` hook)
- `npm start` (via `prestart` hook)

## 🔍 What Gets Tested

### Unit Tests Validate:
- ✅ SQL syntax (balanced parentheses, quotes)
- ✅ RLS policy syntax (USING/WITH CHECK clauses)
- ✅ Table references in RLS policies
- ✅ No duplicate table creation
- ✅ No dropped tables that future migrations depend on
- ✅ Migration file naming conventions

### E2E Tests Validate:
- ✅ All migrations apply successfully
- ✅ Tables exist after migrations
- ✅ RLS policies are enabled
- ✅ Data operations work (inserts, queries)
- ✅ Foreign key constraints work
- ✅ Triggers execute

### Assertion Script Validates:
- ✅ `supabase db lint` passes
- ✅ `supabase db diff` shows no drift
- ✅ Schema validation (optional, requires Docker)

## 🐛 Inspecting Failed Migrations

### Step 1: Review Error Output
The test output shows:
- Which migration file failed
- Error type and message
- Actionable fix suggestions

### Step 2: Check Specific Migration
```bash
# Lint specific file
supabase db lint --use-mig-dir --file supabase/migrations/YOUR_FILE.sql

# View migration
cat supabase/migrations/YOUR_FILE.sql
```

### Step 3: Test Locally
```bash
# Start Supabase
supabase start

# Apply migrations
supabase db reset

# Check for errors
```

### Step 4: Common Fixes

**SQL Syntax Error**:
- Check for unbalanced parentheses/quotes
- Use SQL formatter
- Run: `supabase db lint --use-mig-dir`

**RLS Policy Error**:
- Ensure USING and WITH CHECK clauses exist
- Verify table names are correct

**Table Reference Error**:
- Ensure table is created before policies reference it
- Check table name spelling

**Schema Drift**:
- Review diff output
- Create new migration if needed
- Or reset: `supabase db reset`

## 📋 CI/CD Integration

### GitHub Actions

The workflow (`.github/workflows/migrations.yml`) runs:
- On PRs that modify migrations
- On pushes to main/develop
- Manual workflow dispatch

**What it does**:
1. Installs Supabase CLI
2. Runs unit tests
3. Runs migration assertion script
4. Checks for schema drift
5. Runs DB lint
6. Optionally runs E2E tests (if Docker available)
7. Comments on PR if tests fail

### Pre-commit (Optional)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm run migration:verify
```

## 🎯 Future Migrations

### Best Practices

1. **Naming**: `YYYYMMDD_description.sql`
2. **Idempotent**: Use `if not exists` where possible
3. **RLS**: Always include USING and WITH CHECK
4. **Test**: Run `npm run migration:verify` before committing

### Migration Template

```sql
-- Migration: Description
begin;

create table if not exists public.my_table (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now() not null
);

create index if not exists my_table_name_idx on public.my_table(name);

alter table public.my_table enable row level security;

create policy "my_table_select" on public.my_table
  for select
  using (true);

commit;
```

## 📚 Documentation

- **Full Guide**: `docs/MIGRATION_TESTING.md`
- **This Summary**: `docs/MIGRATION_TESTING_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs/guides/cli/local-development#database-migrations

## 🔧 Troubleshooting

### Supabase CLI Not Found
```bash
npm install -g supabase
# Or use npx
npx supabase --version
```

### Docker Not Running (E2E tests)
- Start Docker Desktop
- Or skip E2E: `npm run migration:verify` (unit tests only)

### Port Conflicts
```bash
supabase stop
# Or use different ports
supabase start --port 54322
```

## ✨ Key Features

- ✅ **Automated**: Runs before build/start
- ✅ **Comprehensive**: Tests syntax, policies, dependencies
- ✅ **Fast**: Unit tests run quickly
- ✅ **CI/CD**: Integrated with GitHub Actions
- ✅ **Actionable**: Clear error messages with fixes
- ✅ **Documented**: Complete guide and examples

## 🎉 Success!

Your migration testing system is now set up and ready to use. All migrations will be automatically validated before builds, and CI will catch issues in PRs.

For questions or issues, refer to `docs/MIGRATION_TESTING.md`.

