# Code Cleanup Notes

## Scope
This cleanup pass focused on the following domains:
- Referrals (`lib/referrals/*`, `app/api/referral/*`)
- Rewards (`lib/rewards/*`, `app/api/rewards/*`)
- Wallet (`app/api/wallet/*`, `lib/validations/wallet.ts`)
- Calendar Sync (`app/api/calendar/*`, `lib/calendar/*`)

## Changes Made

### 1. Fixed Bugs

#### `app/api/wallet/family/invite/route.ts`
- **Fixed**: Line 118 used undefined variable `existingUser?.user?.id` instead of `existingUserId`
- **Change**: Updated to use correct variable `existingUserId`

### 2. TODO Comments Converted to Issue Notes

#### `app/api/wallet/cashout/route.ts`
- **Before**: TODO comment with commented-out code for Stripe Connect account verification
- **After**: Converted to clear NOTE comment explaining:
  - What needs to be implemented (Stripe Connect account verification)
  - Prerequisites (onboarding flow, database table, webhook handler)
  - Removed commented-out code block

#### `app/api/wallet/family/invite/route.ts`
- **Before**: TODO comment about sending invitation email
- **After**: Converted to clear NOTE comment explaining:
  - What needs to be implemented (email invitation)
  - How to implement it (use `sendTransactional()` with email template)
  - Removed redundant comment about returning token

### 3. Code Review Findings

#### No Dead Code Found
- All functions in `lib/referrals/*` are actively used:
  - `normalizeCode` - used in referral validation and creation
  - `getUserReferralCode` - used in analytics
  - `createReferralCode` - used in provider referral creation
  - `createReward` - used in referral conversion tracking
  - `createStripeCoupon` - used in provider referral conversion
  - `rateLimit` - used in referral creation endpoint
  - `emailIntegration` - used in provider weekly emails
  - `getABVariant` - used by emailIntegration
  - `analytics` - used in referral conversion tracking

- All functions in `lib/rewards/*` are actively used:
  - `awardBookingReward` - called from booking completion
  - `awardProfileCompletionReward` - called from profile completion
  - `awardSavedSearchReward` - called from saved search creation
  - `trackRewardRedeemed`, `trackRewardExpired`, `trackRewardExpiringSoon` - used in reward management

- All calendar sync routes are actively used:
  - `/api/calendar/[token]` - main ICS feed endpoint
  - `/api/calendar/token` - token generation/retrieval
  - `/api/calendar/enable` - enable calendar sync
  - `/api/calendar/disable` - disable calendar sync
  - `/api/calendar/feed` - alternative feed endpoint (used by CalendarSyncClient)

#### Commented Code Blocks
- Found only explanatory comments (not commented-out code blocks)
- All comments are documentation-style, explaining logic flow
- No dead/commented-out code blocks found that need removal

### 4. Remaining TODOs/Notes

#### `app/api/wallet/cashout/route.ts`
- **NOTE**: Stripe Connect account verification not yet implemented
- **Reason**: Requires Stripe Connect onboarding flow and database schema
- **Action**: Keep as NOTE for future implementation

#### `app/api/wallet/family/invite/route.ts`
- **NOTE**: Email invitation not yet implemented
- **Reason**: Email template and transactional email integration needed
- **Action**: Keep as NOTE for future implementation

### 5. Import Verification

All imports are used:
- No unused imports found in any of the target files
- All imported functions/types are referenced in the code

### 6. Route Verification

All routes are active:
- Referral routes: `/api/referral/create`, `/api/referral/convert`, `/api/referral/validate`, `/api/referral/track`, `/api/referral/set-cookie`
- Reward routes: `/api/rewards/redeem`, `/api/rewards/validate-coupon`, `/api/rewards/auto-credit`, `/api/rewards/summary`
- Wallet routes: All wallet routes are feature-flag guarded and actively used
- Calendar routes: All calendar routes are feature-flag guarded and actively used

## Summary

- **Bugs Fixed**: 1 (undefined variable in wallet invite route)
- **TODOs Converted**: 2 (converted to clear issue notes)
- **Dead Code Removed**: 0 (no dead code found)
- **Unused Imports Removed**: 0 (all imports are used)
- **Unused Routes Removed**: 0 (all routes are active)

## Recommendations

1. **Future Implementation**: The two NOTE comments in wallet routes should be addressed when implementing:
   - Stripe Connect integration for cash-out
   - Email invitation system for family wallet members

2. **Code Quality**: The codebase in these domains is well-maintained with minimal technical debt.

3. **Documentation**: All remaining notes are clear and provide context for future implementation.

