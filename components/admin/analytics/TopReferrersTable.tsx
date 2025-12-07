"use client";

interface TopReferrer {
    user_id: string;
    email: string;
    referrals: number;
    reward_value: number;
}

interface Props {
    referrers: TopReferrer[];
    loading?: boolean;
}

export default function TopReferrersTable({ referrers, loading }: Props) {
    if (loading) {
        return (
            <div className="rounded-2xl border border-sage/20 bg-white p-6">
                <div className="h-6 w-48 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-cream" />
                <div className="mt-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-cream" />
                    ))}
                </div>
            </div>
        );
    }

    if (referrers.length === 0) {
        return (
            <div className="rounded-2xl border border-sage/20 bg-white p-6">
                <h3 className="mb-4 text-title font-semibold text-charcoal">Top 5 Referrers</h3>
                <p className="text-center text-charcoal/70">No referrers found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
            <h3 className="mb-4 text-title font-semibold text-charcoal">Top 5 Referrers by Value</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage/20">
                    <thead className="bg-cream/70">
                        <tr>
                            <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wider text-slateSoft">
                                Rank
                            </th>
                            <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wider text-slateSoft">
                                Email
                            </th>
                            <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wider text-slateSoft">
                                Referrals
                            </th>
                            <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wider text-slateSoft">
                                Reward Value
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10 bg-white">
                        {referrers.map((referrer, index) => (
                            <tr key={referrer.user_id} className="hover:bg-cream/60">
                                <td className="whitespace-nowrap px-4 py-3 text-small font-medium text-charcoal">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage/10 text-sage">
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-small text-charcoal">{referrer.email}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-small text-charcoal">
                                    {referrer.referrals}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-small font-semibold text-sage">
                                    £{referrer.reward_value.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

