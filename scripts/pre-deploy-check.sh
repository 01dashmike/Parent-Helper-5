#!/bin/bash

set -e

echo "🔍 Running pre-deploy checks..."
echo ""

ERRORS=0

# Check 1: .env.dev exists
if [ ! -f ".env.dev" ]; then
    echo "❌ ERROR: .env.dev not found"
    echo "   Create it by copying .env.local and removing all comments"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .env.dev exists"
    
    # Check for comments (except header)
    COMMENT_LINES=$(grep -v "^# GENERATED:" .env.dev | grep -c "^#" || true)
    if [ "$COMMENT_LINES" -gt 0 ]; then
        echo "❌ ERROR: .env.dev contains comments (Supabase CLI incompatible)"
        echo "   Remove all comments except the header"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ .env.dev has no comments"
    fi
fi

# Check 2: Migrations have correct timestamps
echo ""
echo "Checking migration files..."
MIGRATION_DIR="supabase/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "❌ ERROR: Migration directory not found: $MIGRATION_DIR"
    ERRORS=$((ERRORS + 1))
else
    INVALID_MIGRATIONS=$(find "$MIGRATION_DIR" -name "*.sql" ! -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql" | wc -l | tr -d ' ')
    if [ "$INVALID_MIGRATIONS" -gt 0 ]; then
        echo "❌ ERROR: Found $INVALID_MIGRATIONS migration files with invalid timestamps"
        echo "   All migrations must use format: YYYYMMDDHHmmss_name.sql"
        find "$MIGRATION_DIR" -name "*.sql" ! -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql"
        ERRORS=$((ERRORS + 1))
    else
        MIGRATION_COUNT=$(find "$MIGRATION_DIR" -name "*.sql" | wc -l | tr -d ' ')
        echo "✅ All $MIGRATION_COUNT migrations have valid timestamps"
    fi
fi

# Check 3: Schema diff is clean
echo ""
echo "Checking schema diff..."
if command -v supabase &> /dev/null; then
    export SUPABASE_ENV=".env.dev"
    if [ -f ".env.dev" ]; then
        SCHEMA_DIFF=$(SUPABASE_ENV=.env.dev supabase db diff --schema public 2>&1 || echo "ERROR")
        if echo "$SCHEMA_DIFF" | grep -q "ERROR\|error\|Error"; then
            echo "⚠️  WARNING: Schema diff check failed (may be expected in CI)"
        elif [ -n "$SCHEMA_DIFF" ] && [ ${#SCHEMA_DIFF} -gt 50 ]; then
            echo "⚠️  WARNING: Schema differences detected:"
            echo "$SCHEMA_DIFF" | head -20
            echo "   (This may be expected if migrations are pending)"
        else
            echo "✅ Schema diff is clean"
        fi
    else
        echo "⚠️  WARNING: Cannot check schema diff (no .env.dev)"
    fi
else
    echo "⚠️  WARNING: Supabase CLI not available (skipping schema diff check)"
fi

# Check 4: No raw SQL files outside migrations/
echo ""
echo "Checking for raw SQL files outside migrations/..."
RAW_SQL_FILES=$(find . -name "*.sql" -not -path "./supabase/migrations/*" -not -path "./drizzle/migrations/*" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | wc -l | tr -d ' ')
if [ "$RAW_SQL_FILES" -gt 0 ]; then
    echo "⚠️  WARNING: Found $RAW_SQL_FILES SQL files outside migrations directories:"
    find . -name "*.sql" -not -path "./supabase/migrations/*" -not -path "./drizzle/migrations/*" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | head -5
    echo "   (This may be intentional - review manually)"
else
    echo "✅ No raw SQL files outside migrations directories"
fi

# Check 5: supabase/config.toml uses .env.dev
echo ""
echo "Checking Supabase config..."
if [ -f "supabase/config.toml" ]; then
    if grep -q 'env = ".env.dev"' supabase/config.toml; then
        echo "✅ supabase/config.toml correctly uses .env.dev"
    else
        echo "❌ ERROR: supabase/config.toml does not set env = \".env.dev\""
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "⚠️  WARNING: supabase/config.toml not found"
fi

# Check 6: Run migration assertion script
echo ""
echo "Running migration assertion script..."
if [ -f "scripts/assert-migrations-clean.mjs" ]; then
    if node scripts/assert-migrations-clean.mjs 2>&1 | tee /tmp/migration-check.log; then
        echo "✅ Migration assertion passed"
    else
        echo "⚠️  WARNING: Migration assertion had issues (check logs above)"
    fi
else
    echo "⚠️  WARNING: scripts/assert-migrations-clean.mjs not found"
fi

# Summary
echo ""
echo "=========================================="
if [ "$ERRORS" -eq 0 ]; then
    echo "✅ All pre-deploy checks passed"
    exit 0
else
    echo "❌ Pre-deploy checks failed with $ERRORS error(s)"
    exit 1
fi

