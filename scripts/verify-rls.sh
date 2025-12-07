#!/bin/bash

# Validates that every CREATE TABLE statement inside the supplied SQL files
# has a matching `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement.
# Usage:
#   ./scripts/verify-rls.sh path/to/migration.sql [...]
# If no files are provided, the script inspects staged *.sql files.

set -euo pipefail

MIGRATIONS_DIR="drizzle/migrations"

gather_files() {
  if [ "$#" -gt 0 ]; then
    printf "%s\n" "$@"
    return
  fi

  if git rev-parse --git-dir >/dev/null 2>&1; then
    git diff --name-only --cached -- '*.sql' || true
  else
    printf ""
  fi
}

SQL_FILES=$(gather_files "$@")

if [ -z "$SQL_FILES" ]; then
  echo "verify-rls: no SQL files supplied (and no staged *.sql files found). Nothing to check."
  exit 0
fi

MISSING=()

escape_regex() {
  printf '%s' "$1" | sed -e 's/[^^A-Za-z0-9_]/\\&/g'
}

while IFS= read -r FILE; do
  [ -f "$FILE" ] || continue

  TABLES=$(perl -ne 'if (/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_\."]+)/i) { print "$1\n"; }' "$FILE")

  while IFS= read -r RAW_TABLE; do
    [ -n "$RAW_TABLE" ] || continue
    TABLE=${RAW_TABLE//\"/}
    TABLE_REGEX=$(escape_regex "$TABLE")

    if ! grep -qiE "ALTER[[:space:]]+TABLE[[:space:]]+([^;]*\b${TABLE_REGEX}\b)[^;]*ENABLE[[:space:]]+ROW[[:space:]]+LEVEL[[:space:]]+SECURITY" "$FILE"; then
      MISSING+=("$FILE:$TABLE")
    fi
  done <<< "$TABLES"
done <<< "$SQL_FILES"

if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "verify-rls: the following tables are missing RLS enable statements:"
  for ENTRY in "${MISSING[@]}"; do
    echo "  - $ENTRY"
  done
  echo ""
  echo "Add \`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;\` to the same migration."
  exit 1
fi

echo "verify-rls: all checked tables enable row level security."

