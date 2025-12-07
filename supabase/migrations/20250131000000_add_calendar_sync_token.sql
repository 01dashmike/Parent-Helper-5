-- Migration: Add calendar_sync_token to users table
-- This migration adds a calendar sync token column to auth.users for secure ICS subscription URLs

-- Add calendar_sync_token column to auth.users (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'calendar_sync_token'
    ) THEN
        ALTER TABLE auth.users 
        ADD COLUMN calendar_sync_token uuid;
        
        CREATE UNIQUE INDEX IF NOT EXISTS users_calendar_sync_token_idx 
        ON auth.users(calendar_sync_token) 
        WHERE calendar_sync_token IS NOT NULL;
    END IF;
END $$;

-- Note: If direct modification of auth.users is not allowed by Supabase,
-- you may need to use a user_profiles table instead.
-- In that case, create a user_profiles table with calendar_sync_token:
-- CREATE TABLE IF NOT EXISTS user_profiles (
--     user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     calendar_sync_token uuid,
--     created_at timestamp DEFAULT now() NOT NULL,
--     updated_at timestamp DEFAULT now() NOT NULL
-- );
-- CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_calendar_sync_token_idx 
-- ON user_profiles(calendar_sync_token) 
-- WHERE calendar_sync_token IS NOT NULL;

