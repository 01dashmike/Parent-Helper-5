-- Growth Metrics Materialized View
-- Aggregates data from wallet_transactions, referrals, rewards, booking_payments, and marketing_events
-- Safe to run even if some tables don't exist yet

-- First, create a helper function to get all weeks with data
CREATE OR REPLACE FUNCTION get_weeks_with_data()
RETURNS TABLE(week_start timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT date_trunc('week', created_at) AS week_start
  FROM (
    SELECT created_at FROM public.booking_payments WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_payments')
    UNION ALL
    SELECT created_at FROM public.wallet_transactions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions')
    UNION ALL
    SELECT created_at FROM public.referrals WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals')
    UNION ALL
    SELECT created_at FROM public.marketing_events WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_events')
  ) AS all_dates
  WHERE created_at IS NOT NULL
  ORDER BY week_start DESC
  LIMIT 52;
END;
$$ LANGUAGE plpgsql;

-- Create the materialized view (guarded against missing tables)
DO $$
BEGIN
  -- Only create if booking_payments exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_payments') THEN
    DROP MATERIALIZED VIEW IF EXISTS public.growth_metrics_view;
    
    EXECUTE '
    CREATE MATERIALIZED VIEW public.growth_metrics_view AS
    WITH week_series AS (
      SELECT week_start FROM get_weeks_with_data()
    ),
    booking_metrics AS (
      SELECT
        date_trunc(''week'', bp.created_at) AS week,
        COUNT(DISTINCT sb.email) AS active_users,
        COALESCE(SUM(bp.amount_cents), 0) / 100.0 AS total_revenue
      FROM public.booking_payments bp
      LEFT JOIN public.simple_bookings sb ON sb.id = bp.booking_id
      GROUP BY date_trunc(''week'', bp.created_at)
    ),
    wallet_metrics AS (
      SELECT
        date_trunc(''week'', created_at) AS week,
        COALESCE(SUM(CASE WHEN type = ''credit'' THEN amount_cents ELSE 0 END), 0) / 100.0 AS wallet_credits
      FROM public.wallet_transactions
      GROUP BY date_trunc(''week'', created_at)
    ),
    referral_metrics AS (
      SELECT
        date_trunc(''week'', created_at) AS week,
        COUNT(DISTINCT id) AS total_referrals,
        COUNT(DISTINCT CASE WHEN converted_at IS NOT NULL THEN id END) AS conversions
      FROM public.referrals
      GROUP BY date_trunc(''week'', created_at)
    ),
    marketing_metrics AS (
      SELECT
        date_trunc(''week'', created_at) AS week,
        COUNT(DISTINCT CASE WHEN event_type = ''email_sent'' THEN id END) AS emails_sent,
        COUNT(DISTINCT CASE WHEN event_type = ''email_open'' THEN id END) AS emails_opened,
        COUNT(DISTINCT CASE WHEN event_type = ''email_click'' THEN id END) AS emails_clicked,
        COUNT(DISTINCT CASE WHEN event_type = ''converted'' THEN id END) AS marketing_conversions
      FROM public.marketing_events
      GROUP BY date_trunc(''week'', created_at)
    )
    SELECT
      ws.week_start AS week,
      COALESCE(bm.active_users, 0) AS active_users,
      COALESCE(bm.total_revenue, 0) AS total_revenue,
      COALESCE(wm.wallet_credits, 0) AS wallet_credits,
      COALESCE(rm.total_referrals, 0) AS total_referrals,
      COALESCE(rm.conversions, 0) AS conversions,
      COALESCE(mm.emails_sent, 0) AS emails_sent,
      COALESCE(mm.emails_opened, 0) AS emails_opened,
      COALESCE(mm.emails_clicked, 0) AS emails_clicked,
      COALESCE(mm.marketing_conversions, 0) AS marketing_conversions
    FROM week_series ws
    LEFT JOIN booking_metrics bm ON bm.week = ws.week_start
    LEFT JOIN wallet_metrics wm ON wm.week = ws.week_start
    LEFT JOIN referral_metrics rm ON rm.week = ws.week_start
    LEFT JOIN marketing_metrics mm ON mm.week = ws.week_start
    ORDER BY ws.week_start DESC';
  END IF;
END $$;

-- Index for faster queries (only if view exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'growth_metrics_view') THEN
    CREATE INDEX IF NOT EXISTS growth_metrics_view_week_idx ON public.growth_metrics_view(week);
  END IF;
END $$;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_growth_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'growth_metrics_view') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.growth_metrics_view;
  END IF;
END;
$$;

-- Function to get top wallets by activity (guarded against missing tables)
CREATE OR REPLACE FUNCTION get_top_wallets(limit_count integer DEFAULT 10)
RETURNS TABLE(
  wallet_id uuid,
  owner_id uuid,
  total_credits numeric,
  total_transactions bigint,
  member_count bigint
) AS $$
BEGIN
  -- Only execute if family_wallets exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_wallets') THEN
    RETURN QUERY
    SELECT
      fw.id AS wallet_id,
      fw.owner_user_id AS owner_id,
      COALESCE(SUM(CASE WHEN wt.type = 'credit' THEN wt.amount_cents ELSE 0 END), 0) / 100.0 AS total_credits,
      COUNT(DISTINCT wt.id) AS total_transactions,
      COUNT(DISTINCT fm.id) AS member_count
    FROM public.family_wallets fw
    LEFT JOIN public.wallet_transactions wt ON wt.wallet_id IN (SELECT id FROM public.wallet_accounts WHERE family_wallet_id = fw.id)
    LEFT JOIN public.family_wallet_members fm ON fm.family_wallet_id = fw.id
    GROUP BY fw.id, fw.owner_user_id
    ORDER BY total_credits DESC, total_transactions DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (only if view exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'growth_metrics_view') THEN
    GRANT SELECT ON public.growth_metrics_view TO authenticated;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION refresh_growth_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_wallets(integer) TO authenticated;

