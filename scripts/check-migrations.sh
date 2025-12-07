#!/bin/bash

set -e

echo "Checking migration system..."

# Check Drizzle migrations
if [ -d "drizzle/migrations" ]; then
    echo "✅ Drizzle migrations directory exists"
    drizzle_count=$(find drizzle/migrations -name "*.sql" | wc -l | tr -d ' ')
    echo "   Found $drizzle_count Drizzle migration files"
else
    echo "⚠️  Drizzle migrations directory not found"
fi

# Check Supabase migrations
if [ -d "supabase/migrations" ]; then
    echo "✅ Supabase migrations directory exists"
    supabase_count=$(find supabase/migrations -name "*.sql" | wc -l | tr -d ' ')
    echo "   Found $supabase_count Supabase migration files"
    
    # Check for invalid timestamps
    invalid=$(find supabase/migrations -name "*.sql" ! -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql" | wc -l | tr -d ' ')
    if [ "$invalid" -gt 0 ]; then
        echo "⚠️  Found $invalid migration files with invalid timestamps"
    else
        echo "✅ All Supabase migrations have valid 14-digit timestamps"
    fi
else
    echo "⚠️  Supabase migrations directory not found"
fi

echo "Done."

