"use server";

interface BookingEmailPayload {
  class_id: string | number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  child_name: string;
  child_age: number;
  special_requirements?: string;
}

export async function sendBookingEmail(payload: BookingEmailPayload) {
  // Placeholder: integrate real email provider (Resend, Postmark, etc.)
  console.info("[booking-email] queued email", payload);
}
