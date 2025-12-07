-- RLS Policies for Family Wallet Support
-- These policies ensure proper access control for family wallets

-- Enable RLS on family_wallets
ALTER TABLE family_wallets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on family_wallet_members
ALTER TABLE family_wallet_members ENABLE ROW LEVEL SECURITY;

-- 1. Family Wallets Policies
-- Members can read wallets they belong to
CREATE POLICY "family_wallets_select_members"
ON family_wallets FOR SELECT
USING (
    id IN (
        SELECT family_wallet_id 
        FROM family_wallet_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
    OR owner_user_id = auth.uid()
);

-- Owners can update their wallets
CREATE POLICY "family_wallets_update_owner"
ON family_wallets FOR UPDATE
USING (owner_user_id = auth.uid());

-- Owners can insert wallets
CREATE POLICY "family_wallets_insert_owner"
ON family_wallets FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

-- 2. Family Wallet Members Policies
-- Members can read members of wallets they belong to
CREATE POLICY "family_wallet_members_select"
ON family_wallet_members FOR SELECT
USING (
    family_wallet_id IN (
        SELECT id 
        FROM family_wallets 
        WHERE owner_user_id = auth.uid()
        OR id IN (
            SELECT family_wallet_id 
            FROM family_wallet_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
);

-- Owners can insert members (invite)
CREATE POLICY "family_wallet_members_insert_owner"
ON family_wallet_members FOR INSERT
WITH CHECK (
    family_wallet_id IN (
        SELECT id 
        FROM family_wallets 
        WHERE owner_user_id = auth.uid()
    )
);

-- Owners can update members (change role, status)
CREATE POLICY "family_wallet_members_update_owner"
ON family_wallet_members FOR UPDATE
USING (
    family_wallet_id IN (
        SELECT id 
        FROM family_wallets 
        WHERE owner_user_id = auth.uid()
    )
);

-- Users can update their own member record (accept invite)
CREATE POLICY "family_wallet_members_update_self"
ON family_wallet_members FOR UPDATE
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Owners can delete members
CREATE POLICY "family_wallet_members_delete_owner"
ON family_wallet_members FOR DELETE
USING (
    family_wallet_id IN (
        SELECT id 
        FROM family_wallets 
        WHERE owner_user_id = auth.uid()
    )
);

-- 3. Wallet Accounts Policies (extend existing)
-- Allow reading wallet accounts linked to family wallets
-- This assumes RLS is already enabled on wallet_accounts
-- If not, uncomment the following:
-- ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;

-- Members can read wallet accounts linked to their family wallet
CREATE POLICY "wallet_accounts_select_family_members"
ON wallet_accounts FOR SELECT
USING (
    family_wallet_id IN (
        SELECT id 
        FROM family_wallets 
        WHERE owner_user_id = auth.uid()
        OR id IN (
            SELECT family_wallet_id 
            FROM family_wallet_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    )
    OR user_id = auth.uid()
);

-- 4. Wallet Transactions Policies (extend existing)
-- Members can read transactions for their family wallet
-- This assumes wallet_transactions references wallet_accounts.id
-- Adjust if your schema is different

