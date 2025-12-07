import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserKey, getSupabaseBrowserUrl } from "@/lib/env";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
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
      console.warn("[middleware] Session refresh failed:", error);
    }
  }

  return res;
}

// Apply middleware to all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
