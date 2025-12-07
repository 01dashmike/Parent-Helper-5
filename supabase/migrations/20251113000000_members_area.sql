-- Create saved_searches table
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on public.saved_searches(user_id);
create index if not exists saved_searches_created_idx on public.saved_searches(created_at);

alter table public.saved_searches enable row level security;

create policy "Users can insert own saved searches"
  on public.saved_searches
  for insert
  with check ( auth.uid() = user_id );

create policy "Users can view own saved searches"
  on public.saved_searches
  for select
  using ( auth.uid() = user_id );

create policy "Users can delete own saved searches"
  on public.saved_searches
  for delete
  using ( auth.uid() = user_id );

create policy "Service role can manage saved searches"
  on public.saved_searches
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- Create alerts table
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query jsonb not null,
  day_of_week integer[] default array[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alerts_user_idx on public.alerts(user_id);
create index if not exists alerts_active_idx on public.alerts(active);
create index if not exists alerts_created_idx on public.alerts(created_at);

alter table public.alerts enable row level security;

create policy "Users can insert own alerts"
  on public.alerts
  for insert
  with check ( auth.uid() = user_id );

create policy "Users can view own alerts"
  on public.alerts
  for select
  using ( auth.uid() = user_id );

create policy "Users can update own alerts"
  on public.alerts
  for update
  using ( auth.uid() = user_id );

create policy "Users can delete own alerts"
  on public.alerts
  for delete
  using ( auth.uid() = user_id );

create policy "Service role can manage alerts"
  on public.alerts
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_alerts_updated_at
  before update on public.alerts
  for each row
  execute function update_updated_at_column();

