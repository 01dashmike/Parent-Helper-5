-- Provider Referral Program
-- Creates referrals and referral_visits tables

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_provider_id integer not null references public.providers(id) on delete cascade,
  referred_email text not null,
  status text not null default 'pending',
  reward_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_provider_id);
create index if not exists referrals_email_idx on public.referrals(referred_email);
create index if not exists referrals_status_idx on public.referrals(status);

-- Track referral link clicks
create table if not exists public.referral_visits (
  id uuid primary key default gen_random_uuid(),
  referrer_provider_id integer not null references public.providers(id) on delete cascade,
  referral_code text not null,
  visited_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index if not exists referral_visits_referrer_idx on public.referral_visits(referrer_provider_id);
create index if not exists referral_visits_code_idx on public.referral_visits(referral_code);
create index if not exists referral_visits_visited_idx on public.referral_visits(visited_at);

-- Add referral_code column to providers table if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'providers'
    and column_name = 'referral_code'
  ) then
    alter table public.providers add column referral_code text;
    create unique index if not exists providers_referral_code_idx on public.providers(referral_code) where referral_code is not null;
  end if;
end $$;

-- Add referred_by_provider_id to providers table if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'providers'
    and column_name = 'referred_by_provider_id'
  ) then
    alter table public.providers add column referred_by_provider_id integer references public.providers(id) on delete set null;
    create index if not exists providers_referred_by_idx on public.providers(referred_by_provider_id);
  end if;
end $$;

-- Add referral_reward_credit_cents and referral_reward_expires_at to providers table
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'providers'
    and column_name = 'referral_reward_credit_cents'
  ) then
    alter table public.providers add column referral_reward_credit_cents integer default 0;
  end if;
  
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'providers'
    and column_name = 'referral_reward_expires_at'
  ) then
    alter table public.providers add column referral_reward_expires_at timestamptz;
  end if;
end $$;

-- RLS policies for referrals (providers can view their own referrals)
alter table public.referrals enable row level security;

create policy "Providers can view their own referrals"
  on public.referrals
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_id = referrer_provider_id
      and user_id = auth.uid()
    )
  );

-- Service role can manage all referrals
create policy "Service role can manage referrals"
  on public.referrals
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- RLS for referral_visits (providers can view their own visits)
alter table public.referral_visits enable row level security;

create policy "Providers can view their own referral visits"
  on public.referral_visits
  for select
  using (
    exists (
      select 1 from public.provider_accounts
      where provider_id = referrer_provider_id
      and user_id = auth.uid()
    )
  );

-- Service role can manage all referral visits
create policy "Service role can manage referral visits"
  on public.referral_visits
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- Function to update updated_at timestamp
create or replace function update_referrals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_referrals_updated_at
  before update on public.referrals
  for each row
  execute function update_referrals_updated_at();

