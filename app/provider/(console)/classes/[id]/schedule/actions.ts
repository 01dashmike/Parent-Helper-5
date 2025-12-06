"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../../../_lib/membership";
import { expandRecurrence, validateNoOverlaps } from "@/lib/utils/recurrence";

type CreateOccurrencesBatchParams = {
  classId: number;
  occurrences: Array<{ startAt: string; endAt: string }>;
  capacity: number | null;
  priceCents: number | null;
};

type CreateOccurrencesBatchResult =
  | { status: "success"; created: number; conflicts: number }
  | { status: "error"; message: string };

export async function createOccurrencesBatch(
  params: CreateOccurrencesBatchParams
): Promise<CreateOccurrencesBatchResult> {
  try {
    const supabase = createSupabaseServerActionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error", message: "Not authenticated" };
    }

    const membership = await getActiveMembershipForUser(supabase, user.id);
    if (!membership?.providers) {
      return { status: "error", message: "No active provider assigned" };
    }

    // Verify class ownership
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, provider_id")
      .eq("id", params.classId)
      .single();

    if (classError || !classData || classData.provider_id !== membership.provider_id) {
      return { status: "error", message: "Class not found or access denied" };
    }

    // Validate no overlaps within the batch
    const expandedOccurrences = params.occurrences.map((occ) => ({
      startAt: new Date(occ.startAt),
      endAt: new Date(occ.endAt),
    }));

    const validation = validateNoOverlaps(expandedOccurrences);
    if (!validation.valid) {
      return {
        status: "error",
        message: `Found ${validation.conflicts.length} overlapping occurrence(s) in the batch`,
      };
    }

    // Check for conflicts with existing occurrences
    let conflictCount = 0;
    const occurrencesToInsert: Array<{
      class_id: number;
      start_at: string;
      end_at: string;
      capacity: number | null;
      price_cents: number | null;
    }> = [];

    for (const occ of params.occurrences) {
      const startAt = new Date(occ.startAt);
      const endAt = new Date(occ.endAt);

      // Check for overlaps with existing occurrences
      // Overlap occurs when: (start_at < new_end) AND (end_at > new_start)
      // We need to check if any existing occurrence overlaps with the new one
      const { data: existing, error: checkError } = await supabase
        .from("class_occurrences")
        .select("id")
        .eq("class_id", params.classId)
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString())
        .limit(1);

      if (checkError) {
        console.error("Error checking conflicts:", checkError);
        // Continue anyway - the database trigger will catch it
      }

      if (existing && existing.length > 0) {
        conflictCount++;
        continue; // Skip this occurrence
      }

      occurrencesToInsert.push({
        class_id: params.classId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        capacity: params.capacity,
        price_cents: params.priceCents,
      });
    }

    if (occurrencesToInsert.length === 0) {
      return {
        status: "error",
        message: `All ${params.occurrences.length} occurrence(s) conflict with existing ones`,
      };
    }

    // Insert occurrences in a transaction
    const { error: insertError } = await supabase
      .from("class_occurrences")
      .insert(occurrencesToInsert);

    if (insertError) {
      // Check if it's an overlap error from the trigger
      if (insertError.message?.includes("Overlapping occurrence")) {
        return {
          status: "error",
          message: "Some occurrences overlap with existing ones. Please review and try again.",
        };
      }

      console.error("Error inserting occurrences:", insertError);
      return {
        status: "error",
        message: insertError.message || "Failed to create occurrences",
      };
    }

    revalidatePath(`/provider/classes/${params.classId}/schedule`);
    revalidatePath(`/provider/classes`);

    return {
      status: "success",
      created: occurrencesToInsert.length,
      conflicts: conflictCount,
    };
  } catch (error: any) {
    console.error("[createOccurrencesBatch] Error:", error);
    return {
      status: "error",
      message: error.message || "An unexpected error occurred",
    };
  }
}

