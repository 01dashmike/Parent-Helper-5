export function getSupabaseServerUrl(): string | null {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

export function getSupabaseServerKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null
  );
}

export function getSupabaseBrowserUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
}

export function getSupabaseBrowserKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

export function hasSupabaseServerEnv(): boolean {
  return Boolean(getSupabaseServerUrl() && getSupabaseServerKey());
}

export function hasSupabaseBrowserEnv(): boolean {
  return Boolean(getSupabaseBrowserUrl() && getSupabaseBrowserKey());
}
