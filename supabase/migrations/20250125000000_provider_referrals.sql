-- Provider Referral System Migration
-- Creates tables for provider referrals, rewards, and analytics

-- 1. Provider Referrals table
create table if not exists public.provider_referrals (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  referral_code text not null unique,
  referred_provider_id integer references public.providers(id) on delete set null,
  status text not null default 'clicked', -- 'clicked', 'registered', 'listing_created', 'first_booking'
  reward_issued boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Provider Rewards table
create table if not exists public.provider_rewards (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  reward_type text not null, -- 'credit', 'free_boost', 'discount'
  reward_value numeric not null, -- amount in pence for credit, count for boosts, percentage for discount
  reason text not null, -- e.g., "Referral: first booking completed"
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Provider Referral Analytics table (aggregated stats)
create table if not exists public.provider_referral_analytics (
  provider_id integer primary key references public.providers(id) on delete cascade,
  clicks integer not null default 0,
  registrations integer not null default 0,
  listings_created integer not null default 0,
  conversions integer not null default 0, -- first bookings
  last_updated timestamptz not null default now()
);

-- 4. Provider Email Tests table (for A/B testing)
create table if not exists public.provider_email_tests (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  email_type text not null, -- 'weekly_growth_report'
  variant text not null, -- 'A' or 'B'
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz, -- if referral link was clicked
  metadata jsonb default '{}'::jsonb
);

-- 5. Indexes
create index if not exists provider_referrals_provider_idx on public.provider_referrals(provider_id);
create index if not exists provider_referrals_code_idx on public.provider_referrals(referral_code);
create index if not exists provider_referrals_referred_idx on public.provider_referrals(referred_provider_id);
create index if not exists provider_referrals_status_idx on public.provider_referrals(status);
create index if not exists provider_rewards_provider_idx on public.provider_rewards(provider_id);
create index if not exists provider_rewards_type_idx on public.provider_rewards(reward_type);
create index if not exists provider_rewards_expires_idx on public.provider_rewards(expires_at) where expires_at is not null;
create index if not exists provider_email_tests_provider_idx on public.provider_email_tests(provider_id);
create index if not exists provider_email_tests_type_variant_idx on public.provider_email_tests(email_type, variant);

-- 6. Updated_at trigger function (if not exists)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 7. Add updated_at triggers
drop trigger if exists provider_referrals_set_updated_at on public.provider_referrals;
create trigger provider_referrals_set_updated_at
before update on public.provider_referrals
for each row
execute function public.touch_updated_at();

-- 8. Function to update referral analytics
create or replace function public.update_referral_analytics()
returns trigger
language plpgsql
as $$
begin
  insert into public.provider_referral_analytics (provider_id, clicks, registrations, listings_created, conversions, last_updated)
  values (
    new.provider_id,
    case when new.status = 'clicked' then 1 else 0 end,
    case when new.status = 'registered' then 1 else 0 end,
    case when new.status = 'listing_created' then 1 else 0 end,
    case when new.status = 'first_booking' then 1 else 0 end,
    now()
  )
  on conflict (provider_id) do update set
    clicks = provider_referral_analytics.clicks + case when new.status = 'clicked' then 1 else 0 end,
    registrations = provider_referral_analytics.registrations + case when new.status = 'registered' then 1 else 0 end,
    listings_created = provider_referral_analytics.listings_created + case when new.status = 'listing_created' then 1 else 0 end,
    conversions = provider_referral_analytics.conversions + case when new.status = 'first_booking' then 1 else 0 end,
    last_updated = now();
  return new;
end;
$$;

-- 9. Trigger to auto-update analytics
drop trigger if exists provider_referrals_update_analytics on public.provider_referrals;
create trigger provider_referrals_update_analytics
after insert on public.provider_referrals
for each row
execute function public.update_referral_analytics();

-- 10. Enable RLS
alter table public.provider_referrals enable row level security;
alter table public.provider_rewards enable row level security;
alter table public.provider_referral_analytics enable row level security;
alter table public.provider_email_tests enable row level security;

-- 11. RLS Policies

-- Service role has full access
create policy if not exists "provider_referrals service role access"
  on public.provider_referrals
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "provider_rewards service role access"
  on public.provider_rewards
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "provider_referral_analytics service role access"
  on public.provider_referral_analytics
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "provider_email_tests service role access"
  on public.provider_email_tests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Providers can read their own referrals
create policy if not exists "provider_referrals providers read own"
  on public.provider_referrals
  for select
  using (
    exists (
      select 1
      from public.provider_accounts pa
      where pa.provider_id = provider_referrals.provider_id
        and pa.user_id = auth.uid()
        and pa.status = 'active'
    )
  );

-- Providers can read their own rewards
create policy if not exists "provider_rewards providers read own"
  on public.provider_rewards
  for select
  using (
    exists (
      select 1
      from public.provider_accounts pa
      where pa.provider_id = provider_rewards.provider_id
        and pa.user_id = auth.uid()
        and pa.status = 'active'
    )
  );

-- Providers can read their own analytics
create policy if not exists "provider_referral_analytics providers read own"
  on public.provider_referral_analytics
  for select
  using (
    exists (
      select 1
      from public.provider_accounts pa
      where pa.provider_id = provider_referral_analytics.provider_id
        and pa.user_id = auth.uid()
        and pa.status = 'active'
    )
  );

-- Public can insert referral clicks (tracking)
create policy if not exists "provider_referrals public insert clicks"
  on public.provider_referrals
  for insert
  with check (status = 'clicked');

