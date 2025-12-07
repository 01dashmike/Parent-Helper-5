# Migration Testing Guide

Comprehensive guide for testing Supabase migrations in the Parent Helper project.

## Overview

The migration testing system ensures that all database migrations are:
- Syntactically correct
- Free of common errors (duplicate tables, missing references)
- Compatible with existing schema
- Properly tested end-to-end

## Quick Start

### Run All Migration Tests

```bash
npm run test:migrations
```

This runs:
1. Migration assertion script (`assert-migrations-clean.mjs`)
2. Unit tests for migration validation

### Run Individual Checks

```bash
# Verify migrations (runs lint, diff, schema check)
npm run migration:verify

# Run unit tests only
npm run test:unit tests/unit/migrations/validateMigrations.test.ts

# Run E2E tests (requires Docker)
npm run test:e2e tests/e2e/migrations/migration-flow.spec.ts
```

## Test Suite Components

### 1. Unit Tests (`tests/unit/migrations/validateMigrations.test.ts`)

Validates migrations statically without requiring a database:

- **SQL Syntax Validation**: Checks for balanced parentheses, quotes, common syntax errors
- **RLS Policy Validation**: Ensures policies have USING/WITH CHECK clauses
- **Table Reference Validation**: Verifies RLS policies reference existing tables
- **Duplicate Table Check**: Ensures no table is created twice in one migration
- **Dependency Validation**: Checks for dropped tables that future migrations depend on
- **File Naming**: Validates migration file naming conventions

### 2. E2E Tests (`tests/e2e/migrations/migration-flow.spec.ts`)

Tests migrations against a live Supabase instance:

- Spins up temporary Supabase instance
- Applies all migrations
- Verifies tables exist
- Checks RLS policies
- Tests data operations (inserts, queries)
- Verifies triggers and foreign keys

**Requirements**: Docker and Supabase CLI

### 3. Assertion Script (`scripts/assert-migrations-clean.mjs`)

Runs Supabase CLI validation:

- `supabase db lint --use-mig-dir`: Validates SQL syntax
- `supabase db diff --use-mig-dir`: Checks for schema drift
- `supabase start`: Tests migrations against live instance (optional)

## Running Tests

### Local Development

```bash
# Full migration test suite
npm run test:migrations

# Just verify migrations (faster)
npm run migration:verify

# Test specific migration file
supabase db lint --use-mig-dir --file supabase/migrations/20250120_family_profiles.sql
```

### CI/CD

Migration tests run automatically on:
- Pull requests that modify migrations
- Pushes to `main` or `develop` branches
- Manual workflow dispatch

See `.github/workflows/migrations.yml` for details.

## Common Issues and Fixes

### SQL Syntax Errors

**Error**: `Unbalanced parentheses` or `Unbalanced quotes`

**Fix**:
1. Check the migration file for mismatched parentheses/quotes
2. Use a SQL formatter to identify issues
3. Run: `supabase db lint --use-mig-dir`

### RLS Policy Errors

**Error**: `RLS policy missing USING or WITH CHECK clause`

**Fix**:
```sql
-- ❌ Wrong
create policy "my_policy" on my_table;

-- ✅ Correct
create policy "my_policy" on my_table
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### Table Reference Errors

**Error**: `RLS policy references non-existent table`

**Fix**:
1. Ensure the table is created before policies reference it
2. Check table name spelling (case-sensitive)
3. Verify table is in `public` schema

### Duplicate Table Creation

**Error**: `Table created twice in same migration`

**Fix**:
- Use `create table if not exists` or combine table creation
- Check for duplicate `create table` statements

### Schema Drift

**Error**: `supabase db diff` shows differences

**Fix**:
1. Review the diff output
2. If intentional: Create a new migration to sync
3. If unintentional: Reset local database: `supabase db reset`

## Inspecting Failed Migrations

### Step 1: Review Error Output

The test output will show:
- Which migration file failed
- What type of error occurred
- Line numbers (if available)

### Step 2: Check Specific Migration

```bash
# Lint a specific file
supabase db lint --use-mig-dir --file supabase/migrations/YOUR_FILE.sql

# View the migration
cat supabase/migrations/YOUR_FILE.sql
```

### Step 3: Test Locally

```bash
# Start Supabase
supabase start

# Apply migrations
supabase db reset

# Check for errors in output
```

### Step 4: Validate SQL Manually

Use a SQL validator or test in Supabase Studio:
1. Open Supabase Studio: `supabase studio`
2. Navigate to SQL Editor
3. Paste migration SQL
4. Check for syntax highlighting errors

## Creating New Migrations

### Best Practices

1. **Naming Convention**: `YYYYMMDD_description.sql`
   ```
   20250120_family_profiles.sql
   ```

2. **Use Transactions**: Wrap in transaction blocks
   ```sql
   begin;
   -- your migration
   commit;
   ```

3. **Idempotent Operations**: Use `if not exists` where possible
   ```sql
   create table if not exists ...
   create index if not exists ...
   ```

4. **RLS Policies**: Always include USING and WITH CHECK
   ```sql
   create policy "name" on table_name
     using (condition)
     with check (condition);
   ```

5. **Test Before Committing**:
   ```bash
   # Create migration
   supabase migration new add_new_feature

   # Test locally
   supabase db reset

   # Verify
   npm run migration:verify
   ```

### Migration Template

```sql
-- Migration: Description
-- Date: YYYY-MM-DD
-- Author: Your Name

begin;

-- Create table
create table if not exists public.my_table (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now() not null
);

-- Create indexes
create index if not exists my_table_name_idx on public.my_table(name);

-- Enable RLS
alter table public.my_table enable row level security;

-- Create policies
create policy "my_table_select" on public.my_table
  for select
  using (true); -- Adjust based on your needs

create policy "my_table_insert" on public.my_table
  for insert
  with check (auth.uid() is not null);

commit;
```

## CI/CD Integration

### GitHub Actions

The workflow (`.github/workflows/migrations.yml`) automatically:
- Runs on PRs that modify migrations
- Runs unit tests
- Runs Supabase CLI validation
- Optionally runs E2E tests (if Docker available)
- Comments on PRs if tests fail

### Pre-commit Hooks (Optional)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm run migration:verify
```

## Troubleshooting

### Supabase CLI Not Found

**Error**: `Supabase CLI not found`

**Fix**:
```bash
# Install Supabase CLI
npm install -g supabase

# Or use npx
npx supabase --version
```

### Docker Not Running

**Error**: `Docker not running` (for E2E tests)

**Fix**:
- Start Docker Desktop
- Or skip E2E tests: `npm run migration:verify` (unit tests only)

### Port Conflicts

**Error**: `Port already in use`

**Fix**:
```bash
# Stop existing Supabase instance
supabase stop

# Or use different ports
supabase start --port 54322
```

### Migration Order Issues

**Error**: `Table referenced before creation`

**Fix**:
1. Check migration file order (alphabetical/timestamp)
2. Ensure dependencies are created first
3. Use `create table if not exists` for safety

## Advanced Usage

### Testing Specific Migrations

```bash
# Test only recent migrations
supabase db lint --use-mig-dir --file supabase/migrations/20250120_*.sql
```

### Comparing Migrations

```bash
# Compare local schema to migrations
supabase db diff --use-mig-dir

# Compare to remote
supabase db diff --linked
```

### Debugging Failed Migrations

1. **Enable verbose output**:
   ```bash
   supabase db lint --use-mig-dir --verbose
   ```

2. **Test in isolation**:
   ```bash
   # Create test database
   supabase start
   
   # Apply single migration
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/YOUR_FILE.sql
   ```

3. **Check logs**:
   ```bash
   supabase logs
   ```

## Future Enhancements

Potential improvements:
- [ ] Migration rollback testing
- [ ] Performance testing (migration duration)
- [ ] Data migration validation
- [ ] Automated migration generation from schema changes
- [ ] Migration dependency graph visualization

## Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL SQL Syntax](https://www.postgresql.org/docs/current/sql.html)
- [RLS Policy Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:
1. Check this guide
2. Review error messages carefully
3. Test migrations locally
4. Check Supabase CLI version: `supabase --version`
5. Review migration file syntax manually

