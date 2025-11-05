import { createRequire } from "module";
import {
  getSupabaseServerKey,
  getSupabaseServerUrl,
} from "./env";

const require = createRequire(import.meta.url);

export function getSupabaseServer() {
  const url = getSupabaseServerUrl();
  const key = getSupabaseServerKey();

  if (!url || !key) return null;

  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}
