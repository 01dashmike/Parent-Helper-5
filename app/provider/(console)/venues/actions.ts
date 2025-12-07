"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import { venueFormSchema } from "./schema";
import type { VenueActionState } from "./state";

async function resolveProviderContext() {
  const supabase = createSupabaseServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." as const };
  }

  const membership = await getActiveMembershipForUser(supabase, user.id);
  if (!membership || !membership.providers) {
    return { error: "No active provider assigned." as const };
  }

  return { supabase, providerId: membership.provider_id };
}

export async function createVenueAction(
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return { status: "error", message: context.error };
    }

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      addressLine1: formData.get("address_line1"),
      addressLine2: formData.get("address_line2"),
      city: formData.get("city"),
      county: formData.get("county"),
      postcode: formData.get("postcode"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website"),
    };

    const parsed = venueFormSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid venue details.",
      };
    }

    const { supabase, providerId } = context;
    const payload = parsed.data;

    const { error } = await supabase.from("venues").insert({
      provider_id: providerId,
      name: payload.name,
      slug: payload.slug || null,
      description: payload.description || null,
      address_line1: payload.addressLine1 || null,
      address_line2: payload.addressLine2 || null,
      city: payload.city || null,
      county: payload.county || null,
      postcode: payload.postcode || null,
      phone: payload.phone || null,
      email: payload.email,
      website: payload.website,
    });

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to create venue.",
      };
    }

    revalidatePath("/provider/venues");
    revalidatePath("/provider/classes");
    return { status: "success", message: "Venue created." };
  } catch (error: any) {
    console.error("[createVenueAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error creating venue.",
    };
  }
}

export async function updateVenueAction(
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return { status: "error", message: context.error };
    }

    const venueId = formData.get("venue_id");
    if (typeof venueId !== "string" || venueId.length === 0) {
      return { status: "error", message: "Missing venue id." };
    }

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      addressLine1: formData.get("address_line1"),
      addressLine2: formData.get("address_line2"),
      city: formData.get("city"),
      county: formData.get("county"),
      postcode: formData.get("postcode"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      website: formData.get("website"),
    };

    const parsed = venueFormSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid venue details.",
      };
    }

    const { supabase } = context;
    const payload = parsed.data;

    const { error } = await supabase
      .from("venues")
      .update({
        name: payload.name,
        slug: payload.slug || null,
        description: payload.description || null,
        address_line1: payload.addressLine1 || null,
        address_line2: payload.addressLine2 || null,
        city: payload.city || null,
        county: payload.county || null,
        postcode: payload.postcode || null,
        phone: payload.phone || null,
        email: payload.email,
        website: payload.website,
      })
      .eq("id", venueId);

    if (error) {
      return {
        status: "error",
        message: error.message ?? "Unable to update venue.",
      };
    }

    revalidatePath("/provider/venues");
    revalidatePath("/provider/classes");
    return { status: "success", message: "Venue updated." };
  } catch (error: any) {
    console.error("[updateVenueAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error updating venue.",
    };
  }
}

export async function deleteVenueAction(formData: FormData) {
  try {
    const context = await resolveProviderContext();
    if ("error" in context) {
      return;
    }

    const venueId = formData.get("venue_id");
    if (typeof venueId !== "string" || venueId.length === 0) {
      return;
    }

    const { supabase } = context;
    await supabase.from("venues").delete().eq("id", venueId);
  } catch (error) {
    console.error("[deleteVenueAction] failed:", error);
  } finally {
    revalidatePath("/provider/venues");
    revalidatePath("/provider/classes");
  }
}

