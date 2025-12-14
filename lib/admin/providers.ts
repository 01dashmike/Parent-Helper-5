/**
 * Provider Admin Helper Functions
 * 
 * Functions for managing provider admin metadata and workflows
 */

import { getSupabaseServer } from "@/lib/supabase.server";

/**
 * Ensure a provider has an admin meta record
 * Creates one with defaults if missing
 */
export async function ensureProviderAdminMeta(providerId: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase server not configured");
  }

  // Check if record exists
  const { data: existing } = await supabase
    .from("provider_admin_meta")
    .select("provider_id")
    .eq("provider_id", providerId)
    .single();

  if (existing) {
    return; // Already exists
  }

  // Get provider to determine initial status
  const { data: provider } = await supabase
    .from("providers")
    .select("is_active, is_claimed, last_verified_at")
    .eq("id", providerId)
    .single();

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }

  // Determine initial status based on provider state
  const status = provider.is_active && provider.is_claimed ? "approved" : "pending";
  const verificationStatus = provider.last_verified_at ? "verified" : "unverified";

  // Create admin meta record
  const { error } = await supabase.from("provider_admin_meta").insert({
    provider_id: providerId,
    status,
    verification_status: verificationStatus,
    tier: "free",
    tags: [],
  });

  if (error) {
    console.error(`[ensureProviderAdminMeta] Error creating admin meta for provider ${providerId}:`, error);
    throw error;
  }
}

/**
 * Mark a provider as approved
 */
export async function markProviderApproved(providerId: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase server not configured");
  }

  // Ensure admin meta exists
  await ensureProviderAdminMeta(providerId);

  // Update status
  const { error } = await supabase
    .from("provider_admin_meta")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("provider_id", providerId);

  if (error) {
    console.error(`[markProviderApproved] Error updating provider ${providerId}:`, error);
    throw error;
  }

  // Also mark provider as active if not already
  await supabase
    .from("providers")
    .update({ is_active: true })
    .eq("id", providerId);
}

/**
 * Convert a lead to a provider
 * This assumes the provider record already exists (from lead conversion flow)
 * and just ensures admin meta is set up
 */
export async function convertLeadToProvider(providerId: number): Promise<{ providerId: number }> {
  await ensureProviderAdminMeta(providerId);
  return { providerId };
}








