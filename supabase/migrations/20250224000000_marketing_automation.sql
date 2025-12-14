-- Marketing Automation & Notifications System Migration
-- Creates tables for notification templates, events, automation flows, and user preferences

-- 1. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms')),
  audience TEXT NOT NULL CHECK (audience IN ('parent', 'provider', 'admin')),
  subject TEXT,
  body_markdown TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notification_templates_key_idx ON notification_templates (key);
CREATE INDEX IF NOT EXISTS notification_templates_audience_idx ON notification_templates (audience);
CREATE INDEX IF NOT EXISTS notification_templates_is_active_idx ON notification_templates (is_active);

-- 2. Notification Events (Log of each notification attempt)
CREATE TABLE IF NOT EXISTS notification_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'bounced', 'failed', 'skipped')),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notification_events_user_id_created_at_idx ON notification_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS notification_events_template_key_created_at_idx ON notification_events (template_key, created_at);
CREATE INDEX IF NOT EXISTS notification_events_status_idx ON notification_events (status);

-- 3. Automation Flows
CREATE TABLE IF NOT EXISTS automation_flows (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL CHECK (audience IN ('parent', 'provider', 'admin')),
  is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  config JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS automation_flows_key_idx ON automation_flows (key);
CREATE INDEX IF NOT EXISTS automation_flows_is_enabled_idx ON automation_flows (is_enabled);

-- 4. Automation Runs (Execution logs per flow per day)
CREATE TABLE IF NOT EXISTS automation_runs (
  id BIGSERIAL PRIMARY KEY,
  flow_key TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  processed_count INTEGER DEFAULT 0 NOT NULL,
  sent_count INTEGER DEFAULT 0 NOT NULL,
  error_count INTEGER DEFAULT 0 NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS automation_runs_flow_key_created_at_idx ON automation_runs (flow_key, created_at);
CREATE INDEX IF NOT EXISTS automation_runs_status_idx ON automation_runs (status);

-- 5. User Notification Settings
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_marketing_opt_in BOOLEAN DEFAULT TRUE NOT NULL,
  email_transactional_opt_in BOOLEAN DEFAULT TRUE NOT NULL,
  sms_opt_in BOOLEAN DEFAULT FALSE NOT NULL,
  marketing_tags TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS user_notification_settings_user_id_idx ON user_notification_settings (user_id);

-- Insert default automation flows
INSERT INTO automation_flows (key, name, description, audience, is_enabled, config) VALUES
  ('parent_booking_reminder', 'Parent Booking Reminder', 'Send reminder emails 24-48h before class starts', 'parent', true, '{"hours_before_class": 24, "max_hours_before": 48}'::jsonb),
  ('parent_lapsed_reactivation', 'Parent Lapsed Reactivation', 'Reactivate parents with no bookings in 45+ days', 'parent', true, '{"days_since_last_booking": 45, "min_days_between_emails": 30}'::jsonb),
  ('parent_cancellation_suggestions', 'Cancellation Suggestions', 'Suggest alternative classes when booking is cancelled', 'parent', true, '{"max_suggestions": 3}'::jsonb),
  ('provider_weekly_digest', 'Provider Weekly Digest', 'Weekly performance summary for providers', 'provider', true, '{"day_of_week": 1, "hour": 8}'::jsonb),
  ('provider_onboarding_nudge', 'Provider Onboarding Nudge', 'Remind providers to complete onboarding', 'provider', true, '{"nudge_after_days": [2, 7]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (key, channel, audience, subject, body_markdown, is_active) VALUES
  ('parent_booking_reminder', 'email', 'parent', 'Reminder: {{class_name}} tomorrow', 'Hi {{first_name}},\n\nJust a friendly reminder that {{child_name}} has {{class_name}} tomorrow at {{class_time}}.\n\nLocation: {{class_location}}\nProvider: {{provider_name}}\n\n[Manage Booking]({{manage_booking_url}})', true),
  ('parent_lapsed_reactivation', 'email', 'parent', 'We miss you! New classes near you', 'Hi {{first_name}},\n\nIt''s been a while since we''ve seen you! We thought you might like to know about some great classes happening near you:\n\n{{#recommended_classes}}\n- {{name}} - [Book now]({{url}})\n{{/recommended_classes}}\n\nHope to see you soon!', true),
  ('parent_cancellation_suggestions', 'email', 'parent', 'Alternative classes for {{cancelled_class_name}}', 'Hi {{first_name}},\n\nWe''re sorry that {{cancelled_class_name}} was cancelled. Here are some similar classes you might enjoy:\n\n{{#suggested_classes}}\n- {{name}} at {{time}} - [Book now]({{url}})\n{{/suggested_classes}}', true),
  ('provider_weekly_digest', 'email', 'provider', 'Your weekly performance summary', 'Hi {{provider_name}},\n\nHere''s your performance for the last 7 days:\n\n**Views:** {{views_this_week}} ({{views_change}}% vs last week)\n**Bookings:** {{bookings_this_week}} ({{bookings_change}}% vs last week)\n**Revenue:** £{{revenue_this_week}}\n\n**Top Class:** {{top_class_name}} ({{top_class_views}} views, {{top_class_bookings}} bookings)\n\n[View Full Dashboard]({{dashboard_url}})', true),
  ('provider_onboarding_nudge_2d', 'email', 'provider', 'Almost there! Complete your profile', 'Hi {{provider_name}},\n\nYou''re so close to completing your profile! Just a few more steps and you''ll be ready to start accepting bookings.\n\n[Continue Onboarding]({{onboarding_url}})', true),
  ('provider_onboarding_nudge_7d', 'email', 'provider', 'Last chance: Complete your profile', 'Hi {{provider_name}},\n\nIt''s been a week since you started your profile. Complete it now to start accepting bookings from parents!\n\n[Complete Onboarding]({{onboarding_url}})', true)
ON CONFLICT (key) DO NOTHING;








