-- Add body_markdown column and other missing columns to blog_posts_ai table
-- Fixes the schema mismatch where code expects body_markdown but table has content

-- First, add body_markdown column
ALTER TABLE blog_posts_ai
ADD COLUMN IF NOT EXISTS body_markdown TEXT;

-- Copy data from content to body_markdown if content column exists and has data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_posts_ai' 
    AND column_name = 'content'
  ) THEN
    UPDATE blog_posts_ai
    SET body_markdown = content
    WHERE body_markdown IS NULL AND content IS NOT NULL;
  END IF;
END $$;

-- Add other missing columns that the code expects
ALTER TABLE blog_posts_ai
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hero_image TEXT,
ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS locality TEXT,
ADD COLUMN IF NOT EXISTS postcode_prefix TEXT,
ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS lon NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add index on status for filtering published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_status ON blog_posts_ai(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_slug ON blog_posts_ai(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_category ON blog_posts_ai(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_locality ON blog_posts_ai(locality);

-- Comment for documentation
COMMENT ON COLUMN blog_posts_ai.body_markdown IS 'Markdown content of the blog post';
COMMENT ON COLUMN blog_posts_ai.tags IS 'Array of tags for the blog post';
COMMENT ON COLUMN blog_posts_ai.hero_image IS 'URL to the hero image for the post';
COMMENT ON COLUMN blog_posts_ai.reading_time_minutes IS 'Estimated reading time in minutes';
COMMENT ON COLUMN blog_posts_ai.word_count IS 'Total word count of the post';
COMMENT ON COLUMN blog_posts_ai.locality IS 'Target locality for the post';
COMMENT ON COLUMN blog_posts_ai.postcode_prefix IS 'Target postcode prefix (e.g., SP10)';



