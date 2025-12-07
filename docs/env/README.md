# Environment Variables Management

This document explains the environment variable system for Parent Helper, which separates Next.js environment variables from Supabase CLI environment variables.

## Overview

The project uses three types of environment files:

- **`.env.local`** - Next.js only (supports comments)
- **`.env.dev`** - Supabase CLI and database scripts (no comments allowed)
- **`.env.production`** - Production template (no comments, placeholder values)

## Why Two Files?

**Supabase CLI cannot read `.env.local`** because it contains comments (`#`), which are allowed by Next.js but not by Supabase CLI. This causes parsing errors when running Supabase commands.

**Solution:** Use separate files:
- `.env.local` for Next.js (with comments for documentation)
- `.env.dev` for Supabase CLI (clean, no comments)

## File Descriptions

### `.env.local` (Next.js Only)

- **Purpose:** Used by Next.js during development
- **Supports:** Comments, blank lines, inline comments
- **Location:** Project root
- **Git:** Ignored (contains secrets)
- **Usage:** Automatically loaded by Next.js via `next.config.js`

### `.env.dev` (Supabase CLI Only)

- **Purpose:** Used by Supabase CLI and all database scripts
- **Supports:** No comments, no blank lines (except header)
- **Location:** Project root
- **Git:** Ignored (contains secrets)
- **Usage:** Explicitly loaded via `SUPABASE_ENV=.env.dev`

**Important:** This file must be kept in sync with `.env.local` but without comments.

### `.env.production` (Production Template)

- **Purpose:** Template for production deployments
- **Supports:** No comments, placeholder values for secrets
- **Location:** Project root
- **Git:** **Included** (safe template, no real secrets)
- **Usage:** Copy and replace placeholders with actual production values

## Scripts

All Supabase-related scripts use `.env.dev`:

- `scripts/reset-local-db.sh` - Resets local Supabase database
- `scripts/verify-schema.sh` - Verifies schema differences

Both scripts:
1. Validate that `.env.dev` exists
2. Explicitly set `SUPABASE_ENV=.env.dev`
3. Prevent accidental use of `.env.local`

## Configuration

The Supabase CLI is configured via `supabase/config.toml`:

```toml
[project]
env = ".env.dev"
```

This ensures Supabase CLI uses `.env.dev` by default.

## Safety Checks

All scripts include safety checks to prevent Supabase CLI from reading `.env.local`:

```bash
if [ "$SUPABASE_ENV" = ".env.local" ]; then
    echo "ERROR: Supabase attempted to read .env.local. This is not allowed."
    exit 1
fi
```

## Usage

### Development (Next.js)

```bash
# Next.js automatically loads .env.local
pnpm dev
```

### Database Operations (Supabase CLI)

```bash
# Use the convenience scripts (recommended)
./scripts/reset-local-db.sh
./scripts/verify-schema.sh

# Or manually specify .env.dev
SUPABASE_ENV=.env.dev npx supabase db reset
SUPABASE_ENV=.env.dev npx supabase db diff
```

### Creating `.env.dev`

If `.env.dev` doesn't exist or needs to be updated:

1. Copy `.env.local` to `.env.dev`
2. Remove all comments (lines starting with `#`)
3. Remove blank lines
4. Remove inline comments (everything after `#` on a line)
5. Keep all variable values identical

**Note:** The header comment `# GENERATED: Used only by Supabase CLI. No comments allowed.` is allowed in `.env.dev` as it's the only exception.

## Troubleshooting

### Error: "Supabase attempted to read .env.local"

**Cause:** A script or command is trying to use `.env.local` with Supabase CLI.

**Solution:** Ensure all Supabase commands use `SUPABASE_ENV=.env.dev` or use the provided scripts.

### Error: ".env.dev not found"

**Cause:** `.env.dev` file doesn't exist.

**Solution:** Create `.env.dev` by copying `.env.local` and removing all comments.

### Supabase CLI parsing errors

**Cause:** `.env.dev` contains comments or invalid syntax.

**Solution:** Ensure `.env.dev` has no comments (except the header) and no blank lines.

## Best Practices

1. **Keep files in sync:** When adding variables to `.env.local`, also add them to `.env.dev` (without comments)
2. **Never commit secrets:** Both `.env.local` and `.env.dev` are git-ignored
3. **Use scripts:** Always use the provided scripts for database operations
4. **Verify before committing:** Run `./scripts/verify-schema.sh` before committing migrations

## Migration from Old System

If you're migrating from a system that used `.env.local` for Supabase:

1. Create `.env.dev` (see "Creating `.env.dev`" above)
2. Update `supabase/config.toml` to set `env = ".env.dev"`
3. Use the updated scripts or explicitly set `SUPABASE_ENV=.env.dev`
4. Verify: Run `./scripts/reset-local-db.sh` to test

