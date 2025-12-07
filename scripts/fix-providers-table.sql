-- Fix/Create providers and providers_users tables
-- Run this in Supabase SQL Editor to create/update the tables with correct structure

-- Step 1: Drop existing tables if they exist (WARNING: This deletes all data!)
-- Uncomment the next two lines if you want to start fresh:
-- DROP TABLE IF EXISTS providers_users CASCADE;
-- DROP TABLE IF EXISTS providers CASCADE;

-- Step 2: Create providers table with all required columns
CREATE TABLE IF NOT EXISTS providers (
    id serial primary key,
    slug text not null,
    name text not null,
    legal_name text,
    description_raw text,
    description_override text,
    use_description_override boolean not null default false,
    contact_email text,
    contact_phone text,
    website text,
    facebook_url text,
    instagram_url text,
    tiktok_url text,
    youtube_url text,
    booking_email text,
    booking_phone text,
    address_line1 text,
    address_line2 text,
    town text,
    county text,
    postcode text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean not null default true,
    is_claimed boolean not null default false,
    claim_status text not null default 'unclaimed',
    claimed_by_user_id uuid,
    auto_approved boolean not null default false,
    last_scraped_at timestamptz,
    last_verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb
);

-- Step 3: Add missing columns if table already existed
DO $$ 
BEGIN
    -- Add columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'name') THEN
        ALTER TABLE providers ADD COLUMN name text not null default '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'slug') THEN
        ALTER TABLE providers ADD COLUMN slug text not null;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'town') THEN
        ALTER TABLE providers ADD COLUMN town text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'claim_status') THEN
        ALTER TABLE providers ADD COLUMN claim_status text not null default 'unclaimed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'created_at') THEN
        ALTER TABLE providers ADD COLUMN created_at timestamptz not null default now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'updated_at') THEN
        ALTER TABLE providers ADD COLUMN updated_at timestamptz not null default now();
    END IF;
END $$;

-- Step 4: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS providers_slug_idx ON providers (slug);
CREATE INDEX IF NOT EXISTS providers_town_idx ON providers (town) WHERE town IS NOT NULL;

-- Step 5: Create providers_users table
CREATE TABLE IF NOT EXISTS providers_users (
    id uuid primary key default gen_random_uuid(),
    provider_id integer not null references providers(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'owner',
    status text not null default 'active',
    invited_by uuid references auth.users(id) on delete set null,
    invited_at timestamptz not null default now(),
    accepted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Step 6: Create indexes for providers_users
CREATE UNIQUE INDEX IF NOT EXISTS providers_users_provider_user_idx
    ON providers_users (provider_id, user_id);

CREATE INDEX IF NOT EXISTS providers_users_user_idx
    ON providers_users (user_id);

-- Step 7: Verify the tables were created correctly
SELECT 
    'providers' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'providers'

UNION ALL

SELECT 
    'providers_users' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'providers_users';
