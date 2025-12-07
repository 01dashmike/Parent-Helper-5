"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase";

export async function approveLead(leadId: string) {
  try {
    const supabase = createSupabaseServerActionClient();
    
    const { error } = await supabase
      .from("provider_leads")
      .update({ status: "approved" })
      .eq("id", leadId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[approveLead] failed:", error);
    return { error: error?.message ?? "Failed to approve lead" };
  }
}

export async function updateLeadStatus(leadId: string, status: "new" | "approved" | "rejected") {
  try {
    const supabase = createSupabaseServerActionClient();
    
    const { error } = await supabase
      .from("provider_leads")
      .update({ status })
      .eq("id", leadId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("[updateLeadStatus] failed:", error);
    return { error: error?.message ?? "Failed to update lead status" };
  }
}
