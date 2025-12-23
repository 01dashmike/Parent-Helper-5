import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserKey, getSupabaseBrowserUrl } from "@/lib/env";

// Allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://parenthelper.co.uk",
    "https://www.parenthelper.co.uk",
  ].filter(Boolean) as string[];
  
  // Allow localhost on any port in development
  if (process.env.NODE_ENV === "development") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002"
    );
  }
  
  return origins;
};

// Check if origin is allowed
function isAllowedOrigin(origin: string | null): boolean {
  // No origin header means same-origin request - always allow
  if (!origin) return true;
  
  // In development, allow all localhost origins
  if (process.env.NODE_ENV === "development") {
    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return true;
    }
  }
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed));
}

// Add CORS headers to response
function addCorsHeaders(res: NextResponse, origin: string | null): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  
  // If origin is in allowed list, reflect it back; otherwise use first allowed origin
  const corsOrigin = origin && isAllowedOrigin(origin) 
    ? origin 
    : allowedOrigins[0] || "*";
  
  res.headers.set("Access-Control-Allow-Origin", corsOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  res.headers.set("Access-Control-Allow-Credentials", "true");
  
  return res;
}

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return addCorsHeaders(preflightResponse, origin);
  }

  // Check CORS for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!isAllowedOrigin(origin)) {
      return new NextResponse(
        JSON.stringify({ error: "CORS error: Origin not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const res = NextResponse.next();
  
  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith("/api/")) {
    addCorsHeaders(res, origin);
  }
  
  const supabaseUrl = getSupabaseBrowserUrl();
  const supabaseAnonKey = getSupabaseBrowserKey();

  // Only refresh Supabase sessions if env vars are configured
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
              path: options?.path ?? "/",
              sameSite: options?.sameSite ?? "lax",
            });
          });
        },
      },
    });

    // Refresh session if it exists
    try {
      await supabase.auth.getSession();
    } catch (error) {
      // Silently fail - session refresh errors shouldn't break the request
      if (process.env.NODE_ENV === "development") {
        console.warn("[middleware] Session refresh failed:", error);
      }
    }
  }

  return res;
}

// Apply middleware to all routes except static files and upload endpoints
export const config = {
  matcher: [
    // Match all routes except:
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico
    // - upload-image API routes (to avoid body consumption issues)
    "/((?!_next/static|_next/image|favicon.ico|api/.*upload-image|api/stripe/webhook).*)",
  ],
};
