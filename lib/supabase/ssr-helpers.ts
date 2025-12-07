import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserKey, getSupabaseBrowserUrl } from "@/lib/env";

const SUPABASE_URL = getSupabaseBrowserUrl();
const SUPABASE_ANON_KEY = getSupabaseBrowserKey();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase/ssr] Supabase environment variables are missing. Authentication features will be disabled.",
  );
}

type CookieSource = {
  getAll(): { name: string; value: string }[];
  setAll?(cookies: { name: string; value: string; options: Record<string, unknown> }[]): void;
};

function mapCookies(source: CookieSource["getAll"]): { name: string; value: string }[] {
  try {
    return source().map(({ name, value }) => ({ name, value }));
  } catch {
    return [];
  }
}

function enhanceOptions(options?: Record<string, unknown>): { path: string; sameSite: "lax" | "strict" | "none" } {
  return {
    path: "/",
    sameSite: (options?.["sameSite"] as "lax" | "strict" | "none" | undefined) ?? "lax",
  };
}

export const createSupabaseServerComponentClient = cache(() => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return mapCookies(() => cookieStore.getAll());
      },
    },
  });
});

export function createSupabaseServerActionClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return mapCookies(() => cookieStore.getAll());
      },
      async setAll(cookiesToSet) {
        const cookieStore = await cookies();
        cookiesToSet.forEach(({ name, value, options }) => {
          const enhanced = enhanceOptions(options);
          cookieStore.set(name, value, enhanced);
        });
      },
    },
  });
}

export function createSupabaseRouteHandlerClient(req: NextRequest, res: NextResponse) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return mapCookies(() => req.cookies.getAll());
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, enhanceOptions(options));
        });
      },
    },
  });
}

