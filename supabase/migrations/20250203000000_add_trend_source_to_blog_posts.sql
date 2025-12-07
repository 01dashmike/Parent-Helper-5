-- Add trend_source field to blog_posts_ai table
-- Tracks which posts were generated from trending topics vs organic

ALTER TABLE blog_posts_ai
ADD COLUMN IF NOT EXISTS trend_source TEXT DEFAULT NULL;

-- Create index for filtering trend-based posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_ai_trend_source 
ON blog_posts_ai(trend_source) 
WHERE trend_source IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN blog_posts_ai.trend_source IS 'Identifies posts generated from trending topics (e.g., "search:music", "blog:sensory-play"). NULL for organic topics.';


