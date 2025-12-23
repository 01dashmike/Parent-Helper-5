"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
    createSupabaseServerActionClient,
    createSupabaseServerComponentClient,
} from "@/lib/supabase";
import type { AuthActionState } from "./state";

/**
 * Gets the current origin from headers or environment variable.
 * This works for localhost, production, and Cursor browser preview.
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
        // Headers might not be available in some contexts
        console.warn("[getOrigin] Could not get origin from headers:", error);
    }
    
    // Fallback to environment variable or default
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

const passwordSchema = z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters");

export async function requestOtpAction(
    _prevState: AuthActionState | null,
    formData: FormData
): Promise<AuthActionState> {
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
        console.log("[requestOtpAction] Requesting OTP for email:", email);
        const supabase = createSupabaseServerActionClient();

        // Get dynamic origin to support browser preview and different environments
        const origin = await getOrigin();
        // Use auth callback route to properly handle magic link token exchange
        const redirectUrl = `${origin}/provider/callback`;

        const { data: otpData, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                // emailRedirectTo is used for magic links when user clicks email link
                // The callback route will exchange the token for a session and redirect to /provider
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) {
            console.error("[requestOtpAction] Supabase error:", error.message, "Status:", error.status);
            return {
                status: "error",
                message: error.message ?? "Unable to send login code. Try again shortly.",
            };
        }

        console.log("[requestOtpAction] OTP sent successfully");

        return {
            status: "success",
            email,
            message: "Check your inbox for the 6-digit code.",
        };
    } catch (error: any) {
        console.error("[requestOtpAction] failed:", error);
        return {
            status: "error",
            message: error?.message ?? "Unexpected error. Please try again.",
        };
    }
}

export async function verifyOtpAction(
    _prevState: AuthActionState | null,
    formData: FormData
): Promise<AuthActionState> {
    try {
        const emailInput = formData.get("email");
        const tokenInput = formData.get("token");

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
        console.log("[verifyOtpAction] Verifying OTP for email:", email);

        const supabase = createSupabaseServerActionClient();
        const { data: verifyData, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email",
        });

        if (error) {
            console.error("[verifyOtpAction] Supabase error:", error.message, "Status:", error.status);
            return {
                status: "error",
                message: error.message ?? "Invalid or expired code.",
            };
        }

        console.log("[verifyOtpAction] OTP verified successfully, user ID:", verifyData?.user?.id);
        revalidatePath("/provider");
        redirect("/provider");
    } catch (error: any) {
        console.error("[verifyOtpAction] failed:", error);
        return {
            status: "error",
            message: error?.message ?? "Something went wrong. Please try again.",
        };
    }
}

export async function ensureLoggedOut() {
    try {
        const supabase = createSupabaseServerComponentClient();
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
            const actionClient = createSupabaseServerActionClient();
            await actionClient.auth.signOut();
        }
    } catch (error) {
        console.warn("[ensureLoggedOut] unable to clear session:", error);
    }
}

export async function signInWithPasswordAction(
    _prevState: AuthActionState | null,
    formData: FormData
): Promise<AuthActionState> {
    // Only allow password login in development
    if (process.env.NODE_ENV !== "development") {
        return {
            status: "error",
            message: "Password login is only available in development mode.",
        };
    }

    try {
        const rawEmail = formData.get("email");
        const rawPassword = formData.get("password");

        const emailResult = emailSchema.safeParse(typeof rawEmail === "string" ? rawEmail : "");
        if (!emailResult.success) {
            return {
                status: "error",
                message: emailResult.error.issues[0]?.message ?? "Email is required",
            };
        }

        const passwordResult = passwordSchema.safeParse(typeof rawPassword === "string" ? rawPassword : "");
        if (!passwordResult.success) {
            return {
                status: "error",
                message: passwordResult.error.issues[0]?.message ?? "Password is required",
            };
        }

        const email = emailResult.data.toLowerCase();
        const password = passwordResult.data;
        console.log("[signInWithPasswordAction] Signing in with password for email:", email);

        const supabase = createSupabaseServerActionClient();
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("[signInWithPasswordAction] Supabase error:", error.message, "Status:", error.status);
            return {
                status: "error",
                message: error.message ?? "Invalid email or password.",
            };
        }

        console.log("[signInWithPasswordAction] Signed in successfully, user ID:", authData?.user?.id);
        revalidatePath("/provider");
        redirect("/provider");
    } catch (error: any) {
        console.error("[signInWithPasswordAction] failed:", error);
        return {
            status: "error",
            message: error?.message ?? "Something went wrong. Please try again.",
        };
    }
}

export async function signOutAction() {
    try {
        const supabase = createSupabaseServerActionClient();
        await supabase.auth.signOut();
    } catch (error) {
        console.error("[signOutAction] failed:", error);
    } finally {
        redirect("/provider/login");
    }
}

