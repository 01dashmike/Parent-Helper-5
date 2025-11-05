import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseBrowserKey,
  getSupabaseBrowserUrl,
  hasSupabaseBrowserEnv,
  hasSupabaseServerEnv,
} from "./env";

export { hasSupabaseBrowserEnv, hasSupabaseServerEnv } from "./env";

export const supabaseBrowser = () => {
  const url = getSupabaseBrowserUrl();
  const key = getSupabaseBrowserKey();
  if (!url || !key) {
    throw new Error("Supabase browser environment variables are not configured");
  }
  return createClient(url, key);
};
