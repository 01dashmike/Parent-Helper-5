-- Provider Weekly Reports Migration
-- Creates provider_reports table for storing weekly summary statistics

-- 1. Provider reports table
create table if not exists public.provider_reports (
  id uuid primary key default gen_random_uuid(),
  provider_id integer not null references public.providers(id) on delete cascade,
  week_start date not null,
  stats_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider_id, week_start)
);

-- 2. Indexes
create index if not exists provider_reports_provider_idx on public.provider_reports(provider_id);
create index if not exists provider_reports_week_start_idx on public.provider_reports(week_start);
create index if not exists provider_reports_created_idx on public.provider_reports(created_at);

-- 3. Enable RLS
alter table public.provider_reports enable row level security;

-- 4. RLS Policies

-- Service role has full access
create policy if not exists "provider_reports service role access"
  on public.provider_reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Providers can read their own reports
create policy if not exists "provider_reports providers read own"
  on public.provider_reports
  for select
  using (
    exists (
      select 1
      from public.providers_users pu
      where pu.provider_id = provider_reports.provider_id
        and pu.user_id = auth.uid()
        and pu.status = 'active'
    )
  );

-- Admins can read all reports (via admin cookie check - handled in application layer)

