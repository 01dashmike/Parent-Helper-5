# Family Wallet Implementation

This document describes the implementation of shared family credits and gifting functionality for the Family Wallet feature.

## Overview

The Family Wallet feature allows families to:
- Create a shared wallet that multiple family members can access
- Invite family members (adults and children) to join the wallet
- Share credits across all family members
- View combined balance and transaction history

## Database Schema

### Tables

1. **family_wallets**
   - `id` (uuid, PK)
   - `name` (text) - e.g., "Smith Family"
   - `owner_user_id` (uuid, FK to auth.users)
   - `created_at`, `updated_at` (timestamps)

2. **family_wallet_members**
   - `id` (uuid, PK)
   - `family_wallet_id` (uuid, FK to family_wallets)
   - `user_id` (uuid, FK to auth.users, nullable until accepted)
   - `role` (text) - 'owner', 'adult', or 'child'
   - `invited_email` (text) - Email address of invited member
   - `invite_token` (text, unique) - Token for accepting invitation
   - `status` (text) - 'invited', 'active', or 'left'
   - `joined_at` (timestamp) - When member accepted invitation
   - `created_at` (timestamp)

3. **wallet_accounts** (extended)
   - Added `family_wallet_id` (uuid, FK to family_wallets, nullable)
   - Links individual wallet accounts to a family wallet

## Migrations

Two SQL migration files are provided:

1. **`shared/migrations/add_family_wallet_support.sql`**
   - Adds `family_wallet_id` column to `wallet_accounts`
   - Creates `family_wallet_members` table
   - Ensures `family_wallets` table has correct structure
   - Creates indexes and triggers

2. **`shared/migrations/add_family_wallet_rls.sql`**
   - Enables RLS on `family_wallets` and `family_wallet_members`
   - Creates policies for:
     - Members can read wallets they belong to
     - Owners can invite/remove members
     - Members can read transactions
     - Owners can update wallet settings

## API Endpoints

### GET `/api/wallet/family/get`
Returns family wallet information for the current user:
- Wallet details (name, owner, created date)
- List of members (with roles and status)
- Combined balance from all linked wallet accounts
- Whether current user is the owner

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "uuid",
      "name": "Smith Family",
      "owner_user_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "members": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "email": "user@example.com",
        "role": "adult",
        "status": "active",
        "joined_at": "timestamp"
      }
    ],
    "balance_cents": 10000,
    "is_owner": true
  }
}
```

### POST `/api/wallet/family/invite`
Owner can invite a family member by email.

**Request:**
```json
{
  "email": "family.member@example.com",
  "role": "adult" // or "child"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member_id": "uuid",
    "invited_email": "family.member@example.com",
    "role": "adult",
    "invite_token": "hex_token",
    "accept_url": "https://parenthelper.co.uk/account/wallet/accept?token=..."
  }
}
```

### POST `/api/wallet/family/accept`
Invited user accepts invitation using token.

**Request:**
```json
{
  "token": "invite_token_from_email"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member_id": "uuid",
    "family_wallet_id": "uuid",
    "role": "adult",
    "status": "active",
    "joined_at": "timestamp"
  }
}
```

## UI Components

### FamilyWalletSection
Displays family wallet information:
- Wallet name and shared balance
- List of active and invited members
- "Invite Member" button (owner only)
- Member roles and status indicators

### InviteMemberModal
Modal for inviting family members:
- Email input
- Role selection (Adult/Child)
- Sends invitation via API
- Shows success/error states

### Accept Invite Page (`/account/wallet/accept`)
Page for accepting invitations:
- Accepts token from URL query parameter
- Calls accept API endpoint
- Shows loading/success/error states
- Redirects to wallet page on success

## Security (RLS Policies)

### Family Wallets
- **SELECT**: Members can read wallets they belong to
- **INSERT**: Only owners can create wallets
- **UPDATE**: Only owners can update wallet settings

### Family Wallet Members
- **SELECT**: Members can read members of wallets they belong to
- **INSERT**: Only owners can invite members
- **UPDATE**: Owners can change roles/status; users can accept their own invitations
- **DELETE**: Only owners can remove members

### Wallet Accounts
- **SELECT**: Members can read wallet accounts linked to their family wallet
- Extended existing policies to include family wallet access

## Feature Flag

All functionality is guarded by `FAMILY_WALLET_ENABLED === 'true'`:
- API endpoints return 503 if disabled
- UI components only render when enabled
- Migrations should be run only when feature is enabled

## Usage Flow

1. **Owner creates family wallet** (automatically when they first access wallet)
2. **Owner invites members** via email
3. **Invited members receive email** with accept link
4. **Members accept invitation** via `/account/wallet/accept?token=...`
5. **Members' wallet accounts are linked** to family wallet
6. **All members can view** shared balance and transactions
7. **Credits are shared** across all linked wallet accounts

## Future Enhancements

- Email notifications for invitations
- Gifting credits between family members
- Spending limits per role
- Transaction history filtering by member
- Family wallet settings page

