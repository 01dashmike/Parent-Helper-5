"use client";

import { useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { BookingUpdateEvent } from "@/lib/bookings/realtime";

type BookingUpdateCallback = (event: BookingUpdateEvent) => void;

/**
 * Hook to subscribe to real-time booking updates
 * 
 * @param onUpdate - Callback function called when a booking update is received
 * @param userEmail - Optional email filter to only receive updates for the current user
 */
export function useBookingUpdates(
  onUpdate: BookingUpdateCallback,
  userEmail?: string
) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Subscribe to the booking_updates channel
    const channel = supabase.channel("booking_updates");

    // Listen for broadcast events
    channel.on("broadcast", { event: "*" }, (payload) => {
      const event = payload.payload as BookingUpdateEvent;
      
      // Filter by user email if provided
      if (userEmail && event.email !== userEmail) {
        return;
      }
      
      // Call the callback with the event
      onUpdate(event);
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[useBookingUpdates] Subscribed to booking_updates channel");
      } else if (status === "CHANNEL_ERROR") {
        console.error("[useBookingUpdates] Channel subscription error");
      }
    });

    // Cleanup: unsubscribe when component unmounts
    return () => {
      channel.unsubscribe();
      console.log("[useBookingUpdates] Unsubscribed from booking_updates channel");
    };
  }, [onUpdate, userEmail]);
}

