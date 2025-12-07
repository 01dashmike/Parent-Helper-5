-- ============================================================================
-- Create public.users Table
-- ============================================================================
-- This script creates the public.users table that extends Supabase Auth users
-- with application-specific fields like 'role' for admin/provider/user management.
--
-- Run this in your Supabase SQL Editor:
-- 1. Go to SQL Editor in Supabase Dashboard
-- 2. Paste this entire script
-- 3. Click "Run" or press Cmd/Ctrl + Enter
-- ============================================================================

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT NULL CHECK (role IN ('admin', 'provider', 'user', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role) WHERE role IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Service role has full access (for server-side operations)
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own record
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own email (but not role - that requires admin/service role)
DROP POLICY IF EXISTS "Users can update own email" ON public.users;
CREATE POLICY "Users can update own email"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (role IS NULL OR role = (SELECT role FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- Optional: Auto-sync trigger from auth.users to public.users
-- ============================================================================
-- This trigger automatically creates a public.users record when a user signs up
-- in auth.users. Uncomment the section below if you want this behavior.

/*
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
*/

-- ============================================================================
-- Optional: Sync existing auth.users to public.users
-- ============================================================================
-- If you have existing users in auth.users, run this to sync them:
-- (Uncomment and run separately if needed)

/*
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT 
  id,
  email,
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this to verify the table was created correctly:
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'users'
-- ORDER BY ordinal_position;
