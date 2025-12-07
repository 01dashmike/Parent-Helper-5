-- Migration: Wallet Accounts Foundation
-- Creates wallet_accounts and wallet_transactions tables for internal credit system
-- Feature-flag guarded: FAMILY_WALLET_ENABLED

-- Create enum type for transaction types
do $$
begin
  if not exists (select 1 from pg_type where typname = 'wallet_transaction_type') then
    create type public.wallet_transaction_type as enum ('credit', 'debit', 'adjustment');
  end if;
end $$;

-- Create wallet_accounts table
create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Create wallet_transactions table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_accounts(id) on delete cascade,
  type public.wallet_transaction_type not null,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists wallet_accounts_user_idx on public.wallet_accounts(user_id);
create index if not exists wallet_accounts_updated_idx on public.wallet_accounts(updated_at);
create index if not exists wallet_transactions_wallet_idx on public.wallet_transactions(wallet_id);
create index if not exists wallet_transactions_type_idx on public.wallet_transactions(type);
create index if not exists wallet_transactions_created_idx on public.wallet_transactions(created_at);

-- Enable RLS
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;

-- RLS Policies for wallet_accounts
-- Users can read only their own wallet
create policy "Users can view own wallet account"
  on public.wallet_accounts
  for select
  using ( auth.uid() = user_id );

-- Users cannot insert/update/delete their own wallet (created via API/service role)
-- Only service role can manage wallet accounts
create policy "Service role can manage wallet accounts"
  on public.wallet_accounts
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- RLS Policies for wallet_transactions
-- Users can read transactions for their own wallet
create policy "Users can view own wallet transactions"
  on public.wallet_transactions
  for select
  using (
    exists (
      select 1 from public.wallet_accounts
      where wallet_accounts.id = wallet_transactions.wallet_id
      and wallet_accounts.user_id = auth.uid()
    )
  );

-- Service role can manage all transactions
create policy "Service role can manage wallet transactions"
  on public.wallet_transactions
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- Function to update wallet balance after transaction
create or replace function public.update_wallet_balance_after_transaction()
returns trigger
language plpgsql
security definer
as $$
declare
  wallet_user_id uuid;
  new_balance integer;
begin
  -- Get wallet user_id
  select user_id into wallet_user_id
  from public.wallet_accounts
  where id = new.wallet_id;

  -- Calculate new balance based on transaction type
  if new.type = 'credit' then
    update public.wallet_accounts
    set balance_cents = balance_cents + new.amount_cents,
        updated_at = now()
    where id = new.wallet_id;
  elsif new.type = 'debit' then
    -- Check balance before debit
    select balance_cents into new_balance
    from public.wallet_accounts
    where id = new.wallet_id;

    if new_balance < new.amount_cents then
      raise exception 'Insufficient balance. Available: %, Requested: %', new_balance, new.amount_cents;
    end if;

    update public.wallet_accounts
    set balance_cents = balance_cents - new.amount_cents,
        updated_at = now()
    where id = new.wallet_id;
  elsif new.type = 'adjustment' then
    -- Adjustments can be positive or negative (handled via amount_cents sign)
    -- For adjustment, we'll use amount_cents directly (can be negative)
    update public.wallet_accounts
    set balance_cents = balance_cents + new.amount_cents,
        updated_at = now()
    where id = new.wallet_id;
  end if;

  return new;
end;
$$;

-- Trigger to update wallet balance on transaction insert
drop trigger if exists wallet_transactions_update_balance_trigger on public.wallet_transactions;
create trigger wallet_transactions_update_balance_trigger
after insert on public.wallet_transactions
for each row
execute function public.update_wallet_balance_after_transaction();

-- Function to ensure wallet account exists for user
create or replace function public.ensure_wallet_account(p_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  wallet_id uuid;
begin
  -- Check if wallet exists
  select id into wallet_id
  from public.wallet_accounts
  where user_id = p_user_id;

  -- Create if doesn't exist
  if wallet_id is null then
    insert into public.wallet_accounts (user_id, balance_cents)
    values (p_user_id, 0)
    returning id into wallet_id;
  end if;

  return wallet_id;
end;
$$;

