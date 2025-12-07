-- ============================================
-- Performance Optimization Indexes
-- ============================================
-- Created: 2025-02-01
-- Purpose: Add indexes for search, bookings, referrals, and wallet queries
-- ============================================

-- ============================================
-- SEARCH INDEXES
-- ============================================

-- Composite index for common search filters
CREATE INDEX IF NOT EXISTS idx_classes_search_composite 
  ON classes(town, category, is_active, age_group_min, age_group_max)
  WHERE is_active = true;

-- Featured listings lookup by class and status
CREATE INDEX IF NOT EXISTS idx_featured_listings_class_status 
  ON featured_listings(class_id, status, starts_at, ends_at)
  WHERE status = 'active';

-- Provider plan lookup for search scoring
CREATE INDEX IF NOT EXISTS idx_providers_plan_lookup 
  ON providers(id, current_plan_id, billing_status)
  WHERE billing_status = 'active';

-- Active class boosts lookup
CREATE INDEX IF NOT EXISTS idx_class_boosts_active 
  ON class_boosts(class_id, status, expires_at)
  WHERE status = 'active' AND expires_at > NOW();

-- Category and age range search
CREATE INDEX IF NOT EXISTS idx_classes_category_age 
  ON classes(category, age_group_min, age_group_max, town)
  WHERE is_active = true;

-- Provider ID lookup for classes
CREATE INDEX IF NOT EXISTS idx_classes_provider_id 
  ON classes(provider_id, is_active)
  WHERE provider_id IS NOT NULL;

-- ============================================
-- BOOKING INDEXES
-- ============================================

-- Booking requests by provider and status
CREATE INDEX IF NOT EXISTS idx_booking_requests_provider_status 
  ON booking_requests(provider_id, status, created_at DESC)
  WHERE status IN ('pending', 'confirmed');

-- Booking requests by class
CREATE INDEX IF NOT EXISTS idx_booking_requests_class 
  ON booking_requests(class_id, status, created_at DESC);

-- Booking requests by session instance
CREATE INDEX IF NOT EXISTS idx_booking_requests_session_instance 
  ON booking_requests(session_instance_id, status)
  WHERE session_instance_id IS NOT NULL;

-- Bookings by provider and date
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date 
  ON bookings(provider_id, session_date, status)
  WHERE status = 'confirmed';

-- Bookings by class and date
CREATE INDEX IF NOT EXISTS idx_bookings_class_date 
  ON bookings(class_id, session_date, status);

-- Bookings by parent email (for user lookup)
CREATE INDEX IF NOT EXISTS idx_bookings_parent_email 
  ON bookings(parent_email, created_at DESC);

-- Session instances by bookability
CREATE INDEX IF NOT EXISTS idx_session_instances_bookable 
  ON session_instances(session_id, starts_at, bookable, status)
  WHERE bookable = true AND status = 'scheduled';

-- Session instances by date range
CREATE INDEX IF NOT EXISTS idx_session_instances_date_range 
  ON session_instances(starts_at, ends_at, bookable)
  WHERE starts_at >= NOW();

-- Booking occurrences by booking
CREATE INDEX IF NOT EXISTS idx_booking_occurrences_booking 
  ON booking_occurrences(booking_id, occurrence_id);

-- Booking occurrences by occurrence
CREATE INDEX IF NOT EXISTS idx_booking_occurrences_occurrence 
  ON booking_occurrences(occurrence_id, booking_id);

-- Class sessions by class
CREATE INDEX IF NOT EXISTS idx_class_sessions_class 
  ON class_sessions(class_id, status, weekday);

-- ============================================
-- REFERRAL INDEXES
-- ============================================

-- Referrals by referrer user
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user 
  ON referrals(referrer_user_id, created_at DESC, reward_status);

-- Referrals by referred email
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email 
  ON referrals(referred_email, reward_status, converted_at);

-- Referrals by code (for validation)
CREATE INDEX IF NOT EXISTS idx_referrals_code 
  ON referrals(referral_code)
  WHERE referral_code IS NOT NULL;

-- Referrals by status and creation date
CREATE INDEX IF NOT EXISTS idx_referrals_status_created 
  ON referrals(reward_status, created_at DESC, referral_type);

-- Rewards by user and status
CREATE INDEX IF NOT EXISTS idx_rewards_user_status 
  ON rewards(user_id, status, created_at DESC)
  WHERE status IN ('available', 'pending');

-- Rewards by source
CREATE INDEX IF NOT EXISTS idx_rewards_source 
  ON rewards(source, status, created_at DESC);

-- Provider referral analytics by provider
CREATE INDEX IF NOT EXISTS idx_provider_referral_analytics_provider 
  ON provider_referral_analytics(provider_id, created_at DESC);

-- Provider referral analytics by referral
CREATE INDEX IF NOT EXISTS idx_provider_referral_analytics_referral 
  ON provider_referral_analytics(referral_id, event_type);

-- ============================================
-- WALLET INDEXES
-- ============================================

-- Family wallets by owner
CREATE INDEX IF NOT EXISTS idx_family_wallets_owner 
  ON family_wallets(owner_user_id, created_at DESC);

-- Family members by wallet and user
CREATE INDEX IF NOT EXISTS idx_family_members_wallet_user 
  ON family_members(wallet_id, user_id, status)
  WHERE status = 'active';

-- Family members by user and wallet
CREATE INDEX IF NOT EXISTS idx_family_members_user_wallet 
  ON family_members(user_id, wallet_id, status);

-- Family members by invite token
CREATE INDEX IF NOT EXISTS idx_family_members_invite_token 
  ON family_members(invite_token)
  WHERE invite_token IS NOT NULL;

-- Wallet transactions by wallet
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet 
  ON wallet_transactions(wallet_id, created_at DESC, type);

-- Wallet transactions by user
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user 
  ON wallet_transactions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Wallet transactions by type and date
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type_date 
  ON wallet_transactions(type, created_at DESC, wallet_id);

-- Wallet accounts by user
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user 
  ON wallet_accounts(user_id, updated_at DESC);

-- Wallet accounts by family wallet
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_family_wallet 
  ON wallet_accounts(family_wallet_id)
  WHERE family_wallet_id IS NOT NULL;

-- Wallet account transactions by wallet
CREATE INDEX IF NOT EXISTS idx_wallet_account_transactions_wallet 
  ON wallet_transactions(wallet_id, created_at DESC, type);

-- Wallet account transactions by type
CREATE INDEX IF NOT EXISTS idx_wallet_account_transactions_type 
  ON wallet_transactions(type, created_at DESC)
  WHERE type IN ('credit', 'debit');

-- ============================================
-- ANALYZE TABLES
-- ============================================
-- Update statistics after index creation for optimal query planning

ANALYZE classes;
ANALYZE featured_listings;
ANALYZE providers;
ANALYZE class_boosts;
ANALYZE booking_requests;
ANALYZE bookings;
ANALYZE session_instances;
ANALYZE booking_occurrences;
ANALYZE class_sessions;
ANALYZE referrals;
ANALYZE rewards;
ANALYZE provider_referral_analytics;
ANALYZE family_wallets;
ANALYZE family_members;
ANALYZE wallet_transactions;
ANALYZE wallet_accounts;

