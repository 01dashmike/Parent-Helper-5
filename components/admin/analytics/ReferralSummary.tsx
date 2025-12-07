"use client";

interface KPIs {
    totalReferrals: number;
    conversionRate: number;
    totalRewardValue: number;
    avgTimeToConversion: number;
}

interface Props {
    kpis: KPIs | null;
    loading?: boolean;
}

export default function ReferralSummary({ kpis, loading }: Props) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-sage/20 bg-white p-6">
                        <div className="h-4 w-24 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-cream" />
                        <div className="mt-2 h-8 w-16 motion-safe:animate-pulse motion-reduce:animate-none rounded bg-cream" />
                    </div>
                ))}
            </div>
        );
    }

    if (!kpis) {
        return null;
    }

    const cards = [
        {
            title: "Total Referrals",
            value: kpis.totalReferrals.toLocaleString(),
            icon: "👥",
            color: "text-sage",
        },
        {
            title: "Conversion Rate",
            value: `${kpis.conversionRate.toFixed(1)}%`,
            icon: "📈",
            color: "text-blue-600",
        },
        {
            title: "Total Reward Value",
            value: `£${kpis.totalRewardValue.toFixed(2)}`,
            icon: "💰",
            color: "text-yellow-600",
        },
        {
            title: "Avg Time to Conversion",
            value: `${kpis.avgTimeToConversion.toFixed(1)} days`,
            icon: "⏱️",
            color: "text-purple-600",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-sage/20 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-small font-medium text-charcoal/70">{card.title}</p>
                            <p className={`mt-2 text-display-2 font-semibold ${card.color}`}>{card.value}</p>
                        </div>
                        <span className="text-display-2">{card.icon}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

