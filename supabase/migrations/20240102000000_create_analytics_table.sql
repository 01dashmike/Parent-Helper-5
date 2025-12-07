-- Create analytics_events table
-- Privacy-first analytics for Parent Helper

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- RLS Policy: Prevent public writes (only server can insert)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert (no public access)
CREATE POLICY "Service role can insert analytics"
  ON analytics_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admin can read (add your admin check here)
CREATE POLICY "Admin can read analytics"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to automatically delete events older than 90 days
CREATE OR REPLACE FUNCTION delete_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Schedule the cleanup function to run daily (requires pg_cron extension)
-- If you have pg_cron enabled, uncomment:
-- SELECT cron.schedule('delete-old-analytics', '0 2 * * *', 'SELECT delete_old_analytics_events();');

-- Alternative: Create a manual cleanup function that can be called via cron or API
COMMENT ON FUNCTION delete_old_analytics_events() IS 'Deletes analytics events older than 90 days for GDPR compliance';


