/**
 * Stripe Client Utilities
 * 
 * Stripe initialization and helper functions
 */

import Stripe from "stripe";

export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!, {
  apiVersion: "2025-08-27.basil",
});

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get or create Stripe customer for provider
 */
export async function getOrCreateStripeCustomer(
  providerId: number,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  const supabase = await import("@/lib/supabase.server").then((m) => m.getSupabaseServer());
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Check if customer already exists
  const { data: existingSubscription } = await supabase
    .from("provider_subscriptions")
    .select("stripe_customer_id")
    .eq("provider_id", providerId)
    .not("stripe_customer_id", "is", null)
    .single();

  if (existingSubscription?.stripe_customer_id) {
    const customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
    if (!customer.deleted) {
      return customer as Stripe.Customer;
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      provider_id: providerId.toString(),
    },
  });

  // Update subscription record if exists
  if (existingSubscription) {
    await supabase
      .from("provider_subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("provider_id", providerId);
  }

  return customer;
}

/**
 * Create checkout session
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
    subscription_data: {
      metadata: params.metadata || {},
    },
  });
}

/**
 * Create customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

