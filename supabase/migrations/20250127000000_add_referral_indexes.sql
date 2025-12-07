-- Add missing indexes for referral and booking tables
-- Ensures optimal query performance for common access patterns

-- 1. member_referrals: Add created_at index
create index if not exists member_referrals_created_at_idx 
  on public.member_referrals(created_at);

-- 2. provider_referrals: Add created_at index
create index if not exists provider_referrals_created_at_idx 
  on public.provider_referrals(created_at);

-- 3. provider_rewards: Add created_at index
create index if not exists provider_rewards_created_at_idx 
  on public.provider_rewards(created_at);

-- 4. simple_bookings: Add missing indexes
-- Note: id is already indexed as primary key (booking_id equivalent)
-- Note: referral_code column exists (added in 20250121_rewards_wallet_referrals.sql)
create index if not exists simple_bookings_email_idx 
  on public.simple_bookings(email);
create index if not exists simple_bookings_referral_code_idx 
  on public.simple_bookings(referral_code) 
  where referral_code is not null;
create index if not exists simple_bookings_created_at_idx 
  on public.simple_bookings(created_at);

-- Note: Indexes already exist for:
-- - member_referrals: referrer_user_id (member_referrals_referrer_idx), referral_code (member_referrals_code_idx), referred_email (member_referrals_email_idx)
-- - provider_referrals: provider_id (provider_referrals_provider_idx), referral_code (provider_referrals_code_idx)
-- - rewards: user_id (rewards_user_id_idx), created_at (rewards_created_at_idx)
-- - provider_rewards: provider_id (provider_rewards_provider_idx)
-- - simple_bookings: occurrence_id (simple_bookings_occurrence_idx), status (simple_bookings_status_idx), stripe_checkout_id (simple_bookings_checkout_id_idx)

