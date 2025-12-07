#!/bin/bash

set -euo pipefail

ENV_FILE=".env.dev"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Create it (without comments) before running this script."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: Supabase CLI is not installed. Install it from https://supabase.com/docs/guides/cli."
  exit 1
fi

export SUPABASE_ENV="$ENV_FILE"

echo "Verifying schema differences using $SUPABASE_ENV…"

supabase db diff --env-file "$ENV_FILE"
