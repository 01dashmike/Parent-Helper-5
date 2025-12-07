-- AI Cache Table
-- Stores cached AI responses for performance optimization

create table if not exists public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  response text not null,
  role text not null, -- 'admin' | 'provider'
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- Indexes for fast lookups
create index if not exists ai_cache_user_idx on public.ai_cache(user_id);
create index if not exists ai_cache_query_idx on public.ai_cache(query);
create index if not exists ai_cache_expires_idx on public.ai_cache(expires_at);

-- RLS policies
alter table public.ai_cache enable row level security;

-- Users can view their own cache entries
create policy "Users can view own cache"
  on public.ai_cache
  for select
  using (auth.uid() = user_id);

-- Service role can manage all cache
create policy "Service role can manage cache"
  on public.ai_cache
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Function to clean expired cache entries
create or replace function clean_expired_ai_cache()
returns void
language plpgsql
as $$
begin
  delete from public.ai_cache where expires_at < now();
end;
$$;

