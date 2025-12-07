-- Provider verification system for trust layer
-- Stores verification documents (ID, insurance, qualifications) and admin review status

CREATE TABLE IF NOT EXISTS provider_verifications (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- User who submitted the verification
  
  -- Verification document types
  id_document_url TEXT, -- URL to ID document in storage
  id_document_status TEXT DEFAULT 'pending' CHECK (id_document_status IN ('pending', 'approved', 'rejected')),
  id_document_reviewed_at TIMESTAMPTZ,
  id_document_reviewed_by UUID, -- Admin user who reviewed
  
  insurance_document_url TEXT, -- URL to insurance document in storage
  insurance_document_status TEXT DEFAULT 'pending' CHECK (insurance_document_status IN ('pending', 'approved', 'rejected')),
  insurance_document_reviewed_at TIMESTAMPTZ,
  insurance_document_reviewed_by UUID,
  
  qualifications_document_url TEXT, -- URL to qualifications document in storage
  qualifications_document_status TEXT DEFAULT 'pending' CHECK (qualifications_document_status IN ('pending', 'approved', 'rejected')),
  qualifications_document_reviewed_at TIMESTAMPTZ,
  qualifications_document_reviewed_by UUID,
  
  -- Overall verification status
  overall_status TEXT DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  
  -- Rejection reason (if any document is rejected)
  rejection_reason TEXT,
  rejection_details JSONB, -- Structured rejection details per document type
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional expiration date for verifications
  notes TEXT, -- Admin notes
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS provider_verifications_provider_idx ON provider_verifications(provider_id);
CREATE INDEX IF NOT EXISTS provider_verifications_user_idx ON provider_verifications(user_id);
CREATE INDEX IF NOT EXISTS provider_verifications_status_idx ON provider_verifications(overall_status);
CREATE INDEX IF NOT EXISTS provider_verifications_submitted_at_idx ON provider_verifications(submitted_at DESC);

-- Unique constraint: one active verification per provider
-- (allows multiple historical verifications, but only one pending/in_review at a time)
CREATE UNIQUE INDEX IF NOT EXISTS provider_verifications_active_provider_idx 
  ON provider_verifications(provider_id) 
  WHERE overall_status IN ('pending', 'in_review', 'approved');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER provider_verifications_updated_at
  BEFORE UPDATE ON provider_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_verifications_updated_at();

-- Function to automatically set overall_status based on individual document statuses
CREATE OR REPLACE FUNCTION update_provider_verification_overall_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all three documents are approved, set overall_status to approved
  IF NEW.id_document_status = 'approved' 
     AND NEW.insurance_document_status = 'approved' 
     AND NEW.qualifications_document_status = 'approved' THEN
    NEW.overall_status = 'approved';
    NEW.reviewed_at = NOW();
  -- If any document is rejected, set overall_status to rejected
  ELSIF NEW.id_document_status = 'rejected' 
        OR NEW.insurance_document_status = 'rejected' 
        OR NEW.qualifications_document_status = 'rejected' THEN
    NEW.overall_status = 'rejected';
    NEW.reviewed_at = NOW();
  -- If at least one document is pending, set to pending
  ELSIF NEW.id_document_status = 'pending' 
        OR NEW.insurance_document_status = 'pending' 
        OR NEW.qualifications_document_status = 'pending' THEN
    NEW.overall_status = 'pending';
  -- Otherwise, set to in_review
  ELSE
    NEW.overall_status = 'in_review';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update overall_status
CREATE TRIGGER provider_verifications_update_overall_status
  BEFORE INSERT OR UPDATE ON provider_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_verification_overall_status();

-- Add verification status to providers table for quick lookup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE providers ADD COLUMN verification_status TEXT DEFAULT 'not_verified' 
      CHECK (verification_status IN ('not_verified', 'pending', 'in_review', 'verified', 'rejected', 'expired'));
  END IF;
END $$;

-- Index for verification status on providers
CREATE INDEX IF NOT EXISTS providers_verification_status_idx ON providers(verification_status);

-- Function to sync verification status to providers table
CREATE OR REPLACE FUNCTION sync_provider_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers 
  SET verification_status = NEW.overall_status
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync verification status
CREATE TRIGGER sync_provider_verification_status_trigger
  AFTER INSERT OR UPDATE OF overall_status ON provider_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_provider_verification_status();

-- Enable RLS
ALTER TABLE provider_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Providers can view their own verifications
CREATE POLICY "Providers can view own verifications"
  ON provider_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_accounts pa
      WHERE pa.provider_id = provider_verifications.provider_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- Providers can insert their own verifications
CREATE POLICY "Providers can insert own verifications"
  ON provider_verifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_accounts pa
      WHERE pa.provider_id = provider_verifications.provider_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
    AND user_id = auth.uid()
  );

-- Providers can update their own pending verifications
CREATE POLICY "Providers can update own pending verifications"
  ON provider_verifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM provider_accounts pa
      WHERE pa.provider_id = provider_verifications.provider_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
    AND overall_status IN ('pending', 'rejected') -- Can only update if pending or rejected
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_accounts pa
      WHERE pa.provider_id = provider_verifications.provider_id
      AND pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- Note: Admin policies would need to be added separately based on your admin role system
-- For now, admins will use service role key which bypasses RLS

COMMENT ON TABLE provider_verifications IS 'Stores provider verification documents (ID, insurance, qualifications) and admin review status';
COMMENT ON COLUMN provider_verifications.overall_status IS 'Overall verification status: pending, in_review, approved, rejected, or expired';
COMMENT ON COLUMN provider_verifications.rejection_details IS 'JSONB object with structured rejection details per document type';

