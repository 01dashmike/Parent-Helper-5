-- Diagnostic SQL: Check providers table structure
-- Run this in Supabase SQL Editor to see what columns actually exist

-- Check if providers table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'providers';

-- If table exists, show all columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'providers'
ORDER BY ordinal_position;

-- Check if providers_users table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'providers_users';

-- If providers_users exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'providers_users'
ORDER BY ordinal_position;
