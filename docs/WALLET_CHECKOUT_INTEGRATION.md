# Family Wallet Checkout Integration

This document describes how to integrate Family Wallet payments into the booking checkout flow.

## Overview

When a user proceeds to checkout for a booking, they should be able to:
1. See their current wallet balance
2. Choose to pay with wallet credits (if balance is sufficient)
3. Pay the remaining amount via Stripe if wallet balance is insufficient
4. Have wallet credits automatically deducted upon successful booking

## Integration Points

### 1. Checkout Page Component

Add a wallet payment option to your checkout component:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";

export function CheckoutPaymentOptions({ totalAmountCents }: { totalAmountCents: number }) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/summary")
      .then((res) => res.json())
      .then((data) => setWalletBalance(data.balance || 0))
      .catch(() => setWalletBalance(0));
  }, []);

  const walletAmount = useWallet ? Math.min(walletBalance || 0, totalAmountCents) : 0;
  const remainingAmount = totalAmountCents - walletAmount;

  return (
    <div className="space-y-4">
      {walletBalance !== null && walletBalance > 0 && (
        <label className="flex items-center gap-3 rounded-xl border border-sage/20 bg-white p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
            className="h-4 w-4 text-sage"
          />
          <Wallet className="h-5 w-5 text-sage" />
          <div className="flex-1">
            <p className="font-medium">Pay with Family Wallet</p>
            <p className="text-sm text-slateSoft">
              Available: £{(walletBalance / 100).toFixed(2)}
            </p>
          </div>
          {useWallet && (
            <p className="font-semibold text-sage">
              -£{(walletAmount / 100).toFixed(2)}
            </p>
          )}
        </label>
      )}

      {remainingAmount > 0 && (
        <div>
          <p className="text-sm text-slateSoft">Remaining amount:</p>
          <p className="text-2xl font-bold">£{(remainingAmount / 100).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Checkout API Route

Modify your checkout API route to handle wallet payments:

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerActionClient } from "@/lib/supabase/ssr";
import { db } from "@/shared/db";
import { walletTransactions, familyWallets, familyMembers } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerActionClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, useWallet, amountCents } = await req.json();

  let walletDeduction = 0;
  let stripeAmount = amountCents;

  // Process wallet payment if requested
  if (useWallet) {
    // Get user's wallet
    const [wallet] = await db
      .select()
      .from(familyWallets)
      .where(eq(familyWallets.ownerId, session.user.id))
      .limit(1);

    if (wallet) {
      // Get current balance
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id));

      const balance = transactions.reduce((sum, t) => {
        if (t.type === "credit" || t.type === "gift" || t.type === "bonus") {
          return sum + t.amountCents;
        } else {
          return sum - t.amountCents;
        }
      }, 0);

      walletDeduction = Math.min(balance, amountCents);
      stripeAmount = amountCents - walletDeduction;

      // Deduct from wallet
      if (walletDeduction > 0) {
        await db.insert(walletTransactions).values({
          walletId: wallet.id,
          userId: session.user.id,
          type: "debit",
          amountCents: walletDeduction,
          source: `booking_${bookingId}`,
          metadata: { bookingId },
        });
      }
    }
  }

  // Process Stripe payment for remaining amount
  if (stripeAmount > 0) {
    // Create Stripe payment intent...
    // ... existing Stripe checkout logic
  }

  return NextResponse.json({
    success: true,
    walletDeduction,
    stripeAmount,
  });
}
```

### 3. Rewards Redemption Integration

To allow converting reward points to wallet credits:

```typescript
// app/api/rewards/convert/route.ts
export async function POST(req: NextRequest) {
  const { points } = await req.json();
  const pointsToCents = points * 10; // Example: 1 point = 10 cents

  // Get user's wallet
  const [wallet] = await db
    .select()
    .from(familyWallets)
    .where(eq(familyWallets.ownerId, session.user.id))
    .limit(1);

  if (!wallet) {
    // Create wallet if it doesn't exist
    // ...
  }

  // Add credit transaction
  await db.insert(walletTransactions).values({
    walletId: wallet.id,
    userId: session.user.id,
    type: "bonus",
    amountCents: pointsToCents,
    source: "rewards_conversion",
    metadata: { points },
  });

  return NextResponse.json({ success: true });
}
```

## Testing

1. Create a wallet and add credits
2. Attempt a booking with wallet balance sufficient to cover the full amount
3. Attempt a booking with partial wallet balance
4. Verify transactions are recorded correctly
5. Verify Stripe payment is only charged for remaining amount

## Notes

- Wallet balance should be checked in real-time during checkout
- Transactions should be created atomically with booking creation
- Consider adding a "wallet_payment" status to booking records
- Email notifications should be sent when wallet credits are used

