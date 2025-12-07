import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { getSupabaseServer } from "@/lib/supabase.server";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch Stripe payouts for a date range with caching
 */
export async function fetchStripePayouts(
  from: Date,
  to: Date,
  stripeAccountId?: string
): Promise<Stripe.Payout[]> {
  const supabase = getSupabaseServer();
  
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Check cache first
  const cacheCutoff = new Date(Date.now() - CACHE_TTL_MS);

  const { data: cached } = await supabase
    .from("stripe_payouts_cache")
    .select("payout_id, arrival_date, amount, currency, status")
    .gte("arrival_date", from.toISOString())
    .lte("arrival_date", to.toISOString())
    .gte("cached_at", cacheCutoff.toISOString());

  if (cached && cached.length > 0) {
    // Return cached data (we'll need to fetch full details if needed)
    // For now, fetch from Stripe but respect rate limits
    const payoutIds = cached.map((p: { payout_id: string }) => p.payout_id);
    const payouts: Stripe.Payout[] = [];

    // Fetch payouts in batches to respect rate limits
    for (const payoutId of payoutIds) {
      try {
        const payout = await stripe.payouts.retrieve(payoutId, {
          ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
        });
        payouts.push(payout);
        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch payout ${payoutId}:`, error);
      }
    }

    return payouts;
  }

  // Fetch from Stripe
  const allPayouts: Stripe.Payout[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.PayoutListParams = {
      created: {
        gte: Math.floor(from.getTime() / 1000),
        lte: Math.floor(to.getTime() / 1000),
      },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    };

    const listParams = stripeAccountId
      ? { ...params, stripeAccount: stripeAccountId }
      : params;

    const payouts = await stripe.payouts.list(listParams);
    allPayouts.push(...payouts.data);

    hasMore = payouts.has_more;
    if (payouts.data.length > 0) {
      startingAfter = payouts.data[payouts.data.length - 1].id;
    }

    // Cache the payouts
    for (const payout of payouts.data) {
      await supabase.from("stripe_payouts_cache").upsert({
        payout_id: payout.id,
        arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        cached_at: new Date().toISOString(),
      });
    }

    // Rate limiting: wait between requests
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allPayouts;
}

/**
 * Fetch Stripe balance transactions for a date range with caching
 */
export async function fetchStripeBalanceTransactions(
  from: Date,
  to: Date,
  payoutId?: string,
  stripeAccountId?: string
): Promise<Stripe.BalanceTransaction[]> {
  const supabase = getSupabaseServer();
  
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Check cache first
  const cacheCutoff = new Date(Date.now() - CACHE_TTL_MS);
  let cached: Array<Record<string, unknown>> = [];

  if (payoutId) {
    const { data } = await supabase
      .from("stripe_balance_tx_cache")
      .select("*")
      .eq("payout_id", payoutId)
      .gte("cached_at", cacheCutoff.toISOString());
    cached = data || [];
  } else {
    const { data } = await supabase
      .from("stripe_balance_tx_cache")
      .select("*")
      .gte("created", from.toISOString())
      .lte("created", to.toISOString())
      .gte("cached_at", cacheCutoff.toISOString());
    cached = data || [];
  }

  if (cached && cached.length > 0) {
    // Return cached data (fetch full details if needed)
    const txIds = cached.map((tx) => tx.balance_tx_id).filter((id): id is string => typeof id === "string");
    const transactions: Stripe.BalanceTransaction[] = [];

    for (const txId of txIds) {
      try {
        const tx = await stripe.balanceTransactions.retrieve(txId, {
          ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
        });
        transactions.push(tx);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch balance transaction ${txId}:`, error);
      }
    }

    return transactions;
  }

  // Fetch from Stripe
  const allTransactions: Stripe.BalanceTransaction[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.BalanceTransactionListParams = {
      created: {
        gte: Math.floor(from.getTime() / 1000),
        lte: Math.floor(to.getTime() / 1000),
      },
      limit: 100,
      ...(payoutId ? { payout: payoutId } : {}),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    };

    const listParams = stripeAccountId
      ? { ...params, stripeAccount: stripeAccountId }
      : params;

    const transactions = await stripe.balanceTransactions.list(listParams);
    allTransactions.push(...transactions.data);

    // Cache the transactions
    for (const tx of transactions.data) {
      const txWithPayout = tx as Stripe.BalanceTransaction & { payout?: string | { id?: string } | null };
      await supabase.from("stripe_balance_tx_cache").upsert({
        balance_tx_id: tx.id,
        type: tx.type,
        net: tx.net,
        fee: tx.fee,
        source_id: tx.source as string | null,
        payout_id: typeof txWithPayout.payout === "string" ? txWithPayout.payout : txWithPayout.payout?.id || null,
        created: new Date(tx.created * 1000).toISOString(),
        cached_at: new Date().toISOString(),
      });
    }

    hasMore = transactions.has_more;
    if (transactions.data.length > 0) {
      startingAfter = transactions.data[transactions.data.length - 1].id;
    }

    // Rate limiting
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allTransactions;
}

/**
 * Get booking IDs from Stripe charge metadata
 */
export async function getBookingIdsFromCharge(
  chargeId: string,
  stripeAccountId?: string
): Promise<number[]> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
    });

    const bookingIds: number[] = [];
    if (charge.metadata?.["booking_id"]) {
      const bookingId = parseInt(charge.metadata["booking_id"], 10);
      if (!isNaN(bookingId)) {
        bookingIds.push(bookingId);
      }
    }

    // Also check if there are multiple booking IDs (comma-separated)
    if (charge.metadata?.["booking_ids"]) {
      const ids = charge.metadata["booking_ids"].split(",").map((id) => parseInt(id.trim(), 10));
      bookingIds.push(...ids.filter((id) => !isNaN(id)));
    }

    return bookingIds;
  } catch (error) {
    console.error(`Failed to fetch charge ${chargeId}:`, error);
    return [];
  }
}

/**
 * Hydrate balance transactions with booking IDs from charge metadata
 */
export async function hydrateBalanceTransactionsWithBookings(
  transactions: Stripe.BalanceTransaction[],
  stripeAccountId?: string
): Promise<Array<Stripe.BalanceTransaction & { bookingIds: number[] }>> {
  const hydrated = await Promise.all(
    transactions.map(async (tx) => {
      let bookingIds: number[] = [];

      // Only process charge-related transactions
      if (tx.type === "charge" && typeof tx.source === "string") {
        bookingIds = await getBookingIdsFromCharge(tx.source, stripeAccountId);
        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        ...tx,
        bookingIds,
      };
    })
  );

  return hydrated;
}

