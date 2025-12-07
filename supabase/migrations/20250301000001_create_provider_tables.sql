create table if not exists franchises (
    id serial primary key,
    name text not null,
    slug text not null,
    logo_url text,
    default_discount_percent numeric(5,2) not null default 10.0,
    signup_link_slug text,
    stripe_promotion_id text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists franchises_slug_idx on franchises (slug);

create table if not exists providers (
    id serial primary key,
    slug text not null,
    name text not null,
    legal_name text,
    description_raw text,
    description_override text,
    use_description_override boolean not null default false,
    contact_email text,
    contact_phone text,
    website text,
    facebook_url text,
    instagram_url text,
    tiktok_url text,
    youtube_url text,
    booking_email text,
    booking_phone text,
    address_line1 text,
    address_line2 text,
    town text,
    county text,
    postcode text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean not null default true,
    is_claimed boolean not null default false,
    claim_status text not null default 'unclaimed',
    claimed_by_user_id uuid,
    auto_approved boolean not null default false,
    last_scraped_at timestamptz,
    last_verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb
);

create unique index if not exists providers_slug_idx on providers (slug);
create index if not exists providers_town_idx on providers (town);

create table if not exists provider_accounts (
    id serial primary key,
    provider_id integer not null references providers(id) on delete cascade,
    user_id uuid not null,
    role text not null default 'owner',
    status text not null default 'active',
    created_at timestamptz not null default now()
);

create unique index if not exists provider_accounts_provider_user_idx
    on provider_accounts (provider_id, user_id);

create table if not exists provider_claims (
    id serial primary key,
    provider_id integer not null references providers(id) on delete cascade,
    user_id uuid,
    claimant_name text not null,
    claimant_email text not null,
    claimant_phone text,
    relationship text not null,
    website text,
    proof_url text,
    message text,
    franchise_id integer references franchises(id) on delete set null,
    status text not null default 'pending',
    verification_token text,
    expires_at timestamptz,
    verified_at timestamptz,
    reviewed_by uuid,
    auto_approved boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists provider_claims_provider_idx on provider_claims (provider_id);
create unique index if not exists provider_claims_token_idx on provider_claims (verification_token);
create index if not exists provider_claims_franchise_idx on provider_claims (franchise_id);

create table if not exists provider_franchises (
    id serial primary key,
    provider_id integer not null references providers(id) on delete cascade,
    franchise_id integer not null references franchises(id) on delete cascade,
    external_id text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists provider_franchises_provider_franchise_idx
    on provider_franchises (provider_id, franchise_id);
create index if not exists provider_franchises_franchise_idx on provider_franchises (franchise_id);

create table if not exists provider_metrics (
    id serial primary key,
    provider_id integer not null references providers(id) on delete cascade,
    metric_date date not null,
    views integer not null default 0,
    website_clicks integer not null default 0,
    phone_clicks integer not null default 0,
    email_clicks integer not null default 0,
    created_at timestamptz not null default now()
);

create unique index if not exists provider_metrics_provider_date_idx
    on provider_metrics (provider_id, metric_date);

create table if not exists franchise_discount_codes (
    id serial primary key,
    franchise_id integer not null references franchises(id) on delete cascade,
    code text not null,
    description text,
    discount_percent numeric(5,2) not null default 10.0,
    max_redemptions integer,
    redemption_count integer not null default 0,
    stripe_coupon_id text,
    stripe_promotion_id text,
    status text not null default 'active',
    expires_at timestamptz,
    created_by_user_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists franchise_discount_codes_code_idx on franchise_discount_codes (code);
create index if not exists franchise_discount_codes_franchise_idx on franchise_discount_codes (franchise_id);

create table if not exists franchise_invites (
    id serial primary key,
    franchise_id integer not null references franchises(id) on delete cascade,
    invite_type text not null default 'link',
    email text,
    code text,
    source_campaign text,
    status text not null default 'pending',
    sent_at timestamptz,
    clicked_at timestamptz,
    converted_user_id uuid,
    metadata jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists franchise_invites_code_idx on franchise_invites (code);
create index if not exists franchise_invites_franchise_idx on franchise_invites (franchise_id);
