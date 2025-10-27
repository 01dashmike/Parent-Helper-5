CREATE TABLE IF NOT EXISTS public.newsletter_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  impressions INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversion DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (signups::decimal / impressions) * 100 ELSE 0 END
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_newsletter_summary()
RETURNS void AS $$
BEGIN
  INSERT INTO public.newsletter_summary (date, impressions, signups)
  SELECT 
    DATE(created_at) AS date,
    COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
    COUNT(*) FILTER (WHERE event_type = 'signup') AS signups
  FROM public.newsletter_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ON CONFLICT (date)
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    signups = EXCLUDED.signups;
END;
$$ LANGUAGE plpgsql;

SELECT update_newsletter_summary();
