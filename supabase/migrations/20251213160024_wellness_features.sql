-- ============================================================================
-- Wellness Features Migration
-- Creates tables for wellness profiles, plans, and product safety cache
-- Also enhances blog_posts_ai with wellness and audience tags
-- ============================================================================

-- User wellness preferences (for logged-in users)
CREATE TABLE IF NOT EXISTS wellness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('mum', 'dad', 'couples', 'family', 'grandparents')),
  
  -- Diet preferences
  dietary_likes TEXT[],
  dietary_dislikes TEXT[],
  allergies TEXT[],
  preferred_shops TEXT[],
  cooking_time TEXT,
  diet_goals TEXT[],
  budget_preference TEXT,
  
  -- Exercise preferences  
  exercise_location TEXT,
  available_equipment TEXT[],
  fitness_level TEXT,
  exercise_goals TEXT[],
  exercise_time TEXT,
  exercise_days INTEGER,
  injuries TEXT[],
  
  -- Supplement info
  age_range TEXT,
  biological_sex TEXT,
  health_conditions TEXT[],
  current_medications TEXT[],
  diet_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, audience)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_wellness_profiles_user_id ON wellness_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_profiles_audience ON wellness_profiles(audience);

-- Recent plans (saved for logged-in users and anonymous sessions)
CREATE TABLE IF NOT EXISTS wellness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  audience TEXT NOT NULL CHECK (audience IN ('mum', 'dad', 'couples', 'family', 'grandparents')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('meal', 'exercise', 'supplement', 'product')),
  plan_data JSONB NOT NULL,
  inputs JSONB, -- Store user inputs for regeneration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Create indexes for plan lookups
CREATE INDEX IF NOT EXISTS idx_wellness_plans_user_id ON wellness_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_session_id ON wellness_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_audience ON wellness_plans(audience);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_plan_type ON wellness_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_created_at ON wellness_plans(created_at DESC);

-- Product lookups cache (shared across all users)
CREATE TABLE IF NOT EXISTS product_safety_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  product_name TEXT,
  brand TEXT,
  category TEXT,
  safety_score INTEGER CHECK (safety_score >= 1 AND safety_score <= 10),
  analysis JSONB NOT NULL,
  alternatives JSONB,
  ingredient_list TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  lookup_count INTEGER DEFAULT 1
);

-- Create indexes for product lookups
CREATE INDEX IF NOT EXISTS idx_product_safety_cache_barcode ON product_safety_cache(barcode);
CREATE INDEX IF NOT EXISTS idx_product_safety_cache_product_name ON product_safety_cache(product_name);
CREATE INDEX IF NOT EXISTS idx_product_safety_cache_expires_at ON product_safety_cache(expires_at);

-- Enhance blog_posts_ai table with wellness tags
ALTER TABLE blog_posts_ai 
  ADD COLUMN IF NOT EXISTS wellness_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_tags TEXT[] DEFAULT '{}';

-- Create indexes for wellness tag searches
CREATE INDEX IF NOT EXISTS idx_blog_posts_wellness_tags ON blog_posts_ai USING GIN(wellness_tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_audience_tags ON blog_posts_ai USING GIN(audience_tags);

-- Enable RLS on wellness tables
ALTER TABLE wellness_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_safety_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wellness_profiles
-- Users can only see and modify their own profiles
CREATE POLICY "Users can view own wellness profiles"
  ON wellness_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness profiles"
  ON wellness_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness profiles"
  ON wellness_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness profiles"
  ON wellness_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wellness_plans
-- Users can see their own plans
CREATE POLICY "Users can view own wellness plans"
  ON wellness_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness plans"
  ON wellness_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can delete own wellness plans"
  ON wellness_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for product_safety_cache
-- Everyone can read cached product data
CREATE POLICY "Anyone can view product safety cache"
  ON product_safety_cache FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (to prevent spam)
CREATE POLICY "Authenticated users can insert product cache"
  ON product_safety_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product cache"
  ON product_safety_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Function to update wellness_profiles updated_at timestamp
CREATE OR REPLACE FUNCTION update_wellness_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER wellness_profiles_updated_at
  BEFORE UPDATE ON wellness_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_wellness_profiles_updated_at();

-- Function to clean expired product cache
CREATE OR REPLACE FUNCTION clean_expired_product_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM product_safety_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE wellness_profiles IS 'Stores user wellness preferences for each audience type';
COMMENT ON TABLE wellness_plans IS 'Stores generated wellness plans (meal, exercise, supplement, product)';
COMMENT ON TABLE product_safety_cache IS 'Caches product safety analysis to avoid duplicate AI calls';
COMMENT ON COLUMN blog_posts_ai.wellness_tags IS 'Tags for wellness topics: diet, exercise, supplements, product-safety, nutrition, fitness, mental-health';
COMMENT ON COLUMN blog_posts_ai.audience_tags IS 'Target audience: mum, dad, family, grandparents, all';
