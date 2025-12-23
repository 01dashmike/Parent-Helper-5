-- Add scheduling support to blog_posts_ai table
-- Allows posts to be scheduled for future publication

-- Add scheduled_for column
ALTER TABLE blog_posts_ai
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NULL;

-- Create index for scheduled posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_scheduled_for 
ON blog_posts_ai(scheduled_for) 
WHERE scheduled_for IS NOT NULL AND status = 'scheduled';

-- Comment for documentation
COMMENT ON COLUMN blog_posts_ai.scheduled_for IS 'Timestamp when the post should be automatically published. NULL for immediate publish or drafts.';

