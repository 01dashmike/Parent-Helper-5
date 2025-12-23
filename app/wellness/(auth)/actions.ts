"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerActionClient } from "@/lib/supabase";
import { upsertWellnessUser } from "@/lib/wellness/auth";

export type WellnessAuthState = {
  status: "success" | "error";
  message?: string;
  email?: string;
};

/**
 * Gets the current origin from headers or environment variable
 */
async function getOrigin(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || 
                    (process.env.NODE_ENV === "production" ? "https" : "http");
    
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    console.warn("[getOrigin] Could not get origin from headers:", error);
  }
  
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

const emailSchema = z
  .string()
  .trim()
  .min(5, "Email is required")
  .email("Enter a valid email address");

const otpSchema = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d{6}$/, "OTP must be a 6-digit code");

/**
 * Request OTP for wellness login/registration
 */
export async function requestWellnessOtpAction(
  _prevState: WellnessAuthState | null,
  formData: FormData
): Promise<WellnessAuthState> {
  try {
    const rawEmail = formData.get("email");
    const emailResult = emailSchema.safeParse(typeof rawEmail === "string" ? rawEmail : "");

    if (!emailResult.success) {
      return {
        status: "error",
        message: emailResult.error.issues[0]?.message ?? "Email is required",
      };
    }

    const email = emailResult.data.toLowerCase();
    console.log("[requestWellnessOtpAction] Requesting OTP for email:", email);
    const supabase = createSupabaseServerActionClient();

    const origin = await getOrigin();
    // Use auth callback route to properly handle magic link token exchange
    const redirectUrl = `${origin}/wellness/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // emailRedirectTo is used for magic links when user clicks email link
        // The callback route will exchange the token for a session and redirect to /wellness
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("[requestWellnessOtpAction] Supabase error:", error.message);
      return {
        status: "error",
        message: error.message ?? "Unable to send login code. Try again shortly.",
      };
    }

    console.log("[requestWellnessOtpAction] OTP sent successfully");

    return {
      status: "success",
      email,
      message: "Check your inbox for the 6-digit code.",
    };
  } catch (error: any) {
    console.error("[requestWellnessOtpAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Unexpected error. Please try again.",
    };
  }
}

/**
 * Verify OTP for wellness login/registration
 */
export async function verifyWellnessOtpAction(
  _prevState: WellnessAuthState | null,
  formData: FormData
): Promise<WellnessAuthState> {
  try {
    const emailInput = formData.get("email");
    const tokenInput = formData.get("token");
    const newsletterInput = formData.get("newsletter");
    const accountabilityInput = formData.get("accountability");
    const frequencyInput = formData.get("frequency");

    const emailResult = emailSchema.safeParse(
      typeof emailInput === "string" ? emailInput : ""
    );
    if (!emailResult.success) {
      return {
        status: "error",
        message: emailResult.error.issues[0]?.message ?? "Email is required",
      };
    }

    const otpResult = otpSchema.safeParse(typeof tokenInput === "string" ? tokenInput : "");
    if (!otpResult.success) {
      return {
        status: "error",
        message: otpResult.error.issues[0]?.message ?? "Invalid code",
      };
    }

    const email = emailResult.data.toLowerCase();
    const token = otpResult.data;
    const newsletterSubscribed = newsletterInput === "true" || newsletterInput === "on";
    const accountabilityEnabled = accountabilityInput === "true" || accountabilityInput === "on";
    const frequency = typeof frequencyInput === "string" && 
      ["weekly", "biweekly", "monthly"].includes(frequencyInput)
      ? (frequencyInput as "weekly" | "biweekly" | "monthly")
      : "weekly";

    console.log("[verifyWellnessOtpAction] Verifying OTP for email:", email);

    const supabase = createSupabaseServerActionClient();
    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      console.error("[verifyWellnessOtpAction] Supabase error:", error.message);
      return {
        status: "error",
        message: error.message ?? "Invalid or expired code.",
      };
    }

    console.log("[verifyWellnessOtpAction] OTP verified successfully, user ID:", verifyData?.user?.id);

    // Create/update wellness user record
    await upsertWellnessUser({
      email,
      newsletterSubscribed,
      accountabilityEmailsEnabled: accountabilityEnabled,
      accountabilityFrequency: accountabilityEnabled ? frequency : undefined,
    });

    // Subscribe to newsletter if opted in
    if (newsletterSubscribed) {
      try {
        // Check if newsletters table exists and add subscription
        const { error: newsletterError } = await supabase
          .from("newsletters")
          .upsert({
            email,
            is_active: true,
            subscribed_at: new Date().toISOString(),
          }, {
            onConflict: "email",
            ignoreDuplicates: true,
          });

        if (newsletterError) {
          console.warn("[verifyWellnessOtpAction] Newsletter subscription warning:", newsletterError);
        }
      } catch (error) {
        console.warn("[verifyWellnessOtpAction] Newsletter subscription error:", error);
      }
    }

    revalidatePath("/wellness");
    redirect("/wellness");
  } catch (error: any) {
    console.error("[verifyWellnessOtpAction] failed:", error);
    return {
      status: "error",
      message: error?.message ?? "Something went wrong. Please try again.",
    };
  }
}

/**
 * Sign out wellness user
 */
export async function signOutWellnessAction() {
  try {
    const supabase = createSupabaseServerActionClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[signOutWellnessAction] failed:", error);
  } finally {
    redirect("/wellness");
  }
}
