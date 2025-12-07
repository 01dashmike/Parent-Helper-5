-- Create blocked_ips table for IP blocking
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_ips_created_at ON blocked_ips(created_at);

-- Enable RLS
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read blocked IPs
CREATE POLICY "blocked_ips_admin_read" ON blocked_ips
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: System can insert/update blocked IPs (service role)
CREATE POLICY "blocked_ips_insert" ON blocked_ips
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "blocked_ips_update" ON blocked_ips
  FOR UPDATE
  USING (true);

CREATE POLICY "blocked_ips_delete" ON blocked_ips
  FOR DELETE
  USING (true);

