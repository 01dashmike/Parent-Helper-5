create table if not exists public.providers_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_name text,
  contact_name text,
  email text not null,
  phone text,
  website text,
  instagram text,
  facebook text,
  postcode text,
  accept_terms boolean default false,
  wants_newsletter boolean default false,
  notes text,
  source text default 'onboarding',
  status text default 'new'
);

alter table public.providers_leads enable row level security;

create policy "admin can read all" on public.providers_leads
for select using ( auth.role() = 'service_role' );

create policy "admin can insert" on public.providers_leads
for insert with check ( auth.role() = 'service_role' );

create policy "admin can update" on public.providers_leads
for update using ( auth.role() = 'service_role' );

create policy "admin can delete" on public.providers_leads
for delete using ( auth.role() = 'service_role' );

