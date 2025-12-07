"use server";

/**
 * Security headers configuration
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateCSP } from "./csp";

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  nonce?: string
): NextResponse {
  // Content Security Policy
  const csp = generateCSP(nonce);
  response.headers.set("Content-Security-Policy", csp);

  // X-Frame-Options: Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Strict-Transport-Security: Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Permissions-Policy: Restrict browser features
  const permissions = [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "interest-cohort=()",
    "payment=()",
  ].join(", ");
  response.headers.set("Permissions-Policy", permissions);

  // X-XSS-Protection: Legacy XSS protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

