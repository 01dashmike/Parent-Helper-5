-- Create provider_admin_meta table for admin operations
-- This table stores admin-specific metadata for providers (status, verification, tier, tags, notes)

create table if not exists provider_admin_meta (
  provider_id integer primary key references providers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'snoozed')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'in_review', 'verified', 'flagged')),
  tier text not null default 'free' check (tier in ('free', 'standard', 'premium', 'enterprise')),
  notes text,
  tags text[] default '{}',
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Indexes for common queries
create index if not exists provider_admin_meta_status_idx on provider_admin_meta(status);
create index if not exists provider_admin_meta_verification_status_idx on provider_admin_meta(verification_status);
create index if not exists provider_admin_meta_tier_idx on provider_admin_meta(tier);
create index if not exists provider_admin_meta_tags_idx on provider_admin_meta using gin(tags);

-- Function to update updated_at timestamp
create or replace function update_provider_admin_meta_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger provider_admin_meta_updated_at
  before update on provider_admin_meta
  for each row
  execute function update_provider_admin_meta_updated_at();

-- Create admin meta records for existing providers (optional - can be done lazily)
-- This ensures all existing providers have admin meta records
insert into provider_admin_meta (provider_id, status, verification_status, tier)
select 
  id,
  case 
    when is_active = true and is_claimed = true then 'approved'
    when is_active = false then 'rejected'
    else 'pending'
  end as status,
  case
    when last_verified_at is not null then 'verified'
    else 'unverified'
  end as verification_status,
  'free' as tier
from providers
where id not in (select provider_id from provider_admin_meta)
on conflict (provider_id) do nothing;





