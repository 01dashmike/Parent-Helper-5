ALTER TABLE public.newsletter_events
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

ALTER TABLE public.class_views
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

CREATE TABLE IF NOT EXISTS public.campaign_summary (
  id SERIAL PRIMARY KEY,
  utm_campaign TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  views INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversion DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN views > 0 THEN (signups::decimal / views) * 100 ELSE 0 END
  ) STORED,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (utm_campaign, utm_source, utm_medium)
);

CREATE OR REPLACE FUNCTION update_campaign_summary()
RETURNS void AS $$
BEGIN
  INSERT INTO public.campaign_summary (utm_campaign, utm_source, utm_medium, views, signups)
  SELECT
    COALESCE(utm_campaign, '(none)') AS utm_campaign,
    COALESCE(utm_source, '(none)') AS utm_source,
    COALESCE(utm_medium, '(none)') AS utm_medium,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS views,
    COUNT(*) FILTER (WHERE event_type = 'signup') AS signups
  FROM public.newsletter_events
  GROUP BY utm_campaign, utm_source, utm_medium
  ON CONFLICT (utm_campaign, utm_source, utm_medium) DO UPDATE
    SET views = EXCLUDED.views,
        signups = EXCLUDED.signups,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
