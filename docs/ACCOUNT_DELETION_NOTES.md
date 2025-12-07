# Account Deletion - GDPR Compliance Notes

This document outlines the account deletion process, what data is deleted, what is retained, and legal considerations.

## Overview

Account deletion is implemented to comply with GDPR Article 17 (Right to Erasure). Users can request account deletion through the `/account/settings` page, which triggers a comprehensive cleanup process.

## Deletion Process

The deletion process is handled by `POST /api/account/delete` and follows these steps:

1. **Authentication Check**: Verifies user is authenticated
2. **Data Cleanup**: Deletes user-related data in a specific order
3. **User Deletion**: Finally deletes the user account via Supabase Auth

## Data Deleted (Irreversible)

The following data is **permanently deleted** and cannot be recovered:

### Personal Data
- **User Account**: Auth user record (email, password hash, etc.)
- **Wallet Account**: User's wallet account and all wallet transactions
- **Family Wallet Membership**: User's membership in family wallets (family wallet itself only deleted if user was sole owner)
- **Saved Searches**: All saved search queries and filters
- **Rewards**: All user rewards (points, coupons, etc.)
- **Referrals**: All referral records where user was the referrer
- **Saved Plans**: All saved meal plans, exercise routines, etc.
- **Alerts**: All user alerts and notifications
- **Child Profiles**: All child profiles and preferences (if family profiles feature enabled)
- **User Preferences**: All personalization preferences

### Provider Data (Conditional)
- **Provider Account**: Deleted if user is the sole owner
- **Provider Onboarding**: Deleted if user is the sole owner
- **Provider Rewards**: Deleted if user is the sole owner
- **Classes**: All classes deleted if user is a provider with no other owners
- **Class Sessions**: All sessions and instances for deleted classes

## Data Retained (Soft-Deleted or Anonymized)

The following data is **retained** but anonymized for legal/financial compliance:

### Bookings
- **Status**: Set to `'deleted'` (soft-delete)
- **Reason**: Maintains financial records, tax compliance, and dispute resolution
- **Data**: Email addresses anonymized, but booking records preserved
- **Retention**: Indefinite (for accounting and legal purposes)

### Financial Records
- **Booking Payments**: Retained for reconciliation and tax purposes
- **Stripe Transactions**: Retained in Stripe (external system)
- **Revenue Metrics**: Aggregated metrics retained (no personal identifiers)

### Analytics
- **Analytics Events**: User ID removed, but anonymized events retained
- **Aggregate Metrics**: No personal data, only aggregated statistics

## Legal Considerations

### GDPR Compliance
- **Right to Erasure**: Users can request account deletion at any time
- **Data Minimization**: Only necessary data is retained (bookings for financial records)
- **Transparency**: Users are informed about what is deleted vs. retained

### Financial Compliance
- **Tax Records**: Booking records must be retained for tax/accounting purposes (typically 7 years in UK)
- **Dispute Resolution**: Booking records may be needed for chargeback disputes
- **Audit Trail**: Financial transactions must maintain an audit trail

### Business Continuity
- **Provider Classes**: Classes are only deleted if provider is sole owner (protects other users)
- **Family Wallets**: Family wallets are only deleted if user was sole owner (protects other family members)

## Implementation Details

### API Endpoint
- **Route**: `POST /api/account/delete`
- **Authentication**: Required (user must be logged in)
- **Authorization**: Users can only delete their own account
- **Response**: `{ success: true }` on success

### UI Flow
1. User navigates to `/account/settings`
2. Clicks "Delete My Account" button
3. Warning displayed with list of what will be deleted
4. User must type "DELETE" to confirm
5. Account deletion API called
6. User signed out automatically
7. Redirect to homepage

### Error Handling
- Network errors: Displayed to user, account not deleted
- Partial failures: Logged, but deletion continues where possible
- Critical failures: User account deletion attempted even if some data cleanup fails

## Testing Considerations

When testing account deletion:

1. **Test with various user states**:
   - User with wallet balance
   - User with family wallet membership
   - Provider with classes
   - Provider with other owners
   - User with bookings

2. **Verify data deletion**:
   - Check all tables mentioned above
   - Verify soft-deleted bookings have status='deleted'
   - Verify family wallets remain if other members exist

3. **Verify user cannot access account**:
   - Attempt to log in after deletion
   - Verify redirect to login page

## Support

If users have questions about account deletion:
- Direct them to this documentation
- Explain what data is retained and why
- Provide contact information for data protection inquiries

## Future Enhancements

Potential improvements:
- Scheduled deletion (30-day grace period)
- Export data before deletion
- Partial deletion (delete specific data types only)
- Admin-initiated deletion (for compliance requests)

