-- Create about_page_content table for editable about page
CREATE TABLE IF NOT EXISTS about_page_content (
  id SERIAL PRIMARY KEY,
  
  -- Hero Section
  hero_title TEXT NOT NULL DEFAULT 'About Parent Helper',
  hero_description TEXT NOT NULL DEFAULT 'A family-founded platform dedicated to helping families across the nation discover amazing classes, resources, and community connections for their little ones.',
  
  -- Our Story Section
  story_title TEXT NOT NULL DEFAULT 'Our Story',
  story_content TEXT NOT NULL DEFAULT 'Parent Helper was born from a simple, heartfelt need: finding great classes for our own children shouldn''t be so difficult. As parents ourselves, we experienced the frustration of searching through countless websites, social media groups, and word-of-mouth recommendations just to find the perfect activity for our little ones.

Founded in [FOUNDING_YEAR] by [FAMILY_MEMBER_NAMES], Parent Helper started as a personal project to help our own family navigate the world of baby and toddler classes. [SPECIFIC_STORY - e.g., "After spending countless weekends searching for the right music class for our daughter, we realized there had to be a better way to connect families with amazing local providers."]

What began as a solution for our family quickly grew into something bigger. We saw how many other parents were facing the same challenges, and we wanted to create a platform that would make it easier for families everywhere to discover, compare, and book classes that would bring joy and enrichment to their children''s lives.

Today, Parent Helper is a trusted resource for thousands of families across the UK, helping them find everything from sensory play sessions to music classes, from outdoor adventures to creative workshops. But at our core, we''re still that same family-founded business, committed to making parenting just a little bit easier, one class at a time.',
  story_image_url TEXT DEFAULT '/images/family-hero.png',
  
  -- Mission Section
  mission_title TEXT NOT NULL DEFAULT 'Our Mission',
  mission_content TEXT NOT NULL DEFAULT 'To support families across the nation by making it easier than ever to discover, compare, and book amazing classes and resources for their children. We believe every family deserves access to quality activities that help their little ones learn, grow, and thrive.',
  
  -- What We Do Section
  features_title TEXT NOT NULL DEFAULT 'What We Do',
  features_subtitle TEXT DEFAULT 'We''re here to make finding and booking classes simple, so you can focus on what matters most—spending quality time with your little ones.',
  features JSONB NOT NULL DEFAULT '[
    {
      "title": "Discover Classes",
      "description": "Search through thousands of carefully curated baby and toddler classes across the UK. Find the perfect activity for your little one.",
      "icon": "🔍"
    },
    {
      "title": "Easy Booking",
      "description": "Book classes directly through our platform. Simple, secure, and designed with busy parents in mind.",
      "icon": "📅"
    },
    {
      "title": "Helpful Resources",
      "description": "Access guides, tips, and expert advice to support your parenting journey every step of the way.",
      "icon": "📚"
    },
    {
      "title": "Local Insights",
      "description": "Get recommendations tailored to your area, with real reviews and insights from other local families.",
      "icon": "📍"
    }
  ]'::jsonb,
  
  -- Our Values Section
  values_title TEXT NOT NULL DEFAULT 'Our Values',
  values_subtitle TEXT DEFAULT 'These core principles guide everything we do at Parent Helper.',
  values JSONB NOT NULL DEFAULT '[
    {
      "title": "Family First",
      "description": "We understand the challenges parents face because we''re parents too. Every decision we make is guided by what''s best for families.",
      "icon": "👨‍👩‍👧‍👦"
    },
    {
      "title": "Community Connection",
      "description": "We believe in the power of local communities. We''re here to help families connect with amazing local providers and build lasting relationships.",
      "icon": "🤝"
    },
    {
      "title": "Trust & Quality",
      "description": "We carefully curate our listings to ensure families can trust the quality of classes and services they discover through our platform.",
      "icon": "✨"
    },
    {
      "title": "Accessibility",
      "description": "Every family deserves access to great classes and resources. We work to make finding and booking classes as easy and accessible as possible.",
      "icon": "♿"
    }
  ]'::jsonb,
  
  -- Impact Section
  impact_title TEXT NOT NULL DEFAULT 'Making a Difference',
  impact_content TEXT DEFAULT 'We''re proud to be part of a community that values quality time with children and supports local businesses. Every booking, every search, and every connection made through Parent Helper helps strengthen the fabric of our communities.',
  impact_stats JSONB NOT NULL DEFAULT '[
    {
      "value": "5,000+",
      "label": "Classes Listed"
    },
    {
      "value": "UK-Wide",
      "label": "Coverage"
    },
    {
      "value": "Growing",
      "label": "Community"
    }
  ]'::jsonb,
  
  -- Call to Action Section
  cta_label TEXT DEFAULT 'Get started',
  cta_title TEXT DEFAULT 'Ready to discover amazing classes?',
  cta_content TEXT DEFAULT 'Start exploring classes near you or get in touch if you have questions.',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a single row with default content (singleton pattern)
INSERT INTO about_page_content (id, hero_title) 
VALUES (1, 'About Parent Helper') 
ON CONFLICT (id) DO NOTHING;

-- Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update trigger for updated_at
DROP TRIGGER IF EXISTS update_about_page_content_updated_at ON about_page_content;
CREATE TRIGGER update_about_page_content_updated_at
  BEFORE UPDATE ON about_page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE about_page_content IS 'Stores editable content for the about page';
COMMENT ON COLUMN about_page_content.hero_title IS 'Hero section title';
COMMENT ON COLUMN about_page_content.hero_description IS 'Hero section description';
COMMENT ON COLUMN about_page_content.story_title IS 'Our Story section title';
COMMENT ON COLUMN about_page_content.story_content IS 'Our Story section content (supports multiple paragraphs)';
COMMENT ON COLUMN about_page_content.story_image_url IS 'URL to the story section image';
COMMENT ON COLUMN about_page_content.mission_title IS 'Mission section title';
COMMENT ON COLUMN about_page_content.mission_content IS 'Mission section content';
COMMENT ON COLUMN about_page_content.features_title IS 'What We Do section title';
COMMENT ON COLUMN about_page_content.features_subtitle IS 'What We Do section subtitle';
COMMENT ON COLUMN about_page_content.features IS 'Array of features with title, description, and icon';
COMMENT ON COLUMN about_page_content.values_title IS 'Our Values section title';
COMMENT ON COLUMN about_page_content.values_subtitle IS 'Our Values section subtitle';
COMMENT ON COLUMN about_page_content.values IS 'Array of values with title, description, and icon';
COMMENT ON COLUMN about_page_content.impact_title IS 'Impact section title';
COMMENT ON COLUMN about_page_content.impact_content IS 'Impact section description';
COMMENT ON COLUMN about_page_content.impact_stats IS 'Array of impact statistics with value and label';
COMMENT ON COLUMN about_page_content.cta_label IS 'Call to action label (e.g., "Get started")';
COMMENT ON COLUMN about_page_content.cta_title IS 'Call to action title';
COMMENT ON COLUMN about_page_content.cta_content IS 'Call to action description';
