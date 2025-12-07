# Parent Wallet + Credits + Multi-Class Pass System

## Overview

The Parent Wallet system allows parents to purchase credits and unlimited passes to book classes, providing a flexible payment option that works alongside traditional paid bookings.

## Features

### For Parents

1. **Credit Packs**
   - Buy 5, 10, or 20 credit packs
   - Credits never expire (configurable)
   - Use credits to book eligible classes

2. **Unlimited Passes**
   - Weekly or monthly unlimited passes per provider
   - Guaranteed access to provider's classes
   - Time-based validity

3. **Wallet Management**
   - View credit balance
   - Transaction history (ledger)
   - Active passes dashboard
   - Credit redemption during booking

### For Providers

1. **Credit Settings**
   - Enable/disable credit acceptance
   - Set credit cost per class
   - Configure unlimited passes
   - Per-class overrides

2. **Analytics**
   - Credits used metrics
   - Pass purchase tracking
   - Revenue from credit system

## Architecture

### Database Tables

- `parent_wallets` - User wallet balances
- `wallet_ledger` - All credit transactions
- `parent_passes` - Active unlimited passes
- `provider_credit_settings` - Provider configuration
- `booking_credit_redemptions` - Links credits/passes to bookings

### Core Functions

Located in `lib/wallet/`:

- `core.ts` - Wallet operations (get, add, spend credits)
- `passes.ts` - Pass management
- `eligibility.ts` - Credit eligibility checks
- `redemptions.ts` - Booking credit redemptions
- `expiry.ts` - Credit expiry (future)

### API Routes

- `/api/wallet/buy-credits` - Purchase credit packs
- `/api/wallet/redeem-booking` - Redeem credits for booking
- `/api/wallet/check-eligibility` - Check if credits can be used
- `/api/provider/credits/settings` - Provider settings

### UI Pages

- `/parent/wallet` - Parent wallet dashboard
- `/parent/wallet/buy-credits` - Purchase credits
- `/provider/(console)/credits` - Provider credit settings

## Integration Points

### Booking Flow

Credits and passes are integrated into the booking flow at the "upsells" step. Parents see a banner if:
- They have sufficient credits for the class
- They have an active unlimited pass for the provider

### Payment Flow

Credit pack purchases use the existing payment infrastructure:
- Creates payment intent via Stripe
- Adds credits after payment confirmation (webhook)
- Supports promo codes (future)

### Analytics

All wallet events are tracked:
- `wallet_purchase_started`
- `wallet_purchase_completed`
- `wallet_credit_spent`
- `wallet_pass_purchased`
- `wallet_pass_used`

## Security

- Wallet operations are user-scoped
- Provider settings are provider-scoped
- Credit redemptions are validated before booking creation
- Insufficient credits prevent booking completion

## Future Enhancements

- Credit expiry rules
- Promo code system
- Gift credits
- Referral rewards integration
- Credit refund policies
- Pass sharing (family accounts)





