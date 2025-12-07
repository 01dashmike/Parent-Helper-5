create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'menu',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_plans_user_idx on public.saved_plans(user_id);

alter table public.saved_plans enable row level security;

create policy "Users can insert own saved plans"
  on public.saved_plans
  for insert
  with check ( auth.uid() = user_id );

create policy "Users can view own saved plans"
  on public.saved_plans
  for select
  using ( auth.uid() = user_id );

create policy "Users can delete own saved plans"
  on public.saved_plans
  for delete
  using ( auth.uid() = user_id );

create policy "Service role can manage saved plans"
  on public.saved_plans
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

