-- Analytics Funnels Table
-- Tracks user progression through key conversion funnels
-- Used to identify drop-off points and optimize conversion rates

CREATE TABLE IF NOT EXISTS analytics_funnels (
    id BIGSERIAL PRIMARY KEY,
    
    -- Funnel identification
    funnel_name TEXT NOT NULL, -- e.g., 'provider_onboarding', 'class_booking', 'search_conversion', 'wallet_action'
    funnel_step TEXT NOT NULL, -- e.g., 'step1_basic_details', 'step2_add_class', 'payment_initiated', 'wallet_add_funds'
    
    -- Event type
    event_type TEXT NOT NULL CHECK (event_type IN ('funnel_step_started', 'funnel_step_completed', 'funnel_step_abandoned')),
    
    -- User/session tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT, -- Anonymous session ID for non-authenticated users
    
    -- Context data
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (provider_id, class_id, booking_id, etc.)
    
    -- Timing
    started_at TIMESTAMPTZ, -- When step was started (for started/completed events)
    completed_at TIMESTAMPTZ, -- When step was completed (for completed events)
    abandoned_at TIMESTAMPTZ, -- When step was abandoned (for abandoned events)
    duration_seconds INTEGER, -- Time spent on step (for completed events)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexes for common queries
    CONSTRAINT valid_event_timing CHECK (
        (event_type = 'funnel_step_started' AND started_at IS NOT NULL) OR
        (event_type = 'funnel_step_completed' AND completed_at IS NOT NULL) OR
        (event_type = 'funnel_step_abandoned' AND abandoned_at IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_funnel_name ON analytics_funnels(funnel_name);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_funnel_step ON analytics_funnels(funnel_step);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_event_type ON analytics_funnels(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_user_id ON analytics_funnels(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_session_id ON analytics_funnels(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_created_at ON analytics_funnels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_funnel_name_step ON analytics_funnels(funnel_name, funnel_step);
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_metadata_gin ON analytics_funnels USING GIN(metadata);

-- Composite index for funnel analysis queries
CREATE INDEX IF NOT EXISTS idx_analytics_funnels_funnel_analysis ON analytics_funnels(funnel_name, event_type, created_at DESC);

-- RLS Policy (allow inserts from authenticated and anonymous users)
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write (for API endpoints)
CREATE POLICY "Service role can manage analytics_funnels" ON analytics_funnels
    FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own funnel events" ON analytics_funnels
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to read their own events
CREATE POLICY "Users can read their own funnel events" ON analytics_funnels
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Add comment
COMMENT ON TABLE analytics_funnels IS 'Tracks user progression through conversion funnels to identify drop-off points and optimize conversion rates';

