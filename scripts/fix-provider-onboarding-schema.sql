-- ============================================================================
-- Fix Provider Onboarding Schema Type Mismatch
-- ============================================================================
-- This script helps diagnose and fix the type mismatch between 
-- provider_onboarding.provider_id (UUID) and providers.id (integer)
--
-- Run this in your Supabase SQL Editor to check the current schema
-- ============================================================================

-- 1. Check the actual data types
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('providers', 'provider_onboarding', 'providers_users')
  AND column_name LIKE '%provider_id%' OR column_name = 'id'
ORDER BY table_name, ordinal_position;

-- 2. Check if providers table has a UUID column we should be using
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'providers'
ORDER BY ordinal_position;

-- 3. Check existing provider_onboarding records
SELECT 
  id,
  provider_id,
  pg_typeof(provider_id) as provider_id_type,
  is_complete,
  current_step
FROM provider_onboarding
LIMIT 5;

-- ============================================================================
-- OPTION A: If provider_onboarding.provider_id should be INTEGER
-- ============================================================================
-- Uncomment and run this if provider_onboarding.provider_id should match providers.id (integer)
-- WARNING: This will fail if there are existing UUID values that can't be converted

/*
-- First, check if there are any existing records with UUID values
SELECT COUNT(*) as uuid_records
FROM provider_onboarding
WHERE provider_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- If the above returns 0, you can safely change the column type:
ALTER TABLE provider_onboarding 
  ALTER COLUMN provider_id TYPE integer 
  USING provider_id::text::integer;

-- Update the foreign key constraint if needed
ALTER TABLE provider_onboarding
  DROP CONSTRAINT IF EXISTS provider_onboarding_provider_id_fkey;

ALTER TABLE provider_onboarding
  ADD CONSTRAINT provider_onboarding_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;
*/

-- ============================================================================
-- OPTION B: If provider_onboarding.provider_id should remain UUID
-- ============================================================================
-- If provider_onboarding.provider_id must be UUID, you need to:
-- 1. Add a UUID column to providers table (if it doesn't exist)
-- 2. Populate it with UUIDs for existing providers
-- 3. Update provider_onboarding to use the UUID column

-- Check if providers has a UUID column:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'providers'
  AND data_type = 'uuid';

-- If no UUID column exists, you could add one:
/*
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();

-- Populate UUIDs for existing providers
UPDATE providers 
SET uuid_id = gen_random_uuid()
WHERE uuid_id IS NULL;

-- Then update provider_onboarding to use the UUID
-- (This requires manual mapping of integer IDs to UUIDs)
*/

-- ============================================================================
-- OPTION C: Create a new provider_onboarding record with correct type
-- ============================================================================
-- For your test provider (provider_id = 5), create onboarding record
-- Replace 'YOUR-PROVIDER-UUID-HERE' with the actual UUID if provider_onboarding uses UUID

-- First, find your test provider's details:
SELECT 
  p.id as provider_integer_id,
  pu.user_id,
  u.email
FROM providers p
JOIN providers_users pu ON pu.provider_id = p.id
JOIN auth.users u ON u.id = pu.user_id
WHERE u.email = 'provider-test@parenthelper.co.uk';

-- Then create the onboarding record (adjust provider_id type as needed):
/*
INSERT INTO provider_onboarding (
  provider_id,  -- Use integer if column is integer, UUID if column is UUID
  is_complete,
  current_step,
  completed_steps,
  progress,
  saved_data,
  created_at,
  updated_at
)
VALUES (
  5,  -- Replace with UUID if provider_onboarding.provider_id is UUID
  false,
  'step-1-account',
  '{}'::text[],
  0,
  '{}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (provider_id) DO NOTHING;
*/
