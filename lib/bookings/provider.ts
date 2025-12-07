/**
 * Provider Booking Management
 * 
 * Functions for providers to view and manage bookings
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { cancelBooking } from "./booking";

export type ProviderBooking = {
  id: number;
  sessionId: number | null;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string | null;
  children: Array<{ name: string; age: number; notes?: string; allergies?: string }>;
  status: string;
  bookingType: string;
  priceTotal: number;
  upsellItems: Array<{ upsellId: number; title: string; price: number }>;
  notes: string | null;
  createdAt: Date;
  session?: {
    startTime: string;
    endTime: string;
    capacity: number;
    seatsTaken: number;
  };
  class?: {
    id: number;
    name: string;
    venue: string;
    address: string;
    town: string;
  };
};

export type ProviderBookingFilters = {
  from?: Date;
  to?: Date;
  status?: string;
  search?: string;
  classId?: number;
};

/**
 * Get bookings for a provider
 */
export async function getProviderBookings(
  providerId: number,
  filters: ProviderBookingFilters = {}
): Promise<ProviderBooking[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      class_sessions (
        start_time,
        end_time,
        capacity,
        seats_taken,
        classes (
          id,
          name,
          venue,
          address,
          town
        )
      )
    `
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  // Date range filter
  if (filters.from) {
    query = query.gte("created_at", filters.from.toISOString());
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to.toISOString());
  }

  // Status filter
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  // Search filter (parent name, child name, email)
  if (filters.search) {
    query = query.or(
      `parent_first_name.ilike.%${filters.search}%,parent_last_name.ilike.%${filters.search}%,parent_email.ilike.%${filters.search}%`
    );
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error("[getProviderBookings] Error:", error);
    return [];
  }

  return (bookings || []).map((b: any) => ({
    id: b.id,
    sessionId: b.session_id,
    parentFirstName: b.parent_first_name,
    parentLastName: b.parent_last_name,
    parentEmail: b.parent_email,
    parentPhone: b.parent_phone,
    children: (b.children as any) || [],
    status: b.status,
    bookingType: b.booking_type,
    priceTotal: parseFloat(b.price_total?.toString() || "0"),
    upsellItems: (b.upsell_items as any) || [],
    notes: b.notes,
    createdAt: new Date(b.created_at),
    session: b.class_sessions
      ? {
          startTime: b.class_sessions.start_time,
          endTime: b.class_sessions.end_time,
          capacity: b.class_sessions.capacity,
          seatsTaken: b.class_sessions.seats_taken || 0,
        }
      : undefined,
    class: (b.class_sessions as any)?.classes
      ? {
          id: (b.class_sessions as any).classes.id,
          name: (b.class_sessions as any).classes.name,
          venue: (b.class_sessions as any).classes.venue,
          address: (b.class_sessions as any).classes.address,
          town: (b.class_sessions as any).classes.town,
        }
      : undefined,
  }));
}

/**
 * Get booking by ID (provider-scoped)
 */
export async function getProviderBooking(
  providerId: number,
  bookingId: number
): Promise<ProviderBooking | null> {
  const bookings = await getProviderBookings(providerId, {});
  return bookings.find((b) => b.id === bookingId) || null;
}

/**
 * Cancel booking (provider action)
 */
export async function cancelProviderBooking(
  providerId: number,
  bookingId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify booking belongs to provider
  const booking = await getProviderBooking(providerId, bookingId);
  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  return cancelBooking(bookingId, reason, true); // cancelledByProvider = true
}

/**
 * Mark booking as attended
 */
export async function markBookingAttended(
  providerId: number,
  bookingId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  // Verify booking belongs to provider
  const booking = await getProviderBooking(providerId, bookingId);
  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "attended" })
    .eq("id", bookingId)
    .eq("provider_id", providerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get booking statistics for provider
 */
export async function getProviderBookingStats(
  providerId: number,
  from?: Date,
  to?: Date
): Promise<{
  total: number;
  confirmed: number;
  cancelled: number;
  attended: number;
  revenue: number;
}> {
  const bookings = await getProviderBookings(providerId, { from, to });

  return {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    attended: bookings.filter((b) => b.status === "attended").length,
    revenue: bookings
      .filter((b) => b.status === "confirmed" || b.status === "attended")
      .reduce((sum, b) => sum + b.priceTotal, 0),
  };
}

