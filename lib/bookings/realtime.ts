/**
 * Real-time booking updates via Supabase channels
 * 
 * Publishes booking events to "booking_updates" channel for client-side subscriptions
 * 
 * Uses Supabase Realtime with service role for server-side publishing
 */

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerUrl, getSupabaseServerKey } from "@/lib/env";

export type BookingUpdateEvent = 
  | { type: "booking_created"; bookingId: string; email: string; status: string }
  | { type: "booking_cancelled"; bookingId: string; email: string }
  | { type: "payment_confirmed"; bookingId: string; email: string; amountCents: number };

/**
 * Get Supabase client with service role for server-side real-time publishing
 */
function getServiceRoleClient() {
  const url = getSupabaseServerUrl();
  const key = getSupabaseServerKey();
  
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured");
  }
  
  return createClient(url, key, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/**
 * Publish booking update to Supabase real-time channel
 * This allows clients to subscribe and receive real-time notifications
 */
export async function publishBookingUpdate(event: BookingUpdateEvent): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    
    // Create a channel and broadcast the event
    const channel = supabase.channel("booking_updates");
    
    // Subscribe to the channel (required before sending)
    await channel.subscribe();
    
    // Broadcast the event
    const result = await channel.send({
      type: "broadcast",
      event: event.type,
      payload: event,
    }) as { error?: Error | null };
    
    const { error } = result;

    // Unsubscribe after sending
    await channel.unsubscribe();

    if (error) {
      console.error("[booking-realtime] Failed to publish update:", error);
      // Don't throw - real-time updates are non-critical
      return;
    }

    console.log(`[booking-realtime] Published ${event.type} for booking ${event.bookingId}`);
  } catch (error) {
    console.error("[booking-realtime] Error publishing update:", error);
    // Don't throw - real-time updates should not break the main flow
  }
}

/**
 * Helper to publish booking created event
 */
export async function publishBookingCreated(params: {
  bookingId: string;
  email: string;
  status: string;
}): Promise<void> {
  await publishBookingUpdate({
    type: "booking_created",
    bookingId: params.bookingId,
    email: params.email,
    status: params.status,
  });
}

/**
 * Helper to publish booking cancelled event
 */
export async function publishBookingCancelled(params: {
  bookingId: string;
  email: string;
}): Promise<void> {
  await publishBookingUpdate({
    type: "booking_cancelled",
    bookingId: params.bookingId,
    email: params.email,
  });
}

/**
 * Helper to publish payment confirmed event
 */
export async function publishPaymentConfirmed(params: {
  bookingId: string;
  email: string;
  amountCents: number;
}): Promise<void> {
  await publishBookingUpdate({
    type: "payment_confirmed",
    bookingId: params.bookingId,
    email: params.email,
    amountCents: params.amountCents,
  });
}

