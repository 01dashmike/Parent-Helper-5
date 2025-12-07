-- Parent Wallet + Credits + Multi-Class Pass System Migration
-- This migration creates the wallet infrastructure for credit-based bookings

-- 1. Parent Wallets Table
CREATE TABLE IF NOT EXISTS parent_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS parent_wallets_user_id_idx ON parent_wallets (user_id);

-- 2. Wallet Ledger Table
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'expiry', 'admin_adjustment', 'pass_purchase', 'pass_usage')),
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits spent
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS wallet_ledger_user_id_created_at_idx ON wallet_ledger (user_id, created_at);
CREATE INDEX IF NOT EXISTS wallet_ledger_type_created_at_idx ON wallet_ledger (type, created_at);

-- 3. Parent Passes Table
CREATE TABLE IF NOT EXISTS parent_passes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('unlimited_weekly', 'unlimited_monthly', 'custom')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS parent_passes_user_provider_active_ends_idx ON parent_passes (user_id, provider_id, is_active, ends_at);

-- 4. Provider Credit Settings Table
CREATE TABLE IF NOT EXISTS provider_credit_settings (
  provider_id INTEGER PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  accepts_credits BOOLEAN DEFAULT FALSE NOT NULL,
  credit_cost_per_class INTEGER DEFAULT 1 CHECK (credit_cost_per_class > 0),
  unlimited_pass_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  unlimited_pass_price INTEGER, -- Price in pence/cents
  unlimited_pass_type TEXT CHECK (unlimited_pass_type IN ('weekly', 'monthly')),
  class_overrides JSONB DEFAULT '{}'::JSONB, -- { classId: { credit_cost?: number, disabled?: boolean } }
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS provider_credit_settings_provider_id_idx ON provider_credit_settings (provider_id);
CREATE INDEX IF NOT EXISTS provider_credit_settings_accepts_credits_idx ON provider_credit_settings (accepts_credits);

-- 5. Booking Credit Redemptions Table
CREATE TABLE IF NOT EXISTS booking_credit_redemptions (
  booking_id INTEGER PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  credits_spent INTEGER DEFAULT 0 NOT NULL CHECK (credits_spent >= 0),
  pass_id BIGINT REFERENCES parent_passes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS booking_credit_redemptions_user_id_created_at_idx ON booking_credit_redemptions (user_id, created_at);
CREATE INDEX IF NOT EXISTS booking_credit_redemptions_provider_id_created_at_idx ON booking_credit_redemptions (provider_id, created_at);

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN ('purchase', 'refund', 'bonus', 'admin_adjustment', 'pass_purchase') THEN
    -- Credit added
    UPDATE parent_wallets
    SET credit_balance = credit_balance + NEW.amount,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Create wallet if it doesn't exist
    IF NOT FOUND THEN
      INSERT INTO parent_wallets (user_id, credit_balance, updated_at)
      VALUES (NEW.user_id, NEW.amount, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET credit_balance = parent_wallets.credit_balance + NEW.amount,
          updated_at = NOW();
    END IF;
  ELSIF NEW.type IN ('spend', 'expiry', 'pass_usage') THEN
    -- Credit deducted
    UPDATE parent_wallets
    SET credit_balance = credit_balance + NEW.amount, -- NEW.amount is negative
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update wallet balance
CREATE TRIGGER wallet_ledger_balance_update
AFTER INSERT ON wallet_ledger
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

-- Function to auto-create wallet on user creation (optional, can be done in app logic)
-- This is a placeholder - actual wallet creation should happen in application code

-- Add RLS policies (if using RLS)
-- ALTER TABLE parent_wallets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parent_passes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE provider_credit_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE booking_credit_redemptions ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth setup):
-- CREATE POLICY "Users can view their own wallet" ON parent_wallets FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can view their own ledger" ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can view their own passes" ON parent_passes FOR SELECT USING (auth.uid() = user_id);

