'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Copy, Mail, Gift, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import {
    generateReferralCode,
    getReferralStats,
    sendReferralInvite,
} from './actions';
import { isProviderReferralsEnabled } from '@/lib/env';

type ReferralStats = {
    referralCode: string | null;
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    rewardApplied: number;
    totalVisits: number;
    creditCents: number;
    creditExpiresAt: string | null;
};

type InviteState = {
    success: boolean;
    message: string;
};

function InviteButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-small font-semibold text-white transition hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
            {pending ? 'Sending...' : children}
        </button>
    );
}

export default function ReferralsClient({ providerId }: { providerId: number }) {
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [inviteState, inviteAction] = useFormState(
        async (_prevState: InviteState | null, formData: FormData) => {
            const email = formData.get('email') as string;
            const result = await sendReferralInvite(providerId, email);
            if (result.success) {
                // Refresh stats
                loadStats();
            }
            return result;
        },
        null
    );

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getReferralStats(providerId);
            if (data) {
                setStats(data);
                // Generate referral code if needed
                if (!data.referralCode) {
                    await generateReferralCode(providerId);
                    const updated = await getReferralStats(providerId);
                    if (updated) setStats(updated);
                }
            }
        } catch (error) {
            console.error('Failed to load referral stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isProviderReferralsEnabled()) {
            return;
        }
        loadStats();
    }, [providerId]);

    const referralUrl = stats?.referralCode
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/providers/register?ref=${stats.referralCode}`
        : '';

    const copyToClipboard = async () => {
        if (!referralUrl) return;
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    if (!isProviderReferralsEnabled()) {
        return null;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-sage/20" />
                <div className="h-64 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl bg-white/70" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="rounded-2xl border border-terracotta/30 bg-white p-6 text-terracotta">
                Failed to load referral data. Please try again later.
            </div>
        );
    }

    const creditAmount = (stats.creditCents / 100).toFixed(2);
    const hasActiveCredit = stats.creditCents > 0 &&
        (!stats.creditExpiresAt || new Date(stats.creditExpiresAt) > new Date());

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-display-2 font-semibold text-charcoal">Referral Program</h1>
                <p className="mt-2 text-small text-charcoal/70">
                    Invite other providers and save 10% on Boost fees when they make their first paid Boost.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-sage/10 p-3">
                            <Users className="h-5 w-5 text-sage" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-display-2 font-semibold text-charcoal">{stats.totalReferrals}</p>
                            <p className="text-small text-charcoal/70">Total Referrals</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-sage/10 p-3">
                            <CheckCircle2 className="h-5 w-5 text-sage" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-display-2 font-semibold text-charcoal">{stats.completedReferrals}</p>
                            <p className="text-small text-charcoal/70">Completed</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-sage/10 p-3">
                            <TrendingUp className="h-5 w-5 text-sage" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-display-2 font-semibold text-charcoal">{stats.totalVisits}</p>
                            <p className="text-small text-charcoal/70">Link Clicks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Credit */}
            {hasActiveCredit && (
                <div className="rounded-2xl border border-sage/30 bg-sage/10 p-6">
                    <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-sage" aria-hidden="true" />
                        <div>
                            <p className="text-body font-semibold text-charcoal">
                                You have £{creditAmount} credit available
                            </p>
                            <p className="text-small text-charcoal/70">
                                {stats.creditExpiresAt
                                    ? `Expires ${new Date(stats.creditExpiresAt).toLocaleDateString()}`
                                    : 'No expiration date'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Referral Link */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-title font-semibold text-charcoal">Your Referral Link</h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        className="flex-1 rounded-full border border-sage/20 px-4 py-2 text-small text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        aria-label="Referral link URL"
                    />
                    <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-white px-4 py-2 text-small font-medium text-charcoal transition hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        aria-label={copied ? 'Link copied to clipboard' : 'Copy referral link'}
                    >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p className="mt-3 text-small text-charcoal/70">
                    Share this link with other providers. When they sign up and make their first paid Boost,
                    you&apos;ll receive a 10% discount credit.
                </p>
            </div>

            {/* Send Invite */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-title font-semibold text-charcoal">Send Invite Email</h2>
                <form action={inviteAction} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-small font-medium text-charcoal">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="provider@example.com"
                            className="w-full rounded-full border border-sage/20 px-4 py-2 text-small text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            autoComplete="email"
                        />
                    </div>

                    {inviteState?.success && (
                        <div className="rounded-2xl border border-sage/30 bg-sage/10 p-4 text-small text-sage" role="status" aria-live="polite">
                            {inviteState.message}
                        </div>
                    )}

                    {inviteState && !inviteState.success && (
                        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 text-small text-terracotta" role="alert" aria-live="polite">
                            {inviteState.message}
                        </div>
                    )}

                    <InviteButton>
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        Send Invite
                    </InviteButton>
                </form>
            </div>

            {/* How It Works */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                <h2 className="mb-4 text-title font-semibold text-charcoal">How It Works</h2>
                <ol className="space-y-3 text-small text-charcoal/70">
                    <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-small font-semibold text-sage">
                            1
                        </span>
                        <span>Share your referral link with other providers</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-small font-semibold text-sage">
                            2
                        </span>
                        <span>They sign up using your link</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-small font-semibold text-sage">
                            3
                        </span>
                        <span>When they make their first paid Boost, you receive a 10% discount credit</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-small font-semibold text-sage">
                            4
                        </span>
                        <span>Credit is valid for 1 month and applies to Boost fees</span>
                    </li>
                </ol>
            </div>
        </div>
    );
}

