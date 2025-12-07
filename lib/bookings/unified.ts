/**
 * Unified booking query helpers
 * 
 * These functions provide a unified interface for querying bookings,
 * checking simple_bookings first (new system) and falling back to bookings (legacy) if needed.
 * 
 * All NEW operations should use simple_bookings directly.
 * These helpers are for read-only operations that need to support both systems.
 */

import { getSupabaseServer } from "../supabase.server";

/**
 * Get booking by ID (checks simple_bookings first, then bookings)
 * 
 * @param bookingId - UUID (simple_bookings) or integer (bookings)
 * @returns Booking data or null if not found
 */
export async function getBookingById(bookingId: string | number) {
    const supabase = getSupabaseServer();
    if (!supabase) return null;

    // Try simple_bookings first (UUID)
    if (typeof bookingId === "string") {
        const { data: simpleBooking, error: sbError } = await supabase
            .from("simple_bookings")
            .select(`
                id,
                occurrence_id,
                email,
                amount_cents,
                currency,
                status,
                stripe_checkout_id,
                created_at,
                session_instances:occurrence_id (
                    starts_at,
                    ends_at,
                    class_sessions (
                        classes (
                            id,
                            name,
                            provider_id,
                            providers (
                                id,
                                name,
                                contact_email
                            )
                        )
                    )
                )
            `)
            .eq("id", bookingId)
            .single();

        if (!sbError && simpleBooking) {
            return {
                id: simpleBooking.id,
                type: "simple_booking" as const,
                email: simpleBooking.email,
                amountCents: simpleBooking.amount_cents,
                currency: simpleBooking.currency,
                status: simpleBooking.status,
                stripeCheckoutId: simpleBooking.stripe_checkout_id,
                createdAt: simpleBooking.created_at,
                occurrenceId: simpleBooking.occurrence_id,
                occurrence: simpleBooking.session_instances,
            };
        }
    }

    // Fall back to legacy bookings table (integer ID)
    if (typeof bookingId === "number" || (typeof bookingId === "string" && /^\d+$/.test(bookingId))) {
        const numericId = typeof bookingId === "string" ? parseInt(bookingId, 10) : bookingId;
        
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select(`
                id,
                booking_request_id,
                class_id,
                provider_id,
                parent_name,
                parent_email,
                child_name,
                session_date,
                sessions_booked,
                total_paid,
                confirmation_code,
                status,
                payment_status,
                created_at,
                classes:class_id (
                    id,
                    name,
                    providers:provider_id (
                        id,
                        name,
                        contact_email
                    )
                )
            `)
            .eq("id", numericId)
            .single();

        if (!bookingError && booking) {
            return {
                id: booking.id,
                type: "booking" as const,
                email: booking.parent_email,
                amountCents: Math.round(parseFloat(booking.total_paid || "0") * 100),
                currency: "gbp",
                status: booking.status,
                stripeCheckoutId: null,
                createdAt: booking.created_at,
                bookingRequestId: booking.booking_request_id,
                classId: booking.class_id,
                providerId: booking.provider_id,
                parentName: booking.parent_name,
                childName: booking.child_name,
                sessionDate: booking.session_date,
                sessionsBooked: booking.sessions_booked,
                confirmationCode: booking.confirmation_code,
                paymentStatus: booking.payment_status,
                class: booking.classes,
            };
        }
    }

    return null;
}

/**
 * Get user bookings (checks simple_bookings first, then bookings)
 * 
 * @param userEmail - User email address
 * @returns Array of bookings from both tables
 */
export async function getUserBookings(userEmail: string) {
    const supabase = getSupabaseServer();
    if (!supabase) return [];

    // Get simple_bookings
    const { data: simpleBookings, error: sbError } = await supabase
        .from("simple_bookings")
        .select(`
            id,
            occurrence_id,
            email,
            amount_cents,
            currency,
            status,
            stripe_checkout_id,
            created_at,
            session_instances:occurrence_id (
                starts_at,
                ends_at,
                class_sessions (
                    classes (
                        id,
                        name,
                        provider_id,
                        providers (
                            id,
                            name
                        )
                    )
                )
            )
        `)
        .eq("email", userEmail)
        .order("created_at", { ascending: false });

    // Get legacy bookings
    const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
            id,
            class_id,
            provider_id,
            parent_email,
            total_paid,
            status,
            session_date,
            created_at,
            classes:class_id (
                id,
                name,
                providers:provider_id (
                    id,
                    name
                )
            )
        `)
        .eq("parent_email", userEmail)
        .order("created_at", { ascending: false });

    type UnifiedBooking = {
        id: string | number;
        type: "simple_booking" | "booking";
        email: string;
        amountCents: number;
        currency: string;
        status: string;
        createdAt: string;
        occurrenceId?: number;
        occurrence?: any;
        classId?: number;
        providerId?: number;
        sessionDate?: string;
        class?: any;
    };

    const allBookings: UnifiedBooking[] = [];

    // Process simple_bookings
    if (!sbError && simpleBookings) {
        for (const sb of simpleBookings) {
            allBookings.push({
                id: sb.id,
                type: "simple_booking" as const,
                email: sb.email,
                amountCents: sb.amount_cents,
                currency: sb.currency,
                status: sb.status,
                createdAt: sb.created_at,
                occurrenceId: sb.occurrence_id,
                occurrence: sb.session_instances,
            });
        }
    }

    // Process legacy bookings
    if (!bookingsError && bookings) {
        for (const b of bookings) {
            allBookings.push({
                id: b.id,
                type: "booking" as const,
                email: b.parent_email,
                amountCents: Math.round(parseFloat(b.total_paid || "0") * 100),
                currency: "gbp",
                status: b.status,
                createdAt: b.created_at,
                classId: b.class_id,
                providerId: b.provider_id,
                sessionDate: b.session_date,
                class: b.classes,
            });
        }
    }

    // Sort by created_at descending
    return allBookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Check if booking exists (checks simple_bookings first, then bookings)
 * 
 * @param bookingId - UUID (simple_bookings) or integer (bookings)
 * @returns true if booking exists, false otherwise
 */
export async function bookingExists(bookingId: string | number): Promise<boolean> {
    const booking = await getBookingById(bookingId);
    return booking !== null;
}

