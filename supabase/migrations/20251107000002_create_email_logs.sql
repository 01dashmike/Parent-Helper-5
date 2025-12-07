create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  to_address text not null,
  subject text not null,
  status text not null,
  type text not null,
  error text,
  created_at timestamptz default now()
);

alter table email_logs enable row level security;

create policy if not exists "allow service role access" on email_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


