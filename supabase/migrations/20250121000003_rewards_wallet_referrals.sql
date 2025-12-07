-- Rewards → Wallet → Bookings → Referrals Pipeline
-- Creates tables for rewards, wallet transactions, and member referrals

-- 1. Rewards table
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'referral', 'booking', 'signup', etc.
  value_cents integer not null default 0,
  points integer not null default 0, -- 1 point = 1 penny, 500 points = £5
  status text not null default 'available', -- 'available', 'credited', 'expired'
  source text, -- 'referral', 'booking_bonus', etc.
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Wallet transactions table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'credit', 'debit'
  amount_cents integer not null,
  source text not null, -- 'reward', 'booking', 'refund', etc.
  reference_id uuid, -- reference to reward, booking, etc.
  description text,
  balance_after_cents integer, -- wallet balance after this transaction
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Member referrals table (for parent-to-parent referrals)
create table if not exists public.member_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_email text not null,
  referral_code text not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'converted', 'expired'
  reward_triggered boolean not null default false,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(referred_email, referrer_user_id)
);

-- 4. Event logging table for instrumentation
create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Indexes
create index if not exists rewards_user_idx on public.rewards(user_id);
create index if not exists rewards_status_idx on public.rewards(status);
create index if not exists rewards_available_idx on public.rewards(user_id, status) where status = 'available';
create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id);
create index if not exists wallet_transactions_type_idx on public.wallet_transactions(type);
create index if not exists wallet_transactions_source_idx on public.wallet_transactions(source);
create index if not exists member_referrals_referrer_idx on public.member_referrals(referrer_user_id);
create index if not exists member_referrals_email_idx on public.member_referrals(referred_email);
create index if not exists member_referrals_code_idx on public.member_referrals(referral_code);
create index if not exists member_referrals_status_idx on public.member_referrals(status);
create index if not exists event_logs_event_type_idx on public.event_logs(event_type);
create index if not exists event_logs_user_idx on public.event_logs(user_id);
create index if not exists event_logs_created_idx on public.event_logs(created_at);

-- 6. Add reward_triggered column to bookings table
alter table public.bookings
  add column if not exists reward_triggered boolean not null default false,
  add column if not exists wallet_credit_applied_cents integer default 0,
  add column if not exists referral_code text;

-- Also add to simple_bookings if it exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'simple_bookings') then
    alter table public.simple_bookings
      add column if not exists reward_triggered boolean not null default false,
      add column if not exists wallet_credit_applied_cents integer default 0,
      add column if not exists referral_code text;
  end if;
end $$;

-- 7. Add wallet_balance_cents to user profile (or create user_wallets view)
-- We'll calculate balance from wallet_transactions, but add a cached column for performance
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'user_wallets'
    and column_name = 'user_id'
  ) then
    create table if not exists public.user_wallets (
      user_id uuid primary key references auth.users(id) on delete cascade,
      balance_cents integer not null default 0,
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

-- 8. Function to update wallet balance
create or replace function public.update_wallet_balance()
returns trigger
language plpgsql
as $$
declare
  new_balance integer;
begin
  -- Calculate new balance from all transactions
  select coalesce(sum(
    case when type = 'credit' then amount_cents else -amount_cents end
  ), 0) into new_balance
  from public.wallet_transactions
  where user_id = new.user_id;

  -- Update or insert wallet balance
  insert into public.user_wallets (user_id, balance_cents, updated_at)
  values (new.user_id, new_balance, now())
  on conflict (user_id) do update
  set balance_cents = new_balance, updated_at = now();

  -- Set balance_after_cents in the transaction
  new.balance_after_cents := new_balance;
  
  return new;
end;
$$;

-- 9. Trigger to update wallet balance on transaction
drop trigger if exists wallet_transactions_update_balance on public.wallet_transactions;
create trigger wallet_transactions_update_balance
after insert on public.wallet_transactions
for each row
execute function public.update_wallet_balance();

-- 10. Function to log events
create or replace function public.log_event(
  p_event_type text,
  p_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  event_id uuid;
begin
  insert into public.event_logs (event_type, user_id, metadata)
  values (p_event_type, p_user_id, p_metadata)
  returning id into event_id;
  
  return event_id;
end;
$$;

-- 11. Ensure touch_updated_at function exists
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 12. Add updated_at triggers
drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
before update on public.rewards
for each row
execute function public.touch_updated_at();

drop trigger if exists member_referrals_set_updated_at on public.member_referrals;
create trigger member_referrals_set_updated_at
before update on public.member_referrals
for each row
execute function public.touch_updated_at();

-- 13. Enable RLS
alter table public.rewards enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.member_referrals enable row level security;
alter table public.event_logs enable row level security;
alter table public.user_wallets enable row level security;

-- 14. RLS Policies for rewards
create policy if not exists "rewards service role access"
  on public.rewards
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "rewards users manage own"
  on public.rewards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 15. RLS Policies for wallet_transactions
create policy if not exists "wallet_transactions service role access"
  on public.wallet_transactions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "wallet_transactions users read own"
  on public.wallet_transactions
  for select
  using (auth.uid() = user_id);

-- 16. RLS Policies for member_referrals
create policy if not exists "member_referrals service role access"
  on public.member_referrals
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "member_referrals users manage own"
  on public.member_referrals
  for all
  using (auth.uid() = referrer_user_id)
  with check (auth.uid() = referrer_user_id);

-- 17. RLS Policies for event_logs (service role only for writes, users can read their own)
create policy if not exists "event_logs service role access"
  on public.event_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "event_logs users read own"
  on public.event_logs
  for select
  using (auth.uid() = user_id or auth.uid() is null);

-- 18. RLS Policies for user_wallets
create policy if not exists "user_wallets service role access"
  on public.user_wallets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "user_wallets users read own"
  on public.user_wallets
  for select
  using (auth.uid() = user_id);

