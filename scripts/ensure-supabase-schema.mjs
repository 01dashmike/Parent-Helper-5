/**
 * Ensures required Supabase tables and bucket exist, then verifies connectivity.
 */

import chalk from "chalk";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import path from "path";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(chalk.red("❌ Missing Supabase credentials in .env.local"));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { fetch });

const requiredTables = [
  "blog_posts_ai",
  "blog_topics_queue",
  "blog_views",
  "local_tips",
  "class_occurrences",
  "class_questions",
  "class_answers",
  "family_wallets",
  "family_members",
  "wallet_transactions",
  "feature_flags",
  "ai_cache",
  "analytics_events",
  "engagement_scores",
];

async function getExistingTables() {
  if (!DATABASE_URL) {
    console.warn(
      chalk.yellow(
        "⚠️ DATABASE_URL not set; attempting to inspect tables via Supabase metadata."
      )
    );
    const { data, error } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public");
    if (error) {
      console.error(chalk.red("❌ Unable to inspect tables:"), error.message);
      return [];
    }
    return data.map((row) => row.tablename);
  }

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(
      "select tablename from pg_tables where schemaname = 'public'"
    );
    return res.rows.map((row) => row.tablename);
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️ Unable to query tables via DATABASE_URL (${error.message}). Falling back to Supabase metadata.`
      )
    );
    const { data, error: metaError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public");
    if (metaError) {
      console.error(chalk.red("❌ Unable to inspect tables:"), metaError.message);
      return [];
    }
    return data.map((row) => row.tablename);
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function createTriggers() {
  if (!DATABASE_URL) {
    console.warn(chalk.yellow("⚠️ DATABASE_URL not set; skipping trigger creation."));
    return false;
  }

  const triggerDdl = `
    CREATE OR REPLACE FUNCTION check_class_occurrence_overlap()
    RETURNS TRIGGER AS $$
    DECLARE
      overlapping_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO overlapping_count
      FROM class_occurrences
      WHERE class_id = NEW.class_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
          (NEW.start_at >= start_at AND NEW.start_at < end_at)
          OR (NEW.end_at > start_at AND NEW.end_at <= end_at)
          OR (NEW.start_at <= start_at AND NEW.end_at >= end_at)
          OR (start_at <= NEW.start_at AND end_at >= NEW.end_at)
        );

      IF overlapping_count > 0 THEN
        RAISE EXCEPTION 'Overlapping occurrence detected for class_id %. An occurrence already exists between % and %',
          NEW.class_id, NEW.start_at, NEW.end_at;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_class_occurrence_overlap ON class_occurrences;
    CREATE TRIGGER prevent_class_occurrence_overlap
      BEFORE INSERT OR UPDATE ON class_occurrences
      FOR EACH ROW
      EXECUTE FUNCTION check_class_occurrence_overlap();
  `;

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(triggerDdl);
    console.log(chalk.green("✅ Overlap prevention trigger created successfully."));
    return true;
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Error creating trigger (may already exist): ${error.message}`));
    return false;
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function createViews() {
  if (!DATABASE_URL) {
    console.warn(chalk.yellow("⚠️ DATABASE_URL not set; skipping view creation."));
    return false;
  }

  const viewsDdl = `
    CREATE OR REPLACE VIEW v_provider_metrics AS
    SELECT 
        p.id AS provider_id,
        p.name AS provider_name,
        p.slug AS provider_slug,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' THEN b.total_paid ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' AND b.created_at >= NOW() - INTERVAL '7 days' THEN b.total_paid ELSE 0 END), 0) AS revenue_last_7_days,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' AND b.created_at >= NOW() - INTERVAL '30 days' THEN b.total_paid ELSE 0 END), 0) AS revenue_last_30_days,
        COALESCE(AVG(CASE WHEN pr.status = 'approved' THEN pr.rating::numeric END), 0) AS average_rating,
        COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) AS review_count,
        COUNT(DISTINCT cl.id) AS total_classes,
        COUNT(DISTINCT CASE WHEN cl.is_active = true THEN cl.id END) AS active_classes,
        MAX(b.created_at) AS last_booking_date,
        MAX(pr.created_at) AS last_review_date
    FROM providers p
    LEFT JOIN bookings b ON b.provider_id = p.id
    LEFT JOIN provider_reviews pr ON pr.provider_id = p.id
    LEFT JOIN classes cl ON cl.provider_id = p.id
    GROUP BY p.id, p.name, p.slug;

    CREATE OR REPLACE VIEW v_class_metrics AS
    SELECT 
        c.id AS class_id,
        c.name AS class_name,
        c.provider_id,
        COUNT(DISTINCT pm.id) AS total_views,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
        CASE 
            WHEN COUNT(DISTINCT pm.id) > 0 
            THEN ROUND((COUNT(DISTINCT b.id)::numeric / COUNT(DISTINCT pm.id)::numeric) * 100, 2)
            ELSE 0 
        END AS conversion_rate,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' THEN b.total_paid ELSE 0 END), 0) AS total_revenue,
        COALESCE(AVG(CASE WHEN pr.status = 'approved' THEN pr.rating::numeric END), 0) AS average_rating,
        COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) AS review_count,
        MAX(b.created_at) AS last_booking_date
    FROM classes c
    LEFT JOIN provider_metrics pm ON pm.provider_id = c.provider_id
    LEFT JOIN bookings b ON b.class_id = c.id
    LEFT JOIN provider_reviews pr ON pr.provider_id = c.provider_id
    GROUP BY c.id, c.name, c.provider_id;
  `;

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(viewsDdl);
    console.log(chalk.green("✅ Analytics views created successfully."));
    return true;
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Error creating views (may already exist): ${error.message}`));
    return false;
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function createMissingSchema(missing) {
  if (!DATABASE_URL) {
    console.error(
      chalk.red(
        "❌ Cannot create tables automatically without DATABASE_URL. Please provide it in .env.local."
      )
    );
    return false;
  }

  const ddl = `
    create extension if not exists "uuid-ossp";
    create table if not exists public.blog_posts_ai (
      id uuid primary key default uuid_generate_v4(),
      title text not null,
      slug text unique not null,
      excerpt text,
      content text,
      category text,
      locality text,
      author text default 'Parent Helper Editorial',
      status text default 'draft',
      sources jsonb default '[]'::jsonb,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    create table if not exists public.blog_topics_queue (
      id uuid primary key default uuid_generate_v4(),
      topic text not null,
      status text default 'pending',
      created_at timestamptz default now()
    );
    create table if not exists public.blog_views (
      id bigserial primary key,
      slug text not null,
      ip text,
      created_at timestamptz default now()
    );
    create table if not exists public.local_tips (
      id uuid primary key default uuid_generate_v4(),
      city_slug text not null,
      author text not null,
      role text default 'Parent Helper Expert' not null,
      content text not null,
      image_url text,
      is_featured boolean default false not null,
      is_published boolean default false not null,
      created_at timestamptz default now()
    );
    create index if not exists local_tips_city_slug_idx on public.local_tips(city_slug);
    create index if not exists local_tips_published_idx on public.local_tips(is_published, city_slug);
    create table if not exists public.class_occurrences (
      id uuid primary key default uuid_generate_v4(),
      class_id integer not null references public.classes(id) on delete cascade,
      start_at timestamptz not null,
      end_at timestamptz not null,
      capacity integer,
      price_cents integer,
      created_at timestamptz default now()
    );
    create index if not exists class_occurrences_class_idx on public.class_occurrences(class_id);
    create index if not exists class_occurrences_start_at_idx on public.class_occurrences(start_at);
    create index if not exists class_occurrences_class_start_idx on public.class_occurrences(class_id, start_at);
    create table if not exists public.class_questions (
      id uuid primary key default uuid_generate_v4(),
      class_id integer not null references public.classes(id) on delete cascade,
      user_id uuid not null,
      body text not null,
      status text default 'pending' not null,
      created_at timestamptz default now() not null
    );
    create index if not exists class_questions_class_idx on public.class_questions(class_id);
    create index if not exists class_questions_user_idx on public.class_questions(user_id);
    create index if not exists class_questions_status_idx on public.class_questions(status);
    create table if not exists public.class_answers (
      id uuid primary key default uuid_generate_v4(),
      question_id uuid not null references public.class_questions(id) on delete cascade,
      provider_id integer not null references public.providers(id) on delete cascade,
      body text not null,
      created_at timestamptz default now() not null
    );
    create index if not exists class_answers_question_idx on public.class_answers(question_id);
    create index if not exists class_answers_provider_idx on public.class_answers(provider_id);
    create table if not exists public.marketing_events (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid,
      event_type text not null,
      campaign_id text,
      metadata jsonb,
      created_at timestamptz default now() not null
    );
    create index if not exists marketing_events_user_idx on public.marketing_events(user_id);
    create index if not exists marketing_events_event_type_idx on public.marketing_events(event_type);
    create index if not exists marketing_events_campaign_idx on public.marketing_events(campaign_id);
    create index if not exists marketing_events_created_at_idx on public.marketing_events(created_at);
    create table if not exists public.family_wallets (
      id uuid primary key default uuid_generate_v4(),
      name text default 'My Family' not null,
      owner_id uuid not null,
      created_at timestamptz default now()
    );
    create index if not exists family_wallets_owner_idx on public.family_wallets(owner_id);
    create table if not exists public.family_members (
      id uuid primary key default uuid_generate_v4(),
      wallet_id uuid not null references public.family_wallets(id) on delete cascade,
      user_id uuid,
      role text not null check (role in ('parent','grandparent','guardian','child')),
      invited_email text,
      status text default 'invited' not null check (status in ('invited','active','left')),
      joined_at timestamptz,
      invite_token text,
      created_at timestamptz default now()
    );
    create index if not exists family_members_wallet_idx on public.family_members(wallet_id);
    create index if not exists family_members_user_idx on public.family_members(user_id);
    create index if not exists family_members_email_idx on public.family_members(invited_email);
    create index if not exists family_members_token_idx on public.family_members(invite_token);
    create unique index if not exists family_members_wallet_user_idx on public.family_members(wallet_id, user_id) where user_id is not null;
    create table if not exists public.wallet_transactions (
      id uuid primary key default uuid_generate_v4(),
      wallet_id uuid not null references public.family_wallets(id) on delete cascade,
      user_id uuid,
      type text not null check (type in ('credit','debit','gift','bonus')),
      amount_cents integer not null,
      source text,
      metadata jsonb,
      created_at timestamptz default now()
    );
    create index if not exists wallet_transactions_wallet_idx on public.wallet_transactions(wallet_id);
    create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id);
    create index if not exists wallet_transactions_created_at_idx on public.wallet_transactions(created_at);
    alter table public.blog_posts_ai enable row level security;
    alter table public.blog_topics_queue enable row level security;
    alter table public.blog_views enable row level security;
    alter table public.local_tips enable row level security;
    alter table public.class_occurrences enable row level security;
    alter table public.class_questions enable row level security;
    alter table public.class_answers enable row level security;
    alter table public.marketing_events enable row level security;
    alter table public.family_wallets enable row level security;
    alter table public.family_members enable row level security;
    alter table public.wallet_transactions enable row level security;
    create table if not exists public.feature_flags (
      id uuid primary key default uuid_generate_v4(),
      flag_key text not null unique,
      flag_value boolean default false not null,
      description text,
      updated_at timestamptz default now(),
      updated_by text
    );
    create index if not exists feature_flags_key_idx on public.feature_flags(flag_key);
    create table if not exists public.ai_cache (
      id uuid primary key default uuid_generate_v4(),
      cache_key text not null,
      cache_value jsonb not null,
      expires_at timestamptz not null,
      created_at timestamptz default now()
    );
    create index if not exists ai_cache_key_idx on public.ai_cache(cache_key);
    create index if not exists ai_cache_expires_at_idx on public.ai_cache(expires_at);
    alter table public.feature_flags enable row level security;
    alter table public.ai_cache enable row level security;
    create table if not exists public.provider_analytics_weekly (
      id serial primary key,
      provider_id integer not null references public.providers(id) on delete cascade,
      week_start date not null,
      views integer default 0 not null,
      bookings integer default 0 not null,
      conversion_rate numeric(5, 2) default 0.00 not null,
      search_appearances integer default 0 not null,
      reviews integer default 0 not null,
      profile_health_score integer default 0 not null,
      revenue_cents integer default 0 not null,
      created_at timestamptz default now() not null
    );
    create unique index if not exists provider_analytics_weekly_provider_week_idx on public.provider_analytics_weekly(provider_id, week_start);
    create index if not exists provider_analytics_weekly_week_start_idx on public.provider_analytics_weekly(week_start);
    alter table public.provider_analytics_weekly enable row level security;
    create table if not exists public.provider_growth_score (
      id uuid primary key default gen_random_uuid(),
      provider_id integer not null references public.providers(id) on delete cascade,
      week_start date not null,
      growth_score real not null,
      metrics_json jsonb not null,
      next_best_action text,
      created_at timestamptz default now() not null
    );
    create unique index if not exists provider_growth_score_provider_week_idx on public.provider_growth_score(provider_id, week_start);
    create index if not exists provider_growth_score_provider_idx on public.provider_growth_score(provider_id);
    create index if not exists provider_growth_score_week_start_idx on public.provider_growth_score(week_start);
    alter table public.provider_growth_score enable row level security;
    create table if not exists public.provider_email_tests (
      id uuid primary key default gen_random_uuid(),
      provider_id integer not null references public.providers(id) on delete cascade,
      variant_id text not null,
      sent_at timestamptz default now() not null,
      open_rate real,
      click_rate real,
      conversion boolean default false not null,
      created_at timestamptz default now() not null
    );
    create index if not exists provider_email_tests_provider_idx on public.provider_email_tests(provider_id);
    create index if not exists provider_email_tests_sent_at_idx on public.provider_email_tests(sent_at);
    alter table public.provider_email_tests enable row level security;
    create table if not exists public.provider_visibility_boosts (
      id uuid primary key default gen_random_uuid(),
      provider_id integer not null references public.providers(id) on delete cascade,
      boost_type text not null,
      multiplier real not null,
      expires_at timestamptz,
      created_at timestamptz default now() not null
    );
    create unique index if not exists provider_visibility_boosts_provider_active_idx on public.provider_visibility_boosts(provider_id);
    create index if not exists provider_visibility_boosts_provider_idx on public.provider_visibility_boosts(provider_id);
    create index if not exists provider_visibility_boosts_expires_at_idx on public.provider_visibility_boosts(expires_at);
    alter table public.provider_visibility_boosts enable row level security;
    create table if not exists public.provider_referral_analytics (
      id uuid primary key default gen_random_uuid(),
      provider_id integer not null references public.providers(id) on delete cascade,
      referral_id uuid references public.referrals(id) on delete set null,
      event_type text not null,
      points integer not null,
      created_at timestamptz default now() not null
    );
    create index if not exists provider_referral_analytics_provider_idx on public.provider_referral_analytics(provider_id);
    create index if not exists provider_referral_analytics_referral_idx on public.provider_referral_analytics(referral_id);
    create index if not exists provider_referral_analytics_created_at_idx on public.provider_referral_analytics(created_at);
    alter table public.provider_referral_analytics enable row level security;
    create table if not exists public.booking_occurrences (
      id serial primary key,
      booking_id integer not null references public.bookings(id) on delete cascade,
      occurrence_id integer not null references public.session_instances(id) on delete restrict,
      created_at timestamptz default now() not null
    );
    create index if not exists booking_occurrences_booking_idx on public.booking_occurrences(booking_id);
    create index if not exists booking_occurrences_occurrence_idx on public.booking_occurrences(occurrence_id);
    alter table public.booking_occurrences enable row level security;
    create table if not exists public.provider_growth_score (
      id uuid primary key default uuid_generate_v4(),
      provider_id integer not null references public.providers(id) on delete cascade,
      week_start date not null,
      growth_score real not null,
      metrics_json jsonb not null,
      next_best_action text,
      created_at timestamptz default now() not null
    );
    create index if not exists provider_growth_score_provider_idx on public.provider_growth_score(provider_id);
    create index if not exists provider_growth_score_week_start_idx on public.provider_growth_score(week_start);
    create unique index if not exists provider_growth_score_provider_week_idx on public.provider_growth_score(provider_id, week_start);
    create table if not exists public.provider_email_tests (
      id uuid primary key default uuid_generate_v4(),
      provider_id integer not null references public.providers(id) on delete cascade,
      variant_id text not null check (variant_id in ('A','B')),
      sent_at timestamptz default now() not null,
      open_rate real,
      click_rate real,
      conversion boolean default false not null,
      created_at timestamptz default now() not null
    );
    create index if not exists provider_email_tests_provider_idx on public.provider_email_tests(provider_id);
    create index if not exists provider_email_tests_sent_at_idx on public.provider_email_tests(sent_at);
    alter table public.provider_growth_score enable row level security;
    alter table public.provider_email_tests enable row level security;
    -- Add loyalty tier columns to engagement_scores if they don't exist
    do $$
    begin
      if not exists (select 1 from information_schema.columns where table_name = 'engagement_scores' and column_name = 'loyalty_tier') then
        alter table public.engagement_scores add column loyalty_tier text default 'bronze' not null check (loyalty_tier in ('bronze','silver','gold','platinum'));
        create index if not exists engagement_scores_loyalty_tier_idx on public.engagement_scores(loyalty_tier);
      end if;
      if not exists (select 1 from information_schema.columns where table_name = 'engagement_scores' and column_name = 'streak_days') then
        alter table public.engagement_scores add column streak_days integer default 0 not null;
      end if;
      if not exists (select 1 from information_schema.columns where table_name = 'engagement_scores' and column_name = 'last_streak_date') then
        alter table public.engagement_scores add column last_streak_date date;
      end if;
    end $$;
    create table if not exists public.analytics_events (
      id uuid primary key default uuid_generate_v4(),
      user_id uuid,
      family_id uuid,
      session_id uuid not null,
      event_name text not null,
      event_props jsonb default '{}'::jsonb not null,
      path text,
      referrer text,
      user_agent text,
      created_at timestamptz default now() not null
    );
    create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
    create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
    create index if not exists analytics_events_user_id_created_at_idx on public.analytics_events(user_id, created_at desc);
    create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
    create table if not exists public.engagement_scores (
      family_id uuid primary key,
      visits_count integer default 0 not null,
      avg_session_time integer default 0 not null,
      last_active timestamptz default now() not null,
      recs_clicked integer default 0 not null,
      blog_reads integer default 0 not null,
      conversions integer default 0 not null,
      loyalty_score numeric(5,2) default 0.00 not null,
      updated_at timestamptz default now() not null
    );
    create index if not exists engagement_scores_loyalty_score_idx on public.engagement_scores(loyalty_score);
    create index if not exists engagement_scores_last_active_idx on public.engagement_scores(last_active);
    alter table public.analytics_events enable row level security;
    alter table public.engagement_scores enable row level security;
  `;

  const client = new PgClient({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(ddl);
    return true;
  } catch (error) {
    console.error(chalk.red("❌ Error creating tables:"), error.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch (err) {
      // ignore
    }
  }
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket("blog");
  if (error && !error.message?.toLowerCase().includes("not found")) {
    console.error(chalk.red("❌ Error checking storage bucket:"), error.message);
    return;
  }
  if (!data) {
    const { error: createError } = await supabase.storage.createBucket("blog", {
      public: true,
    });
    if (createError) {
      console.error(chalk.red("❌ Failed to create 'blog' bucket:"), createError.message);
    } else {
      console.log(chalk.green("✅ Created 'blog' storage bucket."));
    }
  } else {
    console.log(chalk.green("✅ 'blog' storage bucket exists."));
  }
}

async function verifyKey(label, key) {
  if (!key) {
    console.warn(chalk.yellow(`⚠️ Missing ${label}.`));
    return false;
  }
  try {
    const client = createClient(SUPABASE_URL, key, { fetch });
    const { error } = await client.from("blog_posts_ai").select("id").limit(1);
    if (error) throw error;
    console.log(chalk.green(`✅ Verified Supabase access with ${label}.`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${label} failed:`), error.message);
    return false;
  }
}

async function run() {
  console.log(chalk.cyan("🔍 Checking Supabase schema..."));
  const existing = await getExistingTables();
  const missing = requiredTables.filter((table) => !existing.includes(table));

  let schemaOk = true;

  if (missing.length === 0) {
    console.log(chalk.green("✅ All blog-related tables already exist."));
  } else {
    console.log(chalk.yellow(`🧩 Creating missing tables: ${missing.join(", ")}`));
    const ok = await createMissingSchema(missing);
    if (ok) {
      console.log(chalk.green("✅ Missing tables created successfully."));
    } else {
      console.error(chalk.red("💥 Unable to ensure tables. See errors above."));
      schemaOk = false;
    }
  }

  await ensureBucket();

  // Create analytics views
  await createViews();

  // Create triggers
  await createTriggers();

  console.log(chalk.cyan("\n🔐 Verifying Supabase credentials..."));
  const serviceOk = await verifyKey("SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
  const anonOk = await verifyKey("ANON_KEY", ANON_KEY);

  if (!schemaOk) {
    console.error(
      chalk.red(
        "\n💥 Supabase schema could not be verified or repaired automatically. Check DATABASE_URL connectivity or create tables manually."
      )
    );
  }

  const connectionOk = serviceOk || anonOk;
  if (!connectionOk) {
    console.error(
      chalk.red(
        "\n💥 No valid Supabase connection established. Check URL/keys or resume your Supabase project."
      )
    );
  }

  if (schemaOk && connectionOk) {
    console.log(chalk.blue("\n🏁 Supabase schema verified."));
    process.exit(0);
  }

  process.exit(1);
}

run().catch((error) => {
  console.error(chalk.red("💥 Schema check failed:"), error.message ?? error);
  process.exit(1);
});
