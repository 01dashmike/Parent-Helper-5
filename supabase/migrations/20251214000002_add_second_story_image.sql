-- Add second story image for about page
-- This allows displaying two images stacked vertically on the right side of the Our Story section

ALTER TABLE about_page_content 
ADD COLUMN IF NOT EXISTS story_image_url_2 TEXT DEFAULT NULL;

COMMENT ON COLUMN about_page_content.story_image_url_2 IS 'URL to the second story section image (displayed below the first image)';
