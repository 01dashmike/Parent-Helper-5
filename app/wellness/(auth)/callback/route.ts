import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";
import { upsertWellnessUser } from "@/lib/wellness/auth";

/**
 * Auth callback route for wellness magic links
 * Handles token exchange from email links and establishes session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");

  // Create response for cookie handling
  const hasToken = (token_hash || token) && type === "magiclink";
  const redirectUrl = hasToken
    ? new URL("/wellness", requestUrl.origin)
    : new URL("/wellness/login?error=missing_token", requestUrl.origin);
  
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createSupabaseRouteHandlerClient(request, response);

  // Verify magic link token if present
  if (hasToken) {
    const { data, error } = await supabase.auth.verifyOtp({
      ...(token_hash ? { token_hash } : { token }),
      type: "magiclink",
    });

    if (!error && data?.user) {
      // Successfully authenticated, ensure wellness user record exists
      try {
        await upsertWellnessUser({
          email: data.user.email!,
        });
      } catch (error) {
        // Log but don't fail - user is authenticated even if wellness record creation fails
        console.warn("[wellness/callback] Failed to upsert wellness user:", error);
      }

      // Redirect to wellness dashboard
      // Response already has cookies set from verifyOtp
      return response;
    }

    // Verification failed, redirect to login with error
    console.error("[wellness/callback] Token verification failed:", error?.message);
    return NextResponse.redirect(
      new URL("/wellness/login?error=invalid_link", requestUrl.origin)
    );
  }

  // No token provided, redirect to login
  return response;
}
