-- RLS Policies for Family Wallet tables
-- Run this after creating the tables to set up Row Level Security

-- Family Wallets: Owner or active members can read/write
CREATE POLICY "family_wallets_owner_read" ON family_wallets
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "family_wallets_owner_write" ON family_wallets
  FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "family_wallets_member_read" ON family_wallets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.wallet_id = family_wallets.id
        AND family_members.user_id = auth.uid()
        AND family_members.status = 'active'
    )
  );

-- Family Members: Owner can read all, members can read active members, owner can write
CREATE POLICY "family_members_owner_read" ON family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = family_members.wallet_id
        AND family_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "family_members_member_read" ON family_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM family_wallets
        WHERE family_wallets.id = family_members.wallet_id
          AND EXISTS (
            SELECT 1 FROM family_members fm2
            WHERE fm2.wallet_id = family_wallets.id
              AND fm2.user_id = auth.uid()
              AND fm2.status = 'active'
          )
      )
      AND status IN ('active', 'left')
    )
  );

CREATE POLICY "family_members_owner_write" ON family_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = family_members.wallet_id
        AND family_wallets.owner_id = auth.uid()
    )
  );

-- Invited email only readable by owner
CREATE POLICY "family_members_invited_email_owner" ON family_members
  FOR SELECT
  USING (
    invited_email IS NULL
    OR EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = family_members.wallet_id
        AND family_wallets.owner_id = auth.uid()
    )
  );

-- Wallet Transactions: Owner or active members can read/write
CREATE POLICY "wallet_transactions_owner_read" ON wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = wallet_transactions.wallet_id
        AND family_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "wallet_transactions_member_read" ON wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = wallet_transactions.wallet_id
        AND EXISTS (
          SELECT 1 FROM family_members
          WHERE family_members.wallet_id = family_wallets.id
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'active'
        )
    )
  );

CREATE POLICY "wallet_transactions_owner_write" ON wallet_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = wallet_transactions.wallet_id
        AND family_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "wallet_transactions_member_write" ON wallet_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_wallets
      WHERE family_wallets.id = wallet_transactions.wallet_id
        AND EXISTS (
          SELECT 1 FROM family_members
          WHERE family_members.wallet_id = family_wallets.id
            AND family_members.user_id = auth.uid()
            AND family_members.status = 'active'
        )
    )
  );

