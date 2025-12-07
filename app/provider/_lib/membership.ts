import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderMembershipRow = {
  provider_id: number;
  role: string;
  status: string;
  providers: {
    id: number;
    name: string;
    slug: string | null;
  } | null;
};

export async function getActiveMembershipForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProviderMembershipRow | null> {
  const { data, error } = await supabase
    .from("providers_users")
    .select(
      "provider_id, role, status, providers:providers ( id, name, slug )"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ProviderMembershipRow>();

  if (error) {
    console.error("[getActiveMembershipForUser] failed:", error);
    return null;
  }

  if (!data || data.status !== "active") {
    return null;
  }

  return data;
}

