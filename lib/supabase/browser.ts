"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseBrowserKey,
  getSupabaseBrowserUrl,
} from "@/lib/env";

/**
 * Creates a Supabase browser client.
 * 
 * This function should ONLY be called in client components.
 * For server components, use the server client from @/lib/supabase/server.
 * 
 * @throws {Error} If Supabase browser environment variables are missing
 * @returns A Supabase browser client instance
 */
export function createSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient() can only be called in client components. Use server client for server-side code.");
  }

  const url = getSupabaseBrowserUrl();
  const key = getSupabaseBrowserKey();

  if (!url || !key) {
    throw new Error("Supabase browser env vars missing");
  }

  return createBrowserClient(url, key);
}
