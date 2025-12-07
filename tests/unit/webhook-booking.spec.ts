import { describe, it, expect, beforeEach } from "@playwright/test";

// Mock Stripe webhook event structure
type MockStripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  payment_link: string | null;
  customer_details: {
    email: string | null;
  } | null;
  customer_email: string | null;
  amount_total: number;
  currency: string;
  metadata: {
    occurrence_id?: string;
  } | null;
};

type MockWebhookEvent = {
  type: string;
  data: {
    object: MockStripeCheckoutSession;
  };
};

describe("Stripe Webhook - Booking Creation", () => {
  let mockSession: MockStripeCheckoutSession;

  beforeEach(() => {
    mockSession = {
      id: "cs_test_1234567890",
      object: "checkout.session",
      payment_link: "plink_test_123",
      customer_details: {
        email: "customer@example.com",
      },
      customer_email: null,
      amount_total: 2500, // £25.00
      currency: "gbp",
      metadata: {
        occurrence_id: "42",
      },
    };
  });

  it("should extract booking data from checkout.session.completed event", () => {
    const event: MockWebhookEvent = {
      type: "checkout.session.completed",
      data: {
        object: mockSession,
      },
    };

    const session = event.data.object;
    const customerEmail = session.customer_details?.email || session.customer_email;
    const amountTotal = session.amount_total || 0;
    const currency = session.currency || "gbp";
    const occurrenceIdStr = session.metadata?.occurrence_id;

    expect(customerEmail).toBe("customer@example.com");
    expect(amountTotal).toBe(2500);
    expect(currency).toBe("gbp");
    expect(occurrenceIdStr).toBe("42");
  });

  it("should handle missing customer email gracefully", () => {
    const sessionWithoutEmail: MockStripeCheckoutSession = {
      ...mockSession,
      customer_details: null,
      customer_email: null,
    };

    const customerEmail = sessionWithoutEmail.customer_details?.email || sessionWithoutEmail.customer_email;
    expect(customerEmail).toBeNull();
  });

  it("should handle missing occurrence_id in metadata", () => {
    const sessionWithoutOccurrence: MockStripeCheckoutSession = {
      ...mockSession,
      metadata: null,
    };

    const occurrenceIdStr = sessionWithoutOccurrence.metadata?.occurrence_id;
    expect(occurrenceIdStr).toBeUndefined();
  });

  it("should validate Payment Link checkout", () => {
    const sessionWithPaymentLink: MockStripeCheckoutSession = {
      ...mockSession,
      payment_link: "plink_test_123",
    };

    const isPaymentLink = Boolean(sessionWithPaymentLink.payment_link);
    expect(isPaymentLink).toBe(true);
  });

  it("should skip non-Payment Link checkouts", () => {
    const sessionWithoutPaymentLink: MockStripeCheckoutSession = {
      ...mockSession,
      payment_link: null,
    };

    const isPaymentLink = Boolean(sessionWithoutPaymentLink.payment_link);
    expect(isPaymentLink).toBe(false);
  });

  it("should parse occurrence_id as integer", () => {
    const occurrenceIdStr = mockSession.metadata?.occurrence_id;
    if (occurrenceIdStr) {
      const occurrenceId = Number.parseInt(occurrenceIdStr, 10);
      expect(occurrenceId).toBe(42);
      expect(Number.isNaN(occurrenceId)).toBe(false);
    }
  });

  it("should handle invalid occurrence_id", () => {
    const sessionWithInvalidOccurrence: MockStripeCheckoutSession = {
      ...mockSession,
      metadata: {
        occurrence_id: "not-a-number",
      },
    };

    const occurrenceIdStr = sessionWithInvalidOccurrence.metadata?.occurrence_id;
    if (occurrenceIdStr) {
      const occurrenceId = Number.parseInt(occurrenceIdStr, 10);
      expect(Number.isNaN(occurrenceId)).toBe(true);
    }
  });

  it("should calculate amount in currency units", () => {
    const amountTotal = mockSession.amount_total;
    const amount = amountTotal / 100;
    expect(amount).toBe(25.0);
  });

  it("should format currency correctly", () => {
    const amountTotal = mockSession.amount_total;
    const currency = mockSession.currency;
    const amount = amountTotal / 100;

    const formatted = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);

    expect(formatted).toBe("£25.00");
  });
});

