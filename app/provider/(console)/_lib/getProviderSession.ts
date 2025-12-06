/**
 * Shared Provider Session Helper
 * PERF: React cache ensures this runs once per request
 */

import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase";
import { getActiveMembershipForUser } from "../../_lib/membership";
import { cache } from "react";

export type ProviderSessionData = {
  userId: string;
  email: string | null;
  providerId: number;
  providerName: string;
  providerSlug: string;
  membershipRole: string;
  membershipStatus: string;
};

/**
 * Get provider session with authentication and membership checks
 * PERF: Cached per request - eliminates duplicate session/membership queries
 * 
 * @throws Redirects to /provider/login if not authenticated or no membership found
 * @returns ProviderSessionData
 */
export const getProviderSession = cache(async (): Promise<ProviderSessionData> => {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  // PERF: Early exit if no session
  if (error || !session?.user) {
    redirect("/provider/login");
  }

  // PERF: Single membership query
  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  // Return normalized data structure
  // slug is notNull in schema, but TypeScript infers it as nullable from query
  if (!membership.providers.slug) {
    redirect("/provider/login");
  }
  
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    providerId: membership.provider_id,
    providerName: membership.providers.name,
    providerSlug: membership.providers.slug,
    membershipRole: membership.role,
    membershipStatus: membership.status,
  };
});

/**
 * Get provider session without caching (for mutations)
 * Use this in server actions where you need fresh data
 */
export async function getProviderSessionFresh(): Promise<ProviderSessionData> {
  const supabase = createSupabaseServerComponentClient();
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session ?? null;

  if (error || !session?.user) {
    redirect("/provider/login");
  }

  const membership = await getActiveMembershipForUser(supabase, session.user.id);
  
  if (!membership?.providers) {
    redirect("/provider/login");
  }

  // slug is notNull in schema, but TypeScript infers it as nullable from query
  if (!membership.providers.slug) {
    redirect("/provider/login");
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    providerId: membership.provider_id,
    providerName: membership.providers.name,
    providerSlug: membership.providers.slug,
    membershipRole: membership.role,
    membershipStatus: membership.status,
  };
}



