/**
 * Referral Core Helpers
 * 
 * Centralized functions for creating referral codes and tracking attribution
 * with campaign awareness.
 */

import { getSupabaseServer } from "@/lib/supabase.server";
import { generateUniqueReferralCode } from "./utils";
import { getCampaign, type ReferralCampaign } from "./campaigns";

/**
 * Create a referral code for a user with campaign awareness
 * 
 * @param userId - User ID (for member referrals) or provider ID (for provider referrals)
 * @param userType - "member" or "provider"
 * @param campaignId - Campaign ID (defaults to "default")
 * @param channel - Optional channel identifier (e.g., "email", "social", "direct")
 * @returns Referral code and URL
 */
export async function createReferralCodeForUser(
  userId: string | number,
  userType: "member" | "provider",
  campaignId: string = "default",
  channel?: string
): Promise<{
  ok: boolean;
  code?: string;
  url?: string;
  campaignId?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, error: "Supabase not configured" };
    }

    const campaign = getCampaign(campaignId);

    // Check if user already has a referral code for this campaign
    if (userType === "provider") {
      const providerId = typeof userId === "number" ? userId : parseInt(userId, 10);
      if (isNaN(providerId)) {
        return { ok: false, error: "Invalid provider ID" };
      }

      const { data: existing } = await supabase
        .from("provider_referrals")
        .select("referral_code, metadata")
        .eq("provider_id", providerId)
        .limit(1)
        .maybeSingle();

      if (existing?.referral_code) {
        // Check if existing code has campaign metadata
        const existingMetadata = (existing.metadata as Record<string, unknown>) || {};
        const existingCampaignId = existingMetadata.campaignId as string | undefined;

        // If same campaign, return existing code
        if (existingCampaignId === campaignId) {
          const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/ref/${existing.referral_code}`;
          return { ok: true, code: existing.referral_code, url, campaignId };
        }
        // Otherwise, return existing code but note it's from a different campaign
        // (for backwards compatibility)
        const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/ref/${existing.referral_code}`;
        return { ok: true, code: existing.referral_code, url, campaignId: existingCampaignId || "default" };
      }

      // Generate unique code
      let code: string;
      try {
        code = await generateUniqueReferralCode(supabase);
      } catch (error) {
        console.error("[createReferralCodeForUser] Error generating unique referral code:", error);
        return { ok: false, error: "Failed to generate unique code" };
      }

      // Insert referral code with campaign metadata
      const { data, error } = await supabase
        .from("provider_referrals")
        .insert({
          provider_id: providerId,
          referral_code: code,
          status: "clicked", // Initial status for the referrer's own record
          metadata: {
            campaignId,
            channel: channel || null,
            createdAt: new Date().toISOString(),
          },
        })
        .select("referral_code")
        .single();

      if (error) {
        console.error("[createReferralCodeForUser] Error creating referral code:", error);
        return { ok: false, error: "Failed to create referral code" };
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/ref/${data.referral_code}`;
      return { ok: true, code: data.referral_code, url, campaignId };
    } else {
      // Member referral
      const { data: existing } = await supabase
        .from("member_referrals")
        .select("referral_code, metadata")
        .eq("referrer_user_id", userId as string)
        .limit(1)
        .maybeSingle();

      if (existing?.referral_code) {
        const existingMetadata = (existing.metadata as Record<string, unknown>) || {};
        const existingCampaignId = existingMetadata.campaignId as string | undefined;

        if (existingCampaignId === campaignId) {
          const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/r/${existing.referral_code}`;
          return { ok: true, code: existing.referral_code, url, campaignId };
        }

        const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/r/${existing.referral_code}`;
        return { ok: true, code: existing.referral_code, url, campaignId: existingCampaignId || "default" };
      }

      // Generate unique code
      let code: string;
      try {
        code = await generateUniqueReferralCode(supabase);
      } catch (error) {
        console.error("[createReferralCodeForUser] Error generating unique referral code:", error);
        return { ok: false, error: "Failed to generate unique code" };
      }

      // For member referrals, we don't insert here - that's done via the API route
      // But we return the code that should be used
      const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/r/${code}`;
      return { ok: true, code, url, campaignId };
    }
  } catch (error: unknown) {
    console.error("[createReferralCodeForUser] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

/**
 * Track a referral click with attribution
 * 
 * @param referralCode - The referral code that was clicked
 * @param campaignId - Optional campaign ID (will be looked up if not provided)
 * @param channel - Optional channel identifier (e.g., from query param)
 * @param metadata - Additional tracking metadata
 * @returns Success status
 */
export async function trackReferralClick(
  referralCode: string,
  campaignId?: string | null,
  channel?: string | null,
  metadata?: Record<string, unknown>
): Promise<{
  ok: boolean;
  campaignId?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, error: "Supabase not configured" };
    }

    // Normalize referral code
    const normalizedCode = referralCode.trim().toUpperCase();

    // Try to find the referral to get campaign ID if not provided
    let resolvedCampaignId = campaignId || "default";

    // Check provider_referrals first
    const { data: providerRef } = await supabase
      .from("provider_referrals")
      .select("provider_id, metadata")
      .eq("referral_code", normalizedCode)
      .limit(1)
      .maybeSingle();

    if (providerRef) {
      const refMetadata = (providerRef.metadata as Record<string, unknown>) || {};
      resolvedCampaignId = (refMetadata.campaignId as string) || resolvedCampaignId;

      // Check if click already tracked (avoid duplicates)
      const { data: existing } = await supabase
        .from("provider_referrals")
        .select("id")
        .eq("referral_code", normalizedCode)
        .eq("status", "clicked")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return { ok: true, campaignId: resolvedCampaignId };
      }

      // Insert click tracking
      const { error: insertError } = await supabase
        .from("provider_referrals")
        .insert({
          provider_id: providerRef.provider_id,
          referral_code: normalizedCode,
          status: "clicked",
          metadata: {
            campaignId: resolvedCampaignId,
            channel: channel || null,
            clickedAt: new Date().toISOString(),
            ...metadata,
          },
        });

      if (insertError) {
        console.error("[trackReferralClick] Error tracking provider referral click:", insertError);
        return { ok: false, error: "Failed to track click" };
      }

      return { ok: true, campaignId: resolvedCampaignId };
    }

    // Check member_referrals
    const { data: memberRef } = await supabase
      .from("member_referrals")
      .select("referrer_user_id, metadata")
      .eq("referral_code", normalizedCode)
      .limit(1)
      .maybeSingle();

    if (memberRef) {
      const refMetadata = (memberRef.metadata as Record<string, unknown>) || {};
      resolvedCampaignId = (refMetadata.campaignId as string) || resolvedCampaignId;

      // For member referrals, clicks are tracked via the API route
      // This function just returns the campaign ID for attribution
      return { ok: true, campaignId: resolvedCampaignId };
    }

    // Check legacy referrals table
    const { data: legacyRef } = await supabase
      .from("referrals")
      .select("referrer_user_id, metadata")
      .eq("referral_code", normalizedCode)
      .limit(1)
      .maybeSingle();

    if (legacyRef) {
      const refMetadata = (legacyRef.metadata as Record<string, unknown>) || {};
      resolvedCampaignId = (refMetadata.campaignId as string) || resolvedCampaignId;
      return { ok: true, campaignId: resolvedCampaignId };
    }

    return { ok: false, error: "Referral code not found" };
  } catch (error: unknown) {
    console.error("[trackReferralClick] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

