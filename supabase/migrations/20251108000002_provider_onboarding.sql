-- Ensure helper trigger function exists
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create providers storage bucket with required policies
insert into storage.buckets (id, name, public)
values ('providers', 'providers', true)
on conflict (id) do nothing;

-- Ensure public read access and restrict writes to service role
drop policy if exists "Providers assets are publicly readable" on storage.objects;
create policy "Providers assets are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'providers');

drop policy if exists "Service role can upload provider assets" on storage.objects;
create policy "Service role can upload provider assets"
  on storage.objects
  for insert
  with check (bucket_id = 'providers' and auth.role() = 'service_role')
  using (bucket_id = 'providers' and auth.role() = 'service_role');

drop policy if exists "Service role can update provider assets" on storage.objects;
create policy "Service role can update provider assets"
  on storage.objects
  for update
  with check (bucket_id = 'providers' and auth.role() = 'service_role')
  using (bucket_id = 'providers' and auth.role() = 'service_role');

drop policy if exists "Service role can delete provider assets" on storage.objects;
create policy "Service role can delete provider assets"
  on storage.objects
  for delete
  using (bucket_id = 'providers' and auth.role() = 'service_role');

-- Extend providers_leads table schema
alter table public.providers_leads
  add column if not exists town text,
  add column if not exists categories text[] default '{}'::text[],
  add column if not exists description text,
  add column if not exists logo_path text,
  add column if not exists gallery_paths text[] default '{}'::text[],
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists source text default 'onboarding',
  add column if not exists updated_at timestamptz default now();

alter table public.providers_leads
  alter column status set default 'new';

alter table public.providers_leads
  drop constraint if exists providers_leads_status_check;

alter table public.providers_leads
  add constraint providers_leads_status_check
    check (status in ('new', 'approved', 'rejected'));

drop trigger if exists providers_leads_updated_at on public.providers_leads;
create trigger providers_leads_updated_at
  before update on public.providers_leads
  for each row
  execute procedure public.set_current_timestamp_updated_at();

-- Create providers table for approved organisations
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid references public.providers_leads (id) on delete set null,
  org_name text,
  contact_name text,
  email text,
  phone text,
  website text,
  town text,
  categories text[] default '{}'::text[],
  description text,
  logo_path text,
  gallery_paths text[] default '{}'::text[],
  newsletter_opt_in boolean default false,
  status text not null default 'active',
  constraint providers_status_check check (status in ('active', 'inactive'))
);

alter table public.providers enable row level security;

drop policy if exists "Service role can manage providers" on public.providers;
create policy "Service role can manage providers"
  on public.providers
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
  before update on public.providers
  for each row
  execute procedure public.set_current_timestamp_updated_at();

