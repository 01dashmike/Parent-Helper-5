-- ============================================
-- Additional Performance Optimization Indexes
-- ============================================
-- Created: 2025-02-15
-- Purpose: Add missing indexes for common query patterns
-- ============================================

-- ============================================
-- FAMILY & USER INDEXES
-- ============================================

-- Family profiles by user_id (very common lookup)
CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id 
  ON family_profiles(user_id)
  WHERE user_id IS NOT NULL;

-- Children by family_id (common lookup)
CREATE INDEX IF NOT EXISTS idx_children_family_id 
  ON children(family_id, created_at DESC);

-- Children by user_id (for direct user lookups)
CREATE INDEX IF NOT EXISTS idx_children_user_id 
  ON children(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Saved recommendations by user and date
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_user_created 
  ON saved_recommendations(user_id, created_at DESC, score DESC)
  WHERE user_id IS NOT NULL;

-- Saved recommendations by class_id (for cache invalidation)
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_class_id 
  ON saved_recommendations(class_id)
  WHERE class_id IS NOT NULL;

-- ============================================
-- SEARCH & DISCOVERY INDEXES
-- ============================================

-- Classes by town and active status (common search filter)
CREATE INDEX IF NOT EXISTS idx_classes_town_active 
  ON classes(town, is_active, created_at DESC)
  WHERE is_active = true AND town IS NOT NULL;

-- Classes by category and active status
CREATE INDEX IF NOT EXISTS idx_classes_category_active 
  ON classes(category, is_active, popularity DESC)
  WHERE is_active = true AND category IS NOT NULL;

-- Classes by age range (for age-based filtering)
CREATE INDEX IF NOT EXISTS idx_classes_age_range 
  ON classes(age_group_min, age_group_max, is_active)
  WHERE is_active = true;

-- Classes by provider and active status
CREATE INDEX IF NOT EXISTS idx_classes_provider_active 
  ON classes(provider_id, is_active, created_at DESC)
  WHERE provider_id IS NOT NULL AND is_active = true;

-- ============================================
-- ANALYTICS & TRACKING INDEXES
-- ============================================

-- Analytics events by user and date
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created 
  ON analytics_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Analytics events by event type and date
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created 
  ON analytics_events(event_type, created_at DESC);

-- Analytics events by session and date
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created 
  ON analytics_events(session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

-- ============================================
-- PERSONALIZATION INDEXES
-- ============================================

-- Saved searches by user and date
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_created 
  ON saved_searches(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- User preferences by user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON user_preferences(user_id)
  WHERE user_id IS NOT NULL;

-- ============================================
-- PROVIDER INDEXES
-- ============================================

-- Providers by user_id (common lookup)
CREATE INDEX IF NOT EXISTS idx_providers_user_id 
  ON providers(user_id)
  WHERE user_id IS NOT NULL;

-- Providers by billing status (for active provider queries)
CREATE INDEX IF NOT EXISTS idx_providers_billing_status 
  ON providers(billing_status, current_plan_id)
  WHERE billing_status = 'active';

-- ============================================
-- ANALYZE TABLES
-- ============================================
-- Update statistics after index creation for optimal query planning

ANALYZE family_profiles;
ANALYZE children;
ANALYZE saved_recommendations;
ANALYZE saved_searches;
ANALYZE user_preferences;
ANALYZE analytics_events;
ANALYZE providers;

