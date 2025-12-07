-- Add SEO metadata columns to classes table
-- These columns store AI-generated metadata for better SEO

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Add index for faster queries when filtering by metadata presence
CREATE INDEX IF NOT EXISTS idx_classes_meta_title ON classes(meta_title) WHERE meta_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_keywords ON classes USING GIN(keywords) WHERE keywords IS NOT NULL;

