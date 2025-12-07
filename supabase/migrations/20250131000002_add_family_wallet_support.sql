-- Migration: Add Family Wallet Support
-- This migration adds family wallet functionality to the existing wallet system

-- 1. Add family_wallet_id to wallet_accounts (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_accounts' 
        AND column_name = 'family_wallet_id'
    ) THEN
        ALTER TABLE wallet_accounts 
        ADD COLUMN family_wallet_id uuid REFERENCES family_wallets(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS wallet_accounts_family_wallet_idx 
        ON wallet_accounts(family_wallet_id);
    END IF;
END $$;

-- 2. Create family_wallet_members table (if not exists)
CREATE TABLE IF NOT EXISTS family_wallet_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_wallet_id uuid NOT NULL REFERENCES family_wallets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'adult', 'child')),
    invited_email text,
    invite_token text,
    status text DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'left')),
    joined_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    UNIQUE(family_wallet_id, user_id),
    UNIQUE(invite_token)
);

-- 3. Create indexes for family_wallet_members
CREATE INDEX IF NOT EXISTS family_wallet_members_wallet_idx 
ON family_wallet_members(family_wallet_id);

CREATE INDEX IF NOT EXISTS family_wallet_members_user_idx 
ON family_wallet_members(user_id);

CREATE INDEX IF NOT EXISTS family_wallet_members_email_idx 
ON family_wallet_members(invited_email);

CREATE INDEX IF NOT EXISTS family_wallet_members_token_idx 
ON family_wallet_members(invite_token);

-- 4. Ensure family_wallets table has correct structure
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_wallets' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE family_wallets 
        ADD COLUMN name text DEFAULT 'My Family' NOT NULL;
    END IF;
    
    -- Rename owner_id to owner_user_id if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_wallets' 
        AND column_name = 'owner_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_wallets' 
        AND column_name = 'owner_user_id'
    ) THEN
        ALTER TABLE family_wallets 
        RENAME COLUMN owner_id TO owner_user_id;
    END IF;
END $$;

-- 5. Add updated_at to family_wallets if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'family_wallets' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE family_wallets 
        ADD COLUMN updated_at timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_family_wallets_updated_at_trigger ON family_wallets;
CREATE TRIGGER update_family_wallets_updated_at_trigger
    BEFORE UPDATE ON family_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_family_wallets_updated_at();

