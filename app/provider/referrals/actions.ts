'use server';

import { createClient } from '@/lib/supabase/server';
import { isProviderReferralsEnabled } from '@/lib/env';
import { generateUniqueReferralCode } from '@/lib/referrals/utils';
import { getSupabaseServer } from '@/lib/supabase.server';

/**
 * Generate a unique referral code for a provider
 * Format: PH-XXXXXX (branded format)
 */
export async function generateReferralCode(providerId: number): Promise<string> {
    if (!isProviderReferralsEnabled()) {
        throw new Error('Provider referrals feature is not enabled');
    }

    const supabase = createClient();
    const serverSupabase = getSupabaseServer();

    // Check if provider already has a referral code
    const { data: provider } = await supabase
        .from('providers')
        .select('referral_code')
        .eq('id', providerId)
        .single();

    if (provider?.referral_code) {
        return provider.referral_code;
    }

    // Generate new code using branded format: PH-XXXXXX
    let referralCode: string;
    try {
        referralCode = await generateUniqueReferralCode(serverSupabase);
    } catch (error) {
        throw new Error(`Failed to generate referral code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Store the code in providers table
    const { error } = await supabase
        .from('providers')
        .update({ referral_code: referralCode })
        .eq('id', providerId);

    if (error) {
        throw new Error(`Failed to save referral code: ${error.message}`);
    }

    return referralCode;
}

/**
 * Get referral stats for a provider
 */
export async function getReferralStats(providerId: number) {
    if (!isProviderReferralsEnabled()) {
        return null;
    }

    const supabase = createClient();

    const { data: referrals } = await supabase
        .from('referrals')
        .select('id, status, reward_applied, created_at')
        .eq('referrer_provider_id', providerId);

    const { data: visits } = await supabase
        .from('referral_visits')
        .select('id')
        .eq('referrer_provider_id', providerId);

    const { data: provider } = await supabase
        .from('providers')
        .select('referral_code, referral_reward_credit_cents, referral_reward_expires_at')
        .eq('id', providerId)
        .single();

    return {
        referralCode: provider?.referral_code || null,
        totalReferrals: referrals?.length || 0,
        pendingReferrals: referrals?.filter((r: { status?: string | null }) => r.status === 'pending').length || 0,
        completedReferrals: referrals?.filter((r: { status?: string | null }) => r.status === 'completed').length || 0,
        rewardApplied: referrals?.filter((r: { reward_applied?: boolean | null }) => r.reward_applied).length || 0,
        totalVisits: visits?.length || 0,
        creditCents: provider?.referral_reward_credit_cents || 0,
        creditExpiresAt: provider?.referral_reward_expires_at || null,
    };
}

/**
 * Send referral invite email
 */
export async function sendReferralInvite(
    providerId: number,
    email: string
): Promise<{ success: boolean; message: string }> {
    if (!isProviderReferralsEnabled()) {
        return { success: false, message: 'Provider referrals feature is not enabled' };
    }

    const supabase = createClient();

    // Get provider and referral code
    const { data: provider } = await supabase
        .from('providers')
        .select('id, name, referral_code')
        .eq('id', providerId)
        .single();

    if (!provider) {
        return { success: false, message: 'Provider not found' };
    }

    // Generate referral code if needed
    const referralCode = provider.referral_code || await generateReferralCode(providerId);

    // Create referral record
    const { error: insertError } = await supabase
        .from('referrals')
        .insert({
            referrer_provider_id: providerId,
            referred_email: email.toLowerCase().trim(),
            status: 'pending',
        });

    if (insertError) {
        // Check if referral already exists
        if (insertError.code === '23505') {
            return { success: false, message: 'You have already invited this email address' };
        }
        return { success: false, message: `Failed to create referral: ${insertError.message}` };
    }

    // Send email
    const { generateReferralInviteEmail } = await import('@/lib/emails/templates/referralInvite');
    const { sendTransactional } = await import('@/lib/emails/sendTransactional');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://parenthelper.co.uk';
    const referralUrl = `${appUrl}/providers/register?ref=${referralCode}`;

    const template = generateReferralInviteEmail({
        referrerName: provider.name,
        referralUrl,
    });

    try {
      await sendTransactional({
        to: email.toLowerCase().trim(),
        subject: `${provider.name} invited you to join Parent Helper`,
        html: template.html,
        text: template.text,
        type: 'referral_invite',
      });
    } catch (error) {
      console.error("[email-error]", {
        template: "referral_invite",
        to: email.toLowerCase().trim(),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
        success: true,
        message: 'Invite sent successfully',
    };
}

