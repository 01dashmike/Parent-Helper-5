# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for continuous integration. The CI pipeline validates code quality, runs tests, checks migrations, and ensures the build succeeds.

## Workflows

### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

Runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Steps:**

#### Step A: Install Dependencies
- Sets up Node.js 20
- Installs Supabase CLI
- Runs `npm ci` for clean install

#### Step B: Validate Environment
- Checks `.env.example` exists
- Validates Next.js version pinning (15.5.6)
- Runs `npm run check-env`

#### Step C: Migration Checks
- Verifies migration files exist
- Runs migration unit tests (if available)
- Starts ephemeral Supabase container
- Applies migrations
- Generates schema diff
- Checks schema consistency

#### Step D: Build Checks
- Runs `npm run build`
- Runs `npm run test:unit`
- Runs `npm run test:e2e`

#### Step E: Artifacts
Uploads:
- Build logs
- Migration logs
- Test reports (Jest, Playwright)
- Schema diff artifacts

### 2. Schema Watch (`.github/workflows/schema-watch.yml`)

Runs on:
- PRs that modify `supabase/migrations/**/*.sql` or `shared/schema.ts`
- Pushes to `main`/`develop` that modify migration files

**Purpose:**
- Prevents merges if schema is inconsistent
- Validates migration file naming
- Checks for SQL syntax errors
- Detects breaking changes (DROP statements)

## Required GitHub Secrets

Set these in your GitHub repository settings:

```
NEXT_PUBLIC_SUPABASE_URL (optional, for E2E tests)
NEXT_PUBLIC_SUPABASE_ANON_KEY (optional, for E2E tests)
SUPABASE_URL (optional, for migrations)
SUPABASE_SERVICE_ROLE_KEY (optional, for migrations)
SUPABASE_ACCESS_TOKEN (optional, for Supabase CLI)
```

**Note:** CI will work without these secrets, but some steps may be skipped.

## Required Scripts

The CI expects these npm scripts:

- `check-env` - Environment validation ✅ (exists)
- `migration:verify` - Migration verification ✅ (added)
- `build` - Build Next.js app ✅ (exists)
- `test:unit` - Unit tests ✅ (exists)
- `test:e2e` - E2E tests ✅ (exists)

## CI Badge

The CI status badge is automatically added to README.md:

```markdown
[![CI](https://github.com/01dashmike/parent-helper-app/actions/workflows/ci.yml/badge.svg)](https://github.com/01dashmike/parent-helper-app/actions/workflows/ci.yml)
```

## Testing CI Locally

### Using Act (GitHub Actions locally)

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act

# Run CI workflow
act push

# Run specific job
act -j ci
```

### Manual Testing

```bash
# Step A: Install dependencies
npm ci

# Step B: Validate environment
npm run check-env

# Step C: Verify migrations
npm run migration:verify

# Step D: Build and test
npm run build
npm run test:unit
npm run test:e2e
```

## Troubleshooting

### Build Fails

1. Check build logs artifact
2. Verify environment variables are set
3. Check for TypeScript errors: `npm run test:type`

### Migration Checks Fail

1. Check migration logs artifact
2. Verify migration file naming: `YYYYMMDD_description.sql`
3. Run locally: `npm run migration:verify`

### Tests Fail

1. Check test reports artifact
2. Run tests locally: `npm run test:unit` or `npm run test:e2e`
3. Check for flaky tests

### Schema Watch Fails

1. Review schema-snapshot.sql artifact
2. Check for DROP statements in migrations
3. Verify migration file syntax

## CI Status

View CI status at:
https://github.com/01dashmike/parent-helper-app/actions

## Next Steps

1. Set up GitHub secrets (optional)
2. Push to trigger first CI run
3. Review artifacts if builds fail
4. Add more tests as needed

