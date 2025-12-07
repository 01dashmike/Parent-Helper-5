create table if not exists providers_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  company text not null,
  website text,
  postcode text,
  town text,
  categories text[],
  hear_about text,
  message text,
  newsletter_optin boolean default false,
  privacy_accepted boolean not null default false,
  ip text,
  user_agent text,
  status text default 'new',
  photos text[]
);

alter table providers_leads enable row level security;

create policy "allow service role insert" on providers_leads for insert
  using (auth.role() = 'service_role');


