-- Referral Analytics View
-- Creates a materialized view for referral analytics with weekly aggregation
-- Safe to run even if tables don't exist yet

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.referral_analytics_view;
DROP VIEW IF EXISTS public.referral_analytics_view;

-- Create the analytics view (only if referrals table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    EXECUTE '
    CREATE OR REPLACE VIEW public.referral_analytics_view AS
    SELECT
        r.referral_type,
        r.reward_status,
        date_trunc(''week'', r.created_at) AS week,
        COUNT(*) AS referrals,
        COUNT(r.converted_at) AS conversions,
        SUM(COALESCE(rew.value_cents, 0)) / 100.0 AS total_reward_value
    FROM public.referrals r
    LEFT JOIN public.rewards rew 
        ON rew.metadata->>''referral_id'' = r.id::text
        AND rew.source = ''referral''
    GROUP BY 
        r.referral_type,
        r.reward_status,
        date_trunc(''week'', r.created_at)';
  END IF;
END $$;

-- Create index for better query performance (on underlying tables, only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    CREATE INDEX IF NOT EXISTS referrals_created_at_idx ON public.referrals(created_at);
    CREATE INDEX IF NOT EXISTS referrals_type_status_idx ON public.referrals(referral_type, reward_status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
    CREATE INDEX IF NOT EXISTS rewards_metadata_referral_idx ON public.rewards USING gin(metadata jsonb_path_ops);
  END IF;
END $$;

-- Grant access to service role (only if view exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'referral_analytics_view') THEN
    GRANT SELECT ON public.referral_analytics_view TO service_role;
  END IF;
END $$;

-- Create a materialized view version for better performance (refresh manually or via cron)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
    DROP MATERIALIZED VIEW IF EXISTS public.referral_analytics_materialized;
    
    EXECUTE '
    CREATE MATERIALIZED VIEW public.referral_analytics_materialized AS
    SELECT
        r.referral_type,
        r.reward_status,
        date_trunc(''week'', r.created_at) AS week,
        COUNT(*) AS referrals,
        COUNT(r.converted_at) AS conversions,
        SUM(COALESCE(rew.value_cents, 0)) / 100.0 AS total_reward_value
    FROM public.referrals r
    LEFT JOIN public.rewards rew 
        ON rew.metadata->>''referral_id'' = r.id::text
        AND rew.source = ''referral''
    GROUP BY 
        r.referral_type,
        r.reward_status,
        date_trunc(''week'', r.created_at)';
  END IF;
END $$;

-- Create index on materialized view (only if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'referral_analytics_materialized') THEN
    CREATE INDEX IF NOT EXISTS referral_analytics_materialized_week_idx 
        ON public.referral_analytics_materialized(week, referral_type, reward_status);
    
    GRANT SELECT ON public.referral_analytics_materialized TO service_role;
  END IF;
END $$;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_referral_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'referral_analytics_materialized') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.referral_analytics_materialized;
    END IF;
END;
$$;

