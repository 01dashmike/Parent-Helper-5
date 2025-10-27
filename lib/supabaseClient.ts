"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const createClient = () => createClientComponentClient();

type SupabaseBrowserClient = ReturnType<typeof createClient>;

let client: SupabaseBrowserClient | undefined;

export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (!client) {
    client = createClient();
  }
  return client;
}
