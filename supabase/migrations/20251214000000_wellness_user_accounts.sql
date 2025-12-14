-- ============================================================================
-- Wellness User Accounts Migration
-- Creates tables for user accounts, accountability emails, and email tracking
-- ============================================================================

-- Table 1: wellness_users - Links Supabase auth users to wellness preferences
CREATE TABLE IF NOT EXISTS wellness_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  newsletter_subscribed BOOLEAN DEFAULT false,
  accountability_emails_enabled BOOLEAN DEFAULT false,
  accountability_frequency TEXT CHECK (accountability_frequency IN ('weekly', 'biweekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes for wellness_users
CREATE INDEX IF NOT EXISTS idx_wellness_users_user_id ON wellness_users(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_users_email ON wellness_users(email);
CREATE INDEX IF NOT EXISTS idx_wellness_users_accountability ON wellness_users(accountability_emails_enabled) WHERE accountability_emails_enabled = true;

-- Table 2: wellness_accountability_emails - Admin-created email templates
CREATE TABLE IF NOT EXISTS wellness_accountability_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('diet', 'exercise', 'supplements', 'general')),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  scheduled_send_day INTEGER CHECK (scheduled_send_day >= 1 AND scheduled_send_day <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for wellness_accountability_emails
CREATE INDEX IF NOT EXISTS idx_wellness_accountability_emails_active ON wellness_accountability_emails(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wellness_accountability_emails_type ON wellness_accountability_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_wellness_accountability_emails_frequency ON wellness_accountability_emails(frequency);

-- Table 3: wellness_email_sends - Track sent accountability emails
CREATE TABLE IF NOT EXISTS wellness_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wellness_users(user_id) ON DELETE CASCADE,
  email_template_id UUID NOT NULL REFERENCES wellness_accountability_emails(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT
);

-- Create indexes for wellness_email_sends
CREATE INDEX IF NOT EXISTS idx_wellness_email_sends_user_id ON wellness_email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_email_sends_template_id ON wellness_email_sends(email_template_id);
CREATE INDEX IF NOT EXISTS idx_wellness_email_sends_sent_at ON wellness_email_sends(sent_at DESC);

-- Enable RLS on new tables
ALTER TABLE wellness_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_accountability_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_email_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wellness_users
-- Users can view and update their own record
CREATE POLICY "Users can view own wellness user record"
  ON wellness_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness user record"
  ON wellness_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness user record"
  ON wellness_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wellness_accountability_emails
-- Everyone can read active templates (for display purposes)
CREATE POLICY "Anyone can view active accountability emails"
  ON wellness_accountability_emails FOR SELECT
  USING (is_active = true);

-- Only authenticated users can see all templates (admin check done at app level)
CREATE POLICY "Authenticated users can view all accountability emails"
  ON wellness_accountability_emails FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert accountability emails"
  ON wellness_accountability_emails FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update accountability emails"
  ON wellness_accountability_emails FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete accountability emails"
  ON wellness_accountability_emails FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for wellness_email_sends
-- Users can view their own email send history
CREATE POLICY "Users can view own email sends"
  ON wellness_email_sends FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert email sends (app level)
CREATE POLICY "Service can insert email sends"
  ON wellness_email_sends FOR INSERT
  WITH CHECK (true);

-- Function to update wellness_users updated_at timestamp
CREATE OR REPLACE FUNCTION update_wellness_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on wellness_users
CREATE TRIGGER wellness_users_updated_at
  BEFORE UPDATE ON wellness_users
  FOR EACH ROW
  EXECUTE FUNCTION update_wellness_users_updated_at();

-- Function to update wellness_accountability_emails updated_at timestamp
CREATE OR REPLACE FUNCTION update_wellness_accountability_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on wellness_accountability_emails
CREATE TRIGGER wellness_accountability_emails_updated_at
  BEFORE UPDATE ON wellness_accountability_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_wellness_accountability_emails_updated_at();

-- Comments for documentation
COMMENT ON TABLE wellness_users IS 'Links Supabase auth users to wellness preferences and email settings';
COMMENT ON TABLE wellness_accountability_emails IS 'Admin-created email templates for accountability emails';
COMMENT ON TABLE wellness_email_sends IS 'Tracks sent accountability emails to prevent duplicates';

COMMENT ON COLUMN wellness_users.accountability_frequency IS 'How often user wants accountability emails: weekly, biweekly, or monthly';
COMMENT ON COLUMN wellness_accountability_emails.scheduled_send_day IS 'Day of week to send (1=Monday, 7=Sunday), nullable for flexible scheduling';
COMMENT ON COLUMN wellness_accountability_emails.email_type IS 'Type of wellness content: diet, exercise, supplements, or general';
