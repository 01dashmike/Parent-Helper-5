-- Marketing Automation Migration
-- Creates tables for campaigns, email queue, SMS queue, and automation rules

-- 1. Marketing campaigns table
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- 'welcome', 'first_booking', 'inactivity', 'saved_search_digest', 'wallet_nudge', 'referral_reminder'
  template_id text, -- SendGrid template ID
  status text not null default 'active', -- 'active', 'paused', 'archived'
  enabled boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Email queue table
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  template_id text,
  subject text not null,
  html_content text not null,
  text_content text,
  variables jsonb default '{}'::jsonb, -- Handlebars variables: {first_name, wallet_balance, local_city, etc}
  status text not null default 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  sendgrid_message_id text,
  opened_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  scheduled_for timestamptz default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. SMS queue table
create table if not exists public.sms_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone text not null,
  message text not null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  status text not null default 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  twilio_message_id text,
  error_message text,
  scheduled_for timestamptz default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. Automation rules table
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null, -- 'user_signup', 'first_booking', 'inactivity', 'saved_search', 'wallet_balance', 'referral_pending'
  trigger_config jsonb not null, -- e.g., {"days": 30} for inactivity, {"balance_cents": 1000} for wallet
  action_type text not null, -- 'send_email', 'send_sms', 'both'
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  enabled boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Campaign metrics table
create table if not exists public.campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  date date not null,
  emails_sent integer not null default 0,
  emails_opened integer not null default 0,
  emails_clicked integer not null default 0,
  emails_bounced integer not null default 0,
  sms_sent integer not null default 0,
  sms_delivered integer not null default 0,
  conversions integer not null default 0, -- bookings made after campaign
  created_at timestamptz not null default now(),
  unique(campaign_id, date)
);

-- 6. User activity tracking (for inactivity detection)
create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null, -- 'signup', 'booking', 'search', 'login'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists email_queue_user_idx on public.email_queue(user_id);
create index if not exists email_queue_status_idx on public.email_queue(status, scheduled_for);
create index if not exists email_queue_campaign_idx on public.email_queue(campaign_id);
create index if not exists sms_queue_user_idx on public.sms_queue(user_id);
create index if not exists sms_queue_status_idx on public.sms_queue(status, scheduled_for);
create index if not exists sms_queue_campaign_idx on public.sms_queue(campaign_id);
create index if not exists automation_rules_trigger_idx on public.automation_rules(trigger_type, enabled);
create index if not exists campaign_metrics_campaign_date_idx on public.campaign_metrics(campaign_id, date);
create index if not exists user_activity_log_user_idx on public.user_activity_log(user_id, created_at);
create index if not exists user_activity_log_type_idx on public.user_activity_log(activity_type, created_at);

-- Enable RLS
alter table public.marketing_campaigns enable row level security;
alter table public.email_queue enable row level security;
alter table public.sms_queue enable row level security;
alter table public.automation_rules enable row level security;
alter table public.campaign_metrics enable row level security;
alter table public.user_activity_log enable row level security;

-- RLS Policies - Service role full access
create policy if not exists "marketing_campaigns service role access"
  on public.marketing_campaigns
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "email_queue service role access"
  on public.email_queue
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "sms_queue service role access"
  on public.sms_queue
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "automation_rules service role access"
  on public.automation_rules
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "campaign_metrics service role access"
  on public.campaign_metrics
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "user_activity_log service role access"
  on public.user_activity_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Users can view their own email/SMS queue items
create policy if not exists "email_queue users read own"
  on public.email_queue
  for select
  using (auth.uid() = user_id);

create policy if not exists "sms_queue users read own"
  on public.sms_queue
  for select
  using (auth.uid() = user_id);

create policy if not exists "user_activity_log users read own"
  on public.user_activity_log
  for select
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function update_marketing_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_marketing_campaigns_updated_at
  before update on public.marketing_campaigns
  for each row
  execute function update_marketing_updated_at();

create trigger update_automation_rules_updated_at
  before update on public.automation_rules
  for each row
  execute function update_marketing_updated_at();

