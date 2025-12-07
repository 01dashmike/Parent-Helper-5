/**
 * Business-Critical Action Logging
 * 
 * Centralized logging utility for tracking business-critical actions.
 * All logs are sent to /api/logs endpoint for centralized storage and analysis.
 */

export type LogLevel = "info" | "warning" | "error" | "critical";

export interface BaseLogData {
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface BookingLogData extends BaseLogData {
  action: "booking_created" | "booking_confirmed" | "booking_cancelled" | "booking_failed";
  bookingId?: string;
  bookingRequestId?: string;
  classId: number;
  providerId: number;
  parentEmail?: string;
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  error?: string;
}

export interface PaymentLogData extends BaseLogData {
  action: "payment_initiated" | "payment_succeeded" | "payment_failed" | "payment_refunded";
  paymentId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  amount?: number;
  currency?: string;
  bookingId?: string;
  providerId?: number;
  error?: string;
}

export interface SearchLogData extends BaseLogData {
  action: "search_performed" | "result_clicked" | "result_viewed";
  searchQuery?: string;
  town?: string;
  category?: string;
  age?: string;
  classId?: number;
  resultPosition?: number;
  isFeatured?: boolean;
}

export interface ProviderChangeLogData extends BaseLogData {
  action: "provider_created" | "provider_updated" | "class_created" | "class_updated" | "class_deleted" | "settings_changed";
  providerId: number;
  classId?: number;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  error?: string;
}

export interface WalletLogData extends BaseLogData {
  action: "wallet_credited" | "wallet_debited" | "wallet_transfer" | "wallet_refund";
  walletId?: string;
  transactionId?: string;
  amountCents: number;
  reason?: string;
  previousBalance?: number;
  newBalance?: number;
  error?: string;
}

type LogData = BookingLogData | PaymentLogData | SearchLogData | ProviderChangeLogData | WalletLogData;

/**
 * Send log to /api/logs endpoint
 */
async function sendLog(type: string, level: LogLevel, data: LogData): Promise<void> {
  try {
    const logPayload = {
      type,
      level,
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Only send in browser environment
    if (typeof window !== "undefined") {
      // Fire and forget - don't block the main flow
      fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logPayload),
      }).catch((error) => {
        // Silently fail - logging should never break the app
        console.error("[Logging] Failed to send log:", error);
      });
    } else {
      // Server-side: log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`[${type}]`, logPayload);
      }
    }
  } catch (error) {
    // Silently fail - logging should never break the app
    console.error("[Logging] Error sending log:", error);
  }
}

/**
 * Log booking-related actions
 */
export async function logBooking(data: BookingLogData): Promise<void> {
  await sendLog("booking", data.error ? "error" : "info", data);
}

/**
 * Log payment-related actions
 */
export async function logPayment(data: PaymentLogData): Promise<void> {
  const level: LogLevel = data.error ? "error" : data.action === "payment_succeeded" ? "info" : "warning";
  await sendLog("payment", level, data);
}

/**
 * Log search-related actions
 */
export async function logSearch(data: SearchLogData): Promise<void> {
  await sendLog("search", "info", data);
}

/**
 * Log provider change actions
 */
export async function logProviderChange(data: ProviderChangeLogData): Promise<void> {
  const level: LogLevel = data.error ? "error" : "info";
  await sendLog("provider_change", level, data);
}

/**
 * Log wallet-related actions
 */
export async function logWallet(data: WalletLogData): Promise<void> {
  const level: LogLevel = data.error ? "error" : "info";
  await sendLog("wallet", level, data);
}

