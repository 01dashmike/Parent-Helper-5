-- AI Growth Insights Reports Table
-- Stores weekly AI-generated insights and recommendations

CREATE TABLE IF NOT EXISTS insights_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  summary_text text NOT NULL,
  ai_actions text NOT NULL, -- JSON array of recommended actions
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS insights_reports_week_start_idx ON insights_reports(week_start DESC);
CREATE INDEX IF NOT EXISTS insights_reports_created_at_idx ON insights_reports(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_insights_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_insights_reports_updated_at
  BEFORE UPDATE ON insights_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_reports_updated_at();

-- RLS Policies
ALTER TABLE insights_reports ENABLE ROW LEVEL SECURITY;

-- Service role can manage all reports
CREATE POLICY "Service role can manage insights reports"
  ON insights_reports
  FOR ALL
  USING ( auth.role() = 'service_role' )
  WITH CHECK ( auth.role() = 'service_role' );

-- Authenticated users can view reports (for admin dashboard)
CREATE POLICY "Authenticated users can view insights reports"
  ON insights_reports
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

