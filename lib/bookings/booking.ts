/**
 * Booking Management
 * 
 * Core booking creation and management functions
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { checkSessionAvailability, reserveSessionSeats, releaseSessionSeats } from "./sessions";
import { sendBookingConfirmationEmail } from "@/lib/emails/booking";
import { sendCancellationSuggestions } from "@/lib/notifications/automation";
// Analytics tracking - placeholder for now
async function track(event: string, data: Record<string, any>) {
  // TODO: Implement analytics tracking
  console.log(`[Analytics] ${event}:`, data);
}

export type ChildDetails = {
  name: string;
  age: number;
  notes?: string;
  allergies?: string;
};

export type BookingInput = {
  sessionId: number;
  providerId: number;
  userId?: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  children: ChildDetails[];
  bookingType: "drop_in" | "block" | "free_rsvp";
  upsellItems?: Array<{ upsellId: number; title: string; price: number }>;
  customFields?: Record<string, any>;
  notes?: string;
  linkedSessionIds?: number[]; // For block bookings
};

/**
 * Create a booking
 */
export async function createBooking(input: BookingInput): Promise<{ success: boolean; bookingId?: number; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Validate child ages against class age range
    const { data: classData } = await supabase
      .from("classes")
      .select("age_group_min, age_group_max")
      .eq("id", (await supabase.from("class_sessions").select("class_id").eq("id", input.sessionId).single()).data?.class_id)
      .single();

    if (classData) {
      for (const child of input.children) {
        const ageMonths = child.age * 12; // Assuming age is in years, convert to months
        if (ageMonths < (classData.age_group_min || 0) || ageMonths > (classData.age_group_max || 999)) {
          return {
            success: false,
            error: `Child ${child.name} (age ${child.age}) is outside the class age range (${classData.age_group_min}-${classData.age_group_max} months)`,
          };
        }
      }
    }

    // Check session availability
    const requestedSeats = input.children.length;
    const availability = await checkSessionAvailability(input.sessionId, requestedSeats);
    if (!availability.available) {
      return { success: false, error: availability.reason || "Session not available" };
    }

    // Calculate price
    let priceTotal = 0;
    if (input.bookingType !== "free_rsvp") {
      // Get class price (simplified - would need to check provider settings)
      const { data: classPrice } = await supabase
        .from("classes")
        .select("price")
        .eq("id", (await supabase.from("class_sessions").select("class_id").eq("id", input.sessionId).single()).data?.class_id)
        .single();

      // Parse price (e.g., "£10" or "10.00")
      const priceMatch = classPrice?.price?.match(/[\d.]+/);
      const sessionPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;
      priceTotal = sessionPrice * requestedSeats;

      // Add upsell prices
      if (input.upsellItems) {
        for (const upsell of input.upsellItems) {
          priceTotal += upsell.price;
        }
      }
    }

    // Reserve seats
    const reservation = await reserveSessionSeats(input.sessionId, requestedSeats);
    if (!reservation.success) {
      return { success: false, error: reservation.reason || "Failed to reserve seats" };
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        session_id: input.sessionId,
        provider_id: input.providerId,
        user_id: input.userId || null,
        parent_first_name: input.parentFirstName,
        parent_last_name: input.parentLastName,
        parent_email: input.parentEmail,
        parent_phone: input.parentPhone || null,
        children: input.children,
        status: "confirmed",
        booking_type: input.bookingType,
        price_total: priceTotal,
        upsell_items: input.upsellItems || [],
        linked_session_ids: input.linkedSessionIds || [],
        custom_fields: input.customFields || {},
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      // Release seats if booking creation failed
      await releaseSessionSeats(input.sessionId, requestedSeats);
      return { success: false, error: bookingError?.message || "Failed to create booking" };
    }

    // Track analytics
    await track("booking_completed", {
      booking_id: booking.id,
      class_id: (await supabase.from("class_sessions").select("class_id").eq("id", input.sessionId).single()).data?.class_id,
      provider_id: input.providerId,
      booking_type: input.bookingType,
      price_total: priceTotal,
      children_count: input.children.length,
    });

    // Send confirmation email (async, don't wait)
    sendBookingConfirmationEmail(booking.id).catch((error) => {
      console.error("Failed to send confirmation email:", error);
    });

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("[createBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

/**
 * Create block booking (multiple sessions)
 */
export async function createBlockBooking(params: {
  classId: number;
  providerId: number;
  userId?: string;
  startSessionId: number;
  weekCount: number;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  children: ChildDetails[];
  upsellItems?: Array<{ upsellId: number; title: string; price: number }>;
}): Promise<{ success: boolean; bookingIds?: number[]; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Get start session
    const { data: startSession } = await supabase
      .from("class_sessions")
      .select("id, class_id, start_time")
      .eq("id", params.startSessionId)
      .single();

    if (!startSession) {
      return { success: false, error: "Start session not found" };
    }

    // Get future sessions for this class
    const { data: futureSessions } = await supabase
      .from("class_sessions")
      .select("id, start_time")
      .eq("class_id", params.classId)
      .gte("start_time", startSession.start_time)
      .eq("is_cancelled", false)
      .order("start_time", { ascending: true })
      .limit(params.weekCount);

    if (!futureSessions || futureSessions.length < params.weekCount) {
      return {
        success: false,
        error: `Not enough future sessions available. Found ${futureSessions?.length || 0}, need ${params.weekCount}`,
      };
    }

    // Check availability for all sessions
    const requestedSeats = params.children.length;
    for (const session of futureSessions) {
      const availability = await checkSessionAvailability(session.id, requestedSeats);
      if (!availability.available) {
        return { success: false, error: `Session on ${session.start_time} is not available` };
      }
    }

    // Reserve seats for all sessions
    const sessionIds = futureSessions.map((s: { id: number }) => s.id);
    for (const sessionId of sessionIds) {
      const reservation = await reserveSessionSeats(sessionId, requestedSeats);
      if (!reservation.success) {
        // Release already reserved seats
        for (const releasedId of sessionIds.slice(0, sessionIds.indexOf(sessionId))) {
          await releaseSessionSeats(releasedId, requestedSeats);
        }
        return { success: false, error: reservation.reason || "Failed to reserve seats" };
      }
    }

    // Calculate price (simplified - would use block pricing)
    const { data: classPrice } = await supabase
      .from("classes")
      .select("price")
      .eq("id", params.classId)
      .single();

    const priceMatch = classPrice?.price?.match(/[\d.]+/);
    const sessionPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;
    let priceTotal = sessionPrice * requestedSeats * params.weekCount;

    // Add upsell prices
    if (params.upsellItems) {
      for (const upsell of params.upsellItems) {
        priceTotal += upsell.price;
      }
    }

    // Create booking for first session with linked sessions
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        session_id: params.startSessionId,
        provider_id: params.providerId,
        user_id: params.userId || null,
        parent_first_name: params.parentFirstName,
        parent_last_name: params.parentLastName,
        parent_email: params.parentEmail,
        parent_phone: params.parentPhone || null,
        children: params.children,
        status: "confirmed",
        booking_type: "block",
        price_total: priceTotal,
        upsell_items: params.upsellItems || [],
        linked_session_ids: sessionIds,
        custom_fields: {},
      })
      .select("id")
      .single();

    if (error || !booking) {
      // Release all seats
      for (const sessionId of sessionIds) {
        await releaseSessionSeats(sessionId, requestedSeats);
      }
      return { success: false, error: error?.message || "Failed to create booking" };
    }

    // Track analytics
    await track("block_booking_selected", {
      booking_id: booking.id,
      class_id: params.classId,
      week_count: params.weekCount,
    });

    // Send confirmation email
    sendBookingConfirmationEmail(booking.id).catch((error) => {
      console.error("Failed to send confirmation email:", error);
    });

    return { success: true, bookingIds: [booking.id] };
  } catch (error) {
    console.error("[createBlockBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create block booking",
    };
  }
}

/**
 * Cancel a booking
 * 
 * Also triggers cancellation suggestions if cancelled by provider
 */
export async function cancelBooking(
  bookingId: number,
  reason?: string,
  cancelledByProvider: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("session_id, linked_session_ids, children, status")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status === "cancelled") {
      return { success: false, error: "Booking already cancelled" };
    }

    // Release seats
    const seatsToRelease = Array.isArray(booking.children) ? booking.children.length : 1;

    if (booking.session_id) {
      await releaseSessionSeats(booking.session_id, seatsToRelease);
    }

    // Release linked session seats (for block bookings)
    if (Array.isArray(booking.linked_session_ids)) {
      for (const sessionId of booking.linked_session_ids) {
        await releaseSessionSeats(sessionId, seatsToRelease);
      }
    }

    // Get booking details for cancellation suggestions
    const { data: bookingDetails } = await supabase
      .from("bookings")
      .select("user_id, session_id, class_sessions!inner(classes!inner(id))")
      .eq("id", bookingId)
      .single();

    // Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        notes: reason ? `${booking.notes || ""}\nCancelled: ${reason}`.trim() : booking.notes,
      })
      .eq("id", bookingId);

    // If cancelled by provider and user exists, send cancellation suggestions
    if (cancelledByProvider && bookingDetails?.user_id && bookingDetails?.session_id) {
      const session = bookingDetails.class_sessions as any;
      const classData = session?.classes;
      if (classData?.id) {
        const { sendCancellationSuggestions } = await import("@/lib/notifications/automation");
        sendCancellationSuggestions(
          bookingId,
          classData.id,
          bookingDetails.user_id
        ).catch((error) => {
          console.error("[cancelBooking] Failed to send cancellation suggestions:", error);
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[cancelBooking] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel booking",
    };
  }
}

