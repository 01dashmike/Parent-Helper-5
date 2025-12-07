import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeSecretKey(): string {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) {
        throw new Error("Stripe secret key (STRIPE_SECRET_KEY) is not configured");
    }
    return key;
}

export function getStripe(): Stripe {
    if (!stripeClient) {
        stripeClient = new Stripe(getStripeSecretKey());
    }
    return stripeClient;
}

export type StripeClient = Stripe;

