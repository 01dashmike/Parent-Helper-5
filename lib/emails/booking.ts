/**
 * Booking Email Functions
 * 
 * Functions to send booking-related emails
 */

import { getSupabaseServer } from "@/lib/supabase/server";
// import { sendEmail } from "@/lib/emails/client"; // TODO: Implement email client

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(bookingId: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      class_sessions!inner(
        start_time,
        end_time,
        classes!inner(
          name,
          venue,
          address,
          town
        )
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking) {
    console.error(`[sendBookingConfirmationEmail] Booking ${bookingId} not found`);
    return;
  }

  // Mark as sent
  await supabase
    .from("bookings")
    .update({ confirmation_email_sent: true })
    .eq("id", bookingId);

  // TODO: Send email using email client
  // await sendEmail({
  //   to: booking.parent_email,
  //   subject: `Booking Confirmed: ${booking.class_sessions.classes.name}`,
  //   template: "BookingConfirmation",
  //   data: {
  //     booking,
  //     session: booking.class_sessions,
  //     class: booking.class_sessions.classes,
  //   },
  // });

  console.log(`[Email] Confirmation sent to ${booking.parent_email} for booking ${bookingId}`);
}

/**
 * Send booking reminder email (24 hours before)
 */
export async function sendBookingReminderEmail(bookingId: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      class_sessions!inner(
        start_time,
        end_time,
        classes!inner(
          name,
          venue,
          address,
          town
        )
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking || booking.reminder_email_sent) {
    return;
  }

  // Mark as sent
  await supabase
    .from("bookings")
    .update({ reminder_email_sent: true })
    .eq("id", bookingId);

  // TODO: Send email
  console.log(`[Email] Reminder sent to ${booking.parent_email} for booking ${bookingId}`);
}

/**
 * Send review request email (after class)
 */
export async function sendReviewRequestEmail(bookingId: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `
      *,
      class_sessions!inner(
        classes!inner(
          name,
          id
        )
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (!booking || booking.review_email_sent) {
    return;
  }

  // Mark as sent
  await supabase
    .from("bookings")
    .update({ review_email_sent: true })
    .eq("id", bookingId);

  // TODO: Send email
  console.log(`[Email] Review request sent to ${booking.parent_email} for booking ${bookingId}`);
}








