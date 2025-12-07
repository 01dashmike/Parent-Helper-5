/**
 * Business-Critical Action Logging - Usage Examples
 * 
 * This file demonstrates how to use the logging utilities in your application.
 * These examples show common patterns for logging business-critical actions.
 */

import { logBooking, logPayment, logSearch, logProviderChange, logWallet } from "./logging";

// ============================================================================
// BOOKING LOGGING EXAMPLES
// ============================================================================

/**
 * Example: Log booking creation
 */
export async function exampleLogBookingCreation() {
  await logBooking({
    action: "booking_created",
    bookingRequestId: "12345",
    classId: 789,
    providerId: 456,
    parentEmail: "parent@example.com",
    amount: 25.00,
    currency: "gbp",
    paymentStatus: "pending",
    metadata: {
      childName: "Emma",
      childAge: 2,
      occurrenceId: 101,
    },
  });
}

/**
 * Example: Log booking confirmation
 */
export async function exampleLogBookingConfirmation() {
  await logBooking({
    action: "booking_confirmed",
    bookingId: "67890",
    bookingRequestId: "12345",
    classId: 789,
    providerId: 456,
    parentEmail: "parent@example.com",
    amount: 25.00,
    currency: "gbp",
    paymentStatus: "succeeded",
  });
}

/**
 * Example: Log booking failure
 */
export async function exampleLogBookingFailure() {
  await logBooking({
    action: "booking_failed",
    classId: 789,
    providerId: 456,
    error: "Payment processing failed",
    metadata: {
      errorCode: "STRIPE_ERROR",
      errorType: "PaymentIntentError",
    },
  });
}

// ============================================================================
// PAYMENT LOGGING EXAMPLES
// ============================================================================

/**
 * Example: Log payment initiation
 */
export async function exampleLogPaymentInitiation() {
  await logPayment({
    action: "payment_initiated",
    stripeCheckoutSessionId: "cs_test_123",
    amount: 25.00,
    currency: "gbp",
    bookingId: "12345",
    providerId: 456,
  });
}

/**
 * Example: Log successful payment
 */
export async function exampleLogPaymentSuccess() {
  await logPayment({
    action: "payment_succeeded",
    paymentId: "pi_1234567890",
    stripePaymentIntentId: "pi_1234567890",
    amount: 25.00,
    currency: "gbp",
    bookingId: "12345",
    providerId: 456,
  });
}

/**
 * Example: Log payment failure
 */
export async function exampleLogPaymentFailure() {
  await logPayment({
    action: "payment_failed",
    stripePaymentIntentId: "pi_1234567890",
    amount: 25.00,
    currency: "gbp",
    bookingId: "12345",
    providerId: 456,
    error: "Card declined",
    metadata: {
      declineCode: "insufficient_funds",
    },
  });
}

// ============================================================================
// SEARCH LOGGING EXAMPLES
// ============================================================================

/**
 * Example: Log search performed
 */
export async function exampleLogSearchPerformed() {
  await logSearch({
    action: "search_performed",
    searchQuery: "baby sensory",
    town: "London",
    category: "Sensory",
    age: "0-12",
  });
}

/**
 * Example: Log search result click
 */
export async function exampleLogSearchResultClick() {
  await logSearch({
    action: "result_clicked",
    searchQuery: "baby sensory",
    town: "London",
    category: "Sensory",
    age: "0-12",
    classId: 789,
    resultPosition: 3,
    isFeatured: true,
    metadata: {
      title: "Baby Sensory London",
      category: "Sensory",
      town: "London",
    },
  });
}

/**
 * Example: Log search result view
 */
export async function exampleLogSearchResultView() {
  await logSearch({
    action: "result_viewed",
    classId: 789,
    isFeatured: false,
    metadata: {
      title: "Baby Sensory London",
    },
  });
}

// ============================================================================
// PROVIDER CHANGE LOGGING EXAMPLES
// ============================================================================

/**
 * Example: Log provider update
 */
export async function exampleLogProviderUpdate() {
  await logProviderChange({
    action: "provider_updated",
    providerId: 456,
    field: "contact_email",
    oldValue: "old@example.com",
    newValue: "new@example.com",
    metadata: {
      updatedBy: "provider_user_123",
    },
  });
}

/**
 * Example: Log class creation
 */
export async function exampleLogClassCreation() {
  await logProviderChange({
    action: "class_created",
    providerId: 456,
    classId: 789,
    metadata: {
      className: "Baby Sensory London",
      category: "Sensory",
    },
  });
}

/**
 * Example: Log class update
 */
export async function exampleLogClassUpdate() {
  await logProviderChange({
    action: "class_updated",
    providerId: 456,
    classId: 789,
    field: "price",
    oldValue: "£20.00",
    newValue: "£25.00",
  });
}

/**
 * Example: Log class deletion
 */
export async function exampleLogClassDeletion() {
  await logProviderChange({
    action: "class_deleted",
    providerId: 456,
    classId: 789,
    metadata: {
      className: "Baby Sensory London",
      reason: "Provider request",
    },
  });
}

// ============================================================================
// WALLET LOGGING EXAMPLES
// ============================================================================

/**
 * Example: Log wallet credit
 */
export async function exampleLogWalletCredit() {
  await logWallet({
    action: "wallet_credited",
    walletId: "wallet_123",
    transactionId: "txn_456",
    amountCents: 5000, // £50.00
    reason: "Reward redemption",
    previousBalance: 10000,
    newBalance: 15000,
    userId: "user_789",
    metadata: {
      rewardId: "reward_123",
      source: "referral_bonus",
    },
  });
}

/**
 * Example: Log wallet debit
 */
export async function exampleLogWalletDebit() {
  await logWallet({
    action: "wallet_debited",
    walletId: "wallet_123",
    transactionId: "txn_789",
    amountCents: 2500, // £25.00
    reason: "Booking payment",
    previousBalance: 15000,
    newBalance: 12500,
    userId: "user_789",
    metadata: {
      bookingId: "booking_456",
      classId: 789,
    },
  });
}

/**
 * Example: Log wallet refund
 */
export async function exampleLogWalletRefund() {
  await logWallet({
    action: "wallet_refund",
    walletId: "wallet_123",
    transactionId: "txn_refund_456",
    amountCents: 2500, // £25.00
    reason: "Booking cancellation refund",
    previousBalance: 12500,
    newBalance: 15000,
    userId: "user_789",
    metadata: {
      bookingId: "booking_456",
      refundReason: "Customer request",
    },
  });
}

