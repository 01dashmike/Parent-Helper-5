-- Add provider_rewards table for tracking provider rewards
-- This table stores rewards like onboarding bonuses, free boosts, credits, etc.

CREATE TABLE IF NOT EXISTS provider_rewards (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'provider_onboarding' | 'free_boost' | 'credit'
  reward_value INTEGER NOT NULL, -- Value in cents
  reason TEXT,
  metadata JSONB, -- { source, class_id, etc. }
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_provider_rewards_provider ON provider_rewards(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_rewards_reward_type ON provider_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_provider_rewards_expires_at ON provider_rewards(expires_at);

