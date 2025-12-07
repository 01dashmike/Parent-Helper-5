/**
 * Booking Analytics Tracking
 * 
 * Wires booking events into the analytics system
 */

// Analytics tracking - integrate with your analytics system
async function track(event: string, data: Record<string, any>) {
  // TODO: Replace with your actual analytics tracking
  // Example: await fetch("/api/analytics", { method: "POST", body: JSON.stringify({ event, data }) });
  console.log(`[Analytics] ${event}:`, data);
}

/**
 * Track booking started event
 */
export async function trackBookingStarted(params: {
  classId: number;
  providerId: number;
  bookingType?: string;
}): Promise<void> {
  await track("booking_started", {
    class_id: params.classId,
    provider_id: params.providerId,
    booking_type: params.bookingType || "drop_in",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track wallet purchase started
 */
export async function trackWalletPurchaseStarted(params: {
  credits: number;
  pricePence: number;
}): Promise<void> {
  await track("wallet_purchase_started", {
    credits: params.credits,
    price_pence: params.pricePence,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track wallet purchase completed
 */
export async function trackWalletPurchaseCompleted(params: {
  credits: number;
  pricePence: number;
  userId: string;
}): Promise<void> {
  await track("wallet_purchase_completed", {
    credits: params.credits,
    price_pence: params.pricePence,
    user_id: params.userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track credit spent
 */
export async function trackWalletCreditSpent(params: {
  credits: number;
  bookingId: number;
  classId: number;
  providerId: number;
}): Promise<void> {
  await track("wallet_credit_spent", {
    credits: params.credits,
    booking_id: params.bookingId,
    class_id: params.classId,
    provider_id: params.providerId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track pass purchased
 */
export async function trackWalletPassPurchased(params: {
  passType: string;
  providerId: number;
  pricePence: number;
}): Promise<void> {
  await track("wallet_pass_purchased", {
    pass_type: params.passType,
    provider_id: params.providerId,
    price_pence: params.pricePence,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track pass used
 */
export async function trackWalletPassUsed(params: {
  passId: number;
  bookingId: number;
  classId: number;
}): Promise<void> {
  await track("wallet_pass_used", {
    pass_id: params.passId,
    booking_id: params.bookingId,
    class_id: params.classId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track booking completed event
 */
export async function trackBookingCompleted(params: {
  bookingId: number;
  classId: number;
  providerId: number;
  bookingType: string;
  totalAmount: number;
  childrenCount: number;
  upsellsCount: number;
}): Promise<void> {
  await track("booking_completed", {
    booking_id: params.bookingId,
    class_id: params.classId,
    provider_id: params.providerId,
    booking_type: params.bookingType,
    total_amount: params.totalAmount,
    children_count: params.childrenCount,
    upsells_count: params.upsellsCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track upsell viewed event
 */
export async function trackUpsellViewed(params: {
  upsellId: number;
  sessionId?: number;
  classId?: number;
}): Promise<void> {
  await track("upsell_viewed", {
    upsell_id: params.upsellId,
    session_id: params.sessionId,
    class_id: params.classId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track upsell accepted event
 */
export async function trackUpsellAccepted(params: {
  upsellId: number;
  bookingId: number;
  classId?: number;
}): Promise<void> {
  await track("upsell_accepted", {
    upsell_id: params.upsellId,
    booking_id: params.bookingId,
    class_id: params.classId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track block booking selected event
 */
export async function trackBlockBookingSelected(params: {
  classId: number;
  weekCount: number;
}): Promise<void> {
  await track("block_booking_selected", {
    class_id: params.classId,
    week_count: params.weekCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track class capacity exceeded event
 */
export async function trackClassCapacityExceeded(params: {
  sessionId: number;
  requestedSeats: number;
  availableSeats: number;
}): Promise<void> {
  await track("class_capacity_exceeded", {
    session_id: params.sessionId,
    requested_seats: params.requestedSeats,
    available_seats: params.availableSeats,
    timestamp: new Date().toISOString(),
  });
}

