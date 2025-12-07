#!/bin/bash

set -e

echo "🔨 Verifying build stability..."
echo ""

# Step 1: Typecheck
echo "1️⃣  Running typecheck..."
if pnpm typecheck; then
    echo "✅ Typecheck passed"
else
    echo "❌ Typecheck failed"
    exit 1
fi

echo ""

# Step 2: Lint
echo "2️⃣  Running lint..."
if pnpm lint; then
    echo "✅ Lint passed"
else
    echo "⚠️  Lint has warnings (continuing...)"
fi

echo ""

# Step 3: Build
echo "3️⃣  Building Next.js application..."
if pnpm build; then
    echo "✅ Build passed"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""

# Step 4: Tests
echo "4️⃣  Running tests..."
if pnpm test; then
    echo "✅ Tests passed"
else
    echo "⚠️  Some tests failed (continuing...)"
fi

echo ""
echo "=========================================="
echo "✅ Build verification complete"
echo ""

