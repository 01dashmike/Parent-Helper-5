-- Growth Automation Control Center
-- Creates feature_flags and ai_cache tables for automation dashboard

-- 1. Feature flags table
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  flag_value boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by text,
  created_at timestamptz not null default now()
);

-- 2. AI cache table for memoizing AI responses
create table if not exists public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  cache_value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 3. Growth metrics view (if not exists) - uses modern booking tables
DO $$
BEGIN
  -- Only create if simple_bookings exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simple_bookings') THEN
    DROP VIEW IF EXISTS public.growth_metrics_view;
    
    EXECUTE '
    CREATE OR REPLACE VIEW public.growth_metrics_view AS
    SELECT 
      -- Revenue metrics (from booking_payments)
      COALESCE((SELECT SUM(amount_cents) FROM public.booking_payments), 0) AS total_revenue_cents,
      COALESCE((SELECT SUM(amount_cents) FROM public.booking_payments WHERE created_at >= now() - interval ''7 days''), 0) AS revenue_last_7_days_cents,
      COALESCE((SELECT SUM(amount_cents) FROM public.booking_payments WHERE created_at >= now() - interval ''30 days''), 0) AS revenue_last_30_days_cents,
      
      -- Booking metrics (from simple_bookings)
      (SELECT COUNT(*) FROM public.simple_bookings WHERE status = ''confirmed'') AS total_confirmed_bookings,
      (SELECT COUNT(*) FROM public.simple_bookings WHERE status = ''confirmed'' AND created_at >= now() - interval ''7 days'') AS bookings_last_7_days,
      (SELECT COUNT(*) FROM public.simple_bookings WHERE status = ''confirmed'' AND created_at >= now() - interval ''30 days'') AS bookings_last_30_days,
      
      -- User metrics
      (SELECT COUNT(*) FROM auth.users WHERE created_at >= now() - interval ''7 days'') AS signups_last_7_days,
      (SELECT COUNT(*) FROM auth.users WHERE created_at >= now() - interval ''30 days'') AS signups_last_30_days,
      (SELECT COUNT(*) FROM auth.users) AS total_users,
      
      -- Referral metrics
      COALESCE((SELECT COUNT(*) FROM public.member_referrals WHERE status = ''converted'' AND created_at >= now() - interval ''7 days''), 0) AS referrals_converted_last_7_days,
      COALESCE((SELECT COUNT(*) FROM public.member_referrals WHERE status = ''converted''), 0) AS total_referrals_converted,
      
      -- Wallet metrics (from wallet_accounts)
      COALESCE((SELECT SUM(balance_cents) FROM public.wallet_accounts), 0) AS total_wallet_balance_cents,
      COALESCE((SELECT COUNT(*) FROM public.wallet_transactions WHERE type = ''credit'' AND created_at >= now() - interval ''7 days''), 0) AS wallet_credits_last_7_days,
      
      -- Provider metrics
      (SELECT COUNT(*) FROM public.providers WHERE created_at >= now() - interval ''7 days'') AS providers_added_last_7_days,
      (SELECT COUNT(*) FROM public.providers) AS total_providers,
      
      -- Conversion rate (bookings / signups)
      CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) > 0 
        THEN ROUND(((SELECT COUNT(*) FROM public.simple_bookings WHERE status = ''confirmed'')::numeric / (SELECT COUNT(*) FROM auth.users)::numeric) * 100, 2)
        ELSE 0
      END AS conversion_rate_percent,
      
      now() AS calculated_at';
  END IF;
END $$;

-- 4. Indexes
create index if not exists feature_flags_key_idx on public.feature_flags(flag_key);
create index if not exists ai_cache_key_idx on public.ai_cache(cache_key);
create index if not exists ai_cache_expires_idx on public.ai_cache(expires_at);

-- 5. Initialize default feature flags
insert into public.feature_flags (flag_key, flag_value, description)
values
  ('AI_INSIGHTS_ENABLED', false, 'Enable AI Growth Insights Engine'),
  ('WEEKLY_REPORTS_ENABLED', false, 'Enable Automated Weekly Provider Reports'),
  ('AI_PERFORMANCE_COACH_ENABLED', false, 'Enable AI Performance Coach')
on conflict (flag_key) do nothing;

-- 6. Function to clean expired cache
create or replace function public.clean_expired_ai_cache()
returns void
language plpgsql
as $$
begin
  delete from public.ai_cache where expires_at < now();
end;
$$;

-- 7. Enable RLS
alter table public.feature_flags enable row level security;
alter table public.ai_cache enable row level security;

-- 8. RLS Policies - service role only
create policy if not exists "feature_flags service role access"
  on public.feature_flags
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "ai_cache service role access"
  on public.ai_cache
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

