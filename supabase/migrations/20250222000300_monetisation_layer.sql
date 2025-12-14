-- Monetisation Layer Migration
-- Creates all tables for the complete monetization system

-- Provider Subscriptions (main subscription records)
create table if not exists provider_subscriptions (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false not null,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists provider_subscriptions_provider_id_idx on provider_subscriptions(provider_id);
create index if not exists provider_subscriptions_stripe_customer_id_idx on provider_subscriptions(stripe_customer_id);
create index if not exists provider_subscriptions_stripe_subscription_id_idx on provider_subscriptions(stripe_subscription_id);
create index if not exists provider_subscriptions_status_idx on provider_subscriptions(status);
create index if not exists provider_subscriptions_current_period_end_idx on provider_subscriptions(current_period_end);

-- Provider Subscription Items (line items within a subscription)
create table if not exists provider_subscription_items (
  id bigserial primary key,
  subscription_id bigint not null references provider_subscriptions(id) on delete cascade,
  stripe_price_id text not null,
  stripe_subscription_item_id text unique,
  product_type text not null check (product_type in ('featured_listing', 'verified_badge', 'premium_analytics', 'franchise_boost')),
  quantity integer default 1 not null,
  unit_amount_cents integer,
  currency text default 'gbp' not null,
  billing_period text check (billing_period in ('monthly', 'quarterly', 'annually')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists provider_subscription_items_subscription_id_idx on provider_subscription_items(subscription_id);
create index if not exists provider_subscription_items_stripe_price_id_idx on provider_subscription_items(stripe_price_id);
create index if not exists provider_subscription_items_product_type_idx on provider_subscription_items(product_type);

-- Provider Features (active entitlements)
create table if not exists provider_features (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  feature_type text not null check (feature_type in ('featured_listing', 'verified_badge', 'premium_analytics', 'franchise_boost')),
  subscription_item_id bigint references provider_subscription_items(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  starts_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists provider_features_provider_id_idx on provider_features(provider_id);
create index if not exists provider_features_feature_type_idx on provider_features(feature_type);
create index if not exists provider_features_status_idx on provider_features(status);
create index if not exists provider_features_expires_at_idx on provider_features(expires_at);
create unique index if not exists provider_features_provider_feature_active_idx on provider_features(provider_id, feature_type) where status = 'active';

-- Provider Featured Listings (detailed featured listing data)
create table if not exists provider_featured_listings (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  feature_id bigint references provider_features(id) on delete cascade,
  priority integer default 0 not null,
  target_town text,
  target_category text,
  target_age text,
  daily_cap integer,
  daily_spend_cents integer default 0,
  monthly_budget_cents integer,
  starts_at timestamp with time zone default now() not null,
  ends_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists provider_featured_listings_provider_id_idx on provider_featured_listings(provider_id);
create index if not exists provider_featured_listings_feature_id_idx on provider_featured_listings(feature_id);
create index if not exists provider_featured_listings_starts_at_idx on provider_featured_listings(starts_at);
create index if not exists provider_featured_listings_ends_at_idx on provider_featured_listings(ends_at);

-- Provider Verified Status
create table if not exists provider_verified_status (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  feature_id bigint references provider_features(id) on delete cascade,
  verified_at timestamp with time zone default now() not null,
  verified_by uuid references users(id) on delete set null,
  verification_notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(provider_id)
);

create index if not exists provider_verified_status_provider_id_idx on provider_verified_status(provider_id);
create index if not exists provider_verified_status_feature_id_idx on provider_verified_status(feature_id);

-- Franchise Bulk Products (franchisor-level products)
create table if not exists franchise_bulk_products (
  id bigserial primary key,
  franchise_id integer not null references franchises(id) on delete cascade,
  product_type text not null check (product_type in ('featured_listing', 'verified_badge')),
  stripe_price_id text not null,
  stripe_subscription_item_id text,
  quantity integer not null, -- Number of locations that can be featured
  allocated_count integer default 0 not null, -- How many are currently allocated
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  starts_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists franchise_bulk_products_franchise_id_idx on franchise_bulk_products(franchise_id);
create index if not exists franchise_bulk_products_product_type_idx on franchise_bulk_products(product_type);
create index if not exists franchise_bulk_products_status_idx on franchise_bulk_products(status);

-- Franchise Provider Allocations (which providers get the bulk boost)
create table if not exists franchise_provider_allocations (
  id bigserial primary key,
  bulk_product_id bigint not null references franchise_bulk_products(id) on delete cascade,
  provider_id integer not null references providers(id) on delete cascade,
  feature_id bigint references provider_features(id) on delete cascade,
  allocated_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  unique(bulk_product_id, provider_id)
);

create index if not exists franchise_provider_allocations_bulk_product_id_idx on franchise_provider_allocations(bulk_product_id);
create index if not exists franchise_provider_allocations_provider_id_idx on franchise_provider_allocations(provider_id);
create index if not exists franchise_provider_allocations_feature_id_idx on franchise_provider_allocations(feature_id);

-- Analytics Preview Locks (for free preview mode)
create table if not exists analytics_preview_locks (
  id bigserial primary key,
  provider_id integer not null references providers(id) on delete cascade,
  metric_type text not null, -- 'ranking', 'competitor_comparison', 'traffic_insights', etc.
  is_locked boolean default true not null, -- true = preview/masked, false = unlocked
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(provider_id, metric_type)
);

create index if not exists analytics_preview_locks_provider_id_idx on analytics_preview_locks(provider_id);
create index if not exists analytics_preview_locks_metric_type_idx on analytics_preview_locks(metric_type);

-- Monetisation Logs (audit trail)
create table if not exists monetisation_logs (
  id bigserial primary key,
  provider_id integer references providers(id) on delete set null,
  franchise_id integer references franchises(id) on delete set null,
  event_type text not null, -- 'subscription_created', 'feature_activated', 'payment_succeeded', etc.
  event_data jsonb default '{}'::jsonb,
  stripe_event_id text,
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

create index if not exists monetisation_logs_provider_id_idx on monetisation_logs(provider_id);
create index if not exists monetisation_logs_franchise_id_idx on monetisation_logs(franchise_id);
create index if not exists monetisation_logs_event_type_idx on monetisation_logs(event_type);
create index if not exists monetisation_logs_created_at_idx on monetisation_logs(created_at);
create index if not exists monetisation_logs_stripe_event_id_idx on monetisation_logs(stripe_event_id);

-- Revenue Events (for ARR/MRR calculations)
create table if not exists revenue_events (
  id bigserial primary key,
  provider_id integer references providers(id) on delete set null,
  franchise_id integer references franchises(id) on delete set null,
  event_type text not null check (event_type in ('subscription_started', 'subscription_renewed', 'subscription_canceled', 'subscription_upgraded', 'subscription_downgraded', 'one_time_payment')),
  amount_cents integer not null,
  currency text default 'gbp' not null,
  billing_period text check (billing_period in ('monthly', 'quarterly', 'annually')),
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  event_date date not null,
  created_at timestamp with time zone default now() not null
);

create index if not exists revenue_events_provider_id_idx on revenue_events(provider_id);
create index if not exists revenue_events_franchise_id_idx on revenue_events(franchise_id);
create index if not exists revenue_events_event_type_idx on revenue_events(event_type);
create index if not exists revenue_events_event_date_idx on revenue_events(event_date);

-- Update triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger provider_subscriptions_updated_at before update on provider_subscriptions
  for each row execute function update_updated_at_column();

create trigger provider_subscription_items_updated_at before update on provider_subscription_items
  for each row execute function update_updated_at_column();

create trigger provider_features_updated_at before update on provider_features
  for each row execute function update_updated_at_column();

create trigger provider_featured_listings_updated_at before update on provider_featured_listings
  for each row execute function update_updated_at_column();

create trigger provider_verified_status_updated_at before update on provider_verified_status
  for each row execute function update_updated_at_column();

create trigger franchise_bulk_products_updated_at before update on franchise_bulk_products
  for each row execute function update_updated_at_column();

create trigger analytics_preview_locks_updated_at before update on analytics_preview_locks
  for each row execute function update_updated_at_column();








