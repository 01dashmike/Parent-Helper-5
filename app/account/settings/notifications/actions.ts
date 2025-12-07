"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase";

export async function saveNotificationSettings(formData: FormData) {
  try {
    const supabase = createSupabaseServerActionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const emailMarketingOptIn = formData.get("emailMarketingOptIn") === "true";
    const emailTransactionalOptIn = formData.get("emailTransactionalOptIn") === "true";
    const smsOptIn = formData.get("smsOptIn") === "true";

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          email_marketing_opt_in: emailMarketingOptIn,
          email_transactional_opt_in: emailTransactionalOptIn,
          sms_opt_in: smsOptIn,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/account/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[saveNotificationSettings] failed:", error);
    return { error: error?.message ?? "Failed to save notification settings" };
  }
}
