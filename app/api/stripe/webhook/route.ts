/**
 * Stripe Webhook Handler
 * 
 * Handles incoming Stripe webhook events with proper signature verification.
 * 
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Rejects requests without valid signatures
 * - Only processes expected event types
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { isBookingsFeatureEnabled } from "@/lib/env";
import type Stripe from "stripe";

// Event types we handle
const HANDLED_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
];

export async function POST(request: NextRequest) {
  // Check if bookings feature is enabled
  if (!isBookingsFeatureEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get the stripe-signature header
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // Verify webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the raw body for signature verification
  const body = await request.text();

  // Verify the webhook signature
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Only process expected event types
  if (!HANDLED_EVENT_TYPES.includes(event.type)) {
    // Acknowledge receipt of unhandled events
    return NextResponse.json({ received: true, handled: false });
  }

  // Process the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // This shouldn't happen due to the filter above
        break;
    }

    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", event.type);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Event handlers (implement based on your business logic)

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Handle successful checkout
  // TODO: Update booking status, send confirmation email, etc.
  console.log("[Stripe Webhook] Checkout session completed:", session.id);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Handle subscription created or updated
  // TODO: Update provider subscription status
  console.log("[Stripe Webhook] Subscription updated:", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Handle subscription cancelled
  // TODO: Update provider subscription status
  console.log("[Stripe Webhook] Subscription deleted:", subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment
  // TODO: Update payment records, send receipt
  console.log("[Stripe Webhook] Payment succeeded:", invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment
  // TODO: Notify customer, update records
  console.log("[Stripe Webhook] Payment failed:", invoice.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle successful payment intent
  console.log("[Stripe Webhook] Payment intent succeeded:", paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Handle failed payment intent
  console.log("[Stripe Webhook] Payment intent failed:", paymentIntent.id);
}
