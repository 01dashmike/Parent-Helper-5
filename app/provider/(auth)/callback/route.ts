import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase";

/**
 * Auth callback route for provider magic links
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
    ? new URL("/provider", requestUrl.origin)
    : new URL("/provider/login?error=missing_token", requestUrl.origin);
  
  const response = NextResponse.redirect(redirectUrl);
  const supabase = createSupabaseRouteHandlerClient(request, response);

  // Verify magic link token if present
  if (hasToken) {
    const { error } = await supabase.auth.verifyOtp({
      ...(token_hash ? { token_hash } : { token }),
      type: "magiclink",
    });

    if (!error) {
      // Successfully authenticated, redirect to provider dashboard
      // Response already has cookies set from verifyOtp
      return response;
    }

    // Verification failed, redirect to login with error
    console.error("[provider/callback] Token verification failed:", error.message);
    return NextResponse.redirect(
      new URL("/provider/login?error=invalid_link", requestUrl.origin)
    );
  }

  // No token provided, redirect to login
  return response;
}
