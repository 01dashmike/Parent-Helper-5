"use server";

/**
 * Booking Flow Server Actions
 * 
 * All server actions for the booking checkout flow
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { createBooking, createBlockBooking, type BookingInput, type ChildDetails } from "@/lib/bookings/booking";
import { checkSessionAvailability } from "@/lib/bookings/sessions";
import { getAvailableUpsells, trackUpsellView } from "@/lib/bookings/upsells";
import { redeemCreditsForBooking, redeemPassForBooking } from "@/lib/wallet/redemption";
import { trackWalletCreditSpent, trackWalletPassUsed } from "@/lib/bookings/analytics";
// Analytics tracking - placeholder for now
async function track(event: string, data: Record<string, any>) {
  // TODO: Implement analytics tracking
  console.log(`[Analytics] ${event}:`, data);
}
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Get provider context (verify user is not provider)
 */
async function getParentContext(): Promise<{ userId?: string; isProvider: boolean }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { isProvider: true }; // Fail safe
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isProvider: false };
  }

  // Check if user is a provider
  const { data: providerUser } = await supabase
    .from("providers_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .single();

  return {
    userId: user.id,
    isProvider: !!providerUser,
  };
}

/**
 * Check session availability
 */
export async function checkAvailability(sessionId: number, seats: number) {
  const result = await checkSessionAvailability(sessionId, seats);
  return result;
}

/**
 * Get available sessions for a class
 */
export async function getSessionsForClass(classId: number) {
  const { getAvailableSessions } = await import("@/lib/bookings/sessions");
  return getAvailableSessions(classId);
}

/**
 * Get upsells for checkout
 */
export async function getUpsellsForCheckout(providerId: number, classId: number) {
  const upsells = await getAvailableUpsells(providerId, classId);
  
  // Track views
  for (const upsell of upsells) {
    trackUpsellView(upsell.id).catch(console.error);
  }

  return upsells;
}

/**
 * Create booking (main action)
 */
export async function createBookingAction(formData: FormData) {
  const context = await getParentContext();
  if (context.isProvider) {
    return { success: false, error: "Providers cannot book their own classes" };
  }

  try {
    const data = z
      .object({
        sessionId: z.coerce.number().int().positive(),
        providerId: z.coerce.number().int().positive(),
        parentFirstName: z.string().min(1),
        parentLastName: z.string().min(1),
        parentEmail: z.string().email(),
        parentPhone: z.string().optional(),
        children: z.string().transform((s) => JSON.parse(s) as ChildDetails[]),
        bookingType: z.enum(["drop_in", "block", "free_rsvp"]),
        upsellItems: z.string().optional().transform((s) => (s ? JSON.parse(s) : [])),
        customFields: z.string().optional().transform((s) => (s ? JSON.parse(s) : {})),
        notes: z.string().optional(),
        linkedSessionIds: z.string().optional().transform((s) => (s ? JSON.parse(s) : [])),
      })
      .parse({
        sessionId: formData.get("sessionId"),
        providerId: formData.get("providerId"),
        parentFirstName: formData.get("parentFirstName"),
        parentLastName: formData.get("parentLastName"),
        parentEmail: formData.get("parentEmail"),
        parentPhone: formData.get("parentPhone") || undefined,
        children: formData.get("children"),
        bookingType: formData.get("bookingType") || "drop_in",
        upsellItems: formData.get("upsellItems") || undefined,
        customFields: formData.get("customFields") || undefined,
        notes: formData.get("notes") || undefined,
        linkedSessionIds: formData.get("linkedSessionIds") || undefined,
      });

    // Track booking started
    await track("booking_started", {
      class_id: (await getSupabaseServer()?.from("class_sessions").select("class_id").eq("id", data.sessionId).single())?.data?.class_id,
      provider_id: data.providerId,
      booking_type: data.bookingType,
    });

    const bookingInput: BookingInput = {
      ...data,
      userId: context.userId,
    };

    const result = await createBooking(bookingInput);

    if (result.success && result.bookingId) {
      // Track upsell acceptances
      if (data.upsellItems && Array.isArray(data.upsellItems)) {
        for (const upsell of data.upsellItems) {
          await track("upsell_accepted", {
            upsell_id: upsell.upsellId,
            booking_id: result.bookingId,
          });
        }
      }

      revalidatePath(`/class/${data.providerId}`);
      revalidatePath("/provider/bookings");
    }

    return result;
  } catch (error) {
    console.error("[createBookingAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

/**
 * Create block booking
 */
export async function createBlockBookingAction(formData: FormData) {
  const context = await getParentContext();
  if (context.isProvider) {
    return { success: false, error: "Providers cannot book their own classes" };
  }

  try {
    const data = z
      .object({
        classId: z.coerce.number().int().positive(),
        providerId: z.coerce.number().int().positive(),
        startSessionId: z.coerce.number().int().positive(),
        weekCount: z.coerce.number().int().min(2).max(12),
        parentFirstName: z.string().min(1),
        parentLastName: z.string().min(1),
        parentEmail: z.string().email(),
        parentPhone: z.string().optional(),
        children: z.string().transform((s) => JSON.parse(s) as ChildDetails[]),
        upsellItems: z.string().optional().transform((s) => (s ? JSON.parse(s) : [])),
      })
      .parse({
        classId: formData.get("classId"),
        providerId: formData.get("providerId"),
        startSessionId: formData.get("startSessionId"),
        weekCount: formData.get("weekCount"),
        parentFirstName: formData.get("parentFirstName"),
        parentLastName: formData.get("parentLastName"),
        parentEmail: formData.get("parentEmail"),
        parentPhone: formData.get("parentPhone") || undefined,
        children: formData.get("children"),
        upsellItems: formData.get("upsellItems") || undefined,
      });

    await track("block_booking_selected", {
      class_id: data.classId,
      week_count: data.weekCount,
    });

    const result = await createBlockBooking({
      ...data,
      userId: context.userId,
    });

    if (result.success) {
      revalidatePath(`/class/${data.classId}`);
      revalidatePath("/provider/bookings");
    }

    return result;
  } catch (error) {
    console.error("[createBlockBookingAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create block booking",
    };
  }
}

/**
 * Pay for booking with credits
 */
export async function payWithCredits(bookingId: string, classId: string, providerId: string) {
  const context = await getParentContext();
  if (!context.userId) {
    return { success: false, error: "Must be logged in" };
  }

  try {
    const result = await redeemCreditsForBooking(
      context.userId,
      bookingId,
      classId,
      providerId.toString()
    );

    if (!result.success) {
      return result;
    }

    // Track analytics
    await trackWalletCreditSpent({
      credits: result.creditsSpent,
      bookingId: parseInt(bookingId, 10),
      classId: parseInt(classId, 10),
      providerId: parseInt(providerId.toString(), 10),
    });

    // Update booking status to confirmed
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", parseInt(bookingId, 10));
    }

    return { success: true, creditsSpent: result.creditsSpent };
  } catch (error) {
    console.error("[payWithCredits] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pay with credits",
    };
  }
}

/**
 * Pay for booking with pass
 */
export async function payWithPass(bookingId: string, providerId: string) {
  const context = await getParentContext();
  if (!context.userId) {
    return { success: false, error: "Must be logged in" };
  }

  try {
    const result = await redeemPassForBooking(
      context.userId,
      bookingId,
      providerId.toString()
    );

    if (!result.success) {
      return result;
    }

    // Track analytics
    if (result.passId) {
      const supabase = getSupabaseServer();
      if (supabase) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("id", parseInt(bookingId, 10))
          .single();

        await trackWalletPassUsed({
          passId: result.passId,
          bookingId: parseInt(bookingId, 10),
          classId: booking?.class_id || 0,
        });
      }
    }

    // Update booking status to confirmed
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", parseInt(bookingId, 10));
    }

    return { success: true, passId: result.passId };
  } catch (error) {
    console.error("[payWithPass] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pay with pass",
    };
  }
}

