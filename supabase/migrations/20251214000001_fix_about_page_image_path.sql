-- Fix the story_image_url path for existing about page content
-- The image was moved from /images/family-hero.png to /images/categories/family-hero.png

UPDATE about_page_content 
SET story_image_url = '/images/categories/family-hero.png'
WHERE story_image_url = '/images/family-hero.png';

-- Also update the default for future inserts (in case this migration runs before the table creation)
ALTER TABLE about_page_content 
ALTER COLUMN story_image_url SET DEFAULT '/images/categories/family-hero.png';
