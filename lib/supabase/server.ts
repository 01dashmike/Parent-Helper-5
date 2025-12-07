import { getSupabaseServer } from "../supabase.server";

export function createServerClient() {
  const client = getSupabaseServer();
  if (!client) {
    throw new Error("Supabase server environment variables are not configured");
  }
  return client;
}

export const createClient = createServerClient;

// Re-export getSupabaseServer for backward compatibility
export { getSupabaseServer };

