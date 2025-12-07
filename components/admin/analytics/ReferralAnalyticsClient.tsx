"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ReferralCharts from "./ReferralCharts";
import ReferralSummary from "./ReferralSummary";
import TopReferrersTable from "./TopReferrersTable";

interface AnalyticsData {
    referral_type: string;
    reward_status: string;
    week: string;
    referrals: number;
    conversions: number;
    total_reward_value: number;
}

interface KPIs {
    totalReferrals: number;
    conversionRate: number;
    totalRewardValue: number;
    avgTimeToConversion: number;
}

interface TopReferrer {
    user_id: string;
    email: string;
    referrals: number;
    reward_value: number;
}

type TabType = "overview" | "provider" | "member";

export default function ReferralAnalyticsClient() {
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // Set default date range to last 90 days
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);

        setEndDate(end.toISOString().split("T")[0]);
        setStartDate(start.toISOString().split("T")[0]);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab === "provider") {
                params.append("referral_type", "provider");
            } else if (activeTab === "member") {
                params.append("referral_type", "member");
            }
            if (startDate) {
                params.append("start_date", startDate);
            }
            if (endDate) {
                params.append("end_date", endDate);
            }

            const response = await fetch(`/api/admin/referrals/analytics?${params.toString()}`);
            if (!response.ok) {
                console.error("Failed to fetch analytics");
                return;
            }

            const data = await response.json();
            setAnalytics(data.analytics || []);
            setKpis(data.kpis || null);
            setTopReferrers(data.topReferrers || []);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter analytics data based on active tab
    const filteredAnalytics = useMemo(() => {
        if (activeTab === "overview") {
            return analytics;
        }
        return analytics.filter((item: AnalyticsData) => item.referral_type === activeTab);
    }, [analytics, activeTab]);

    const tabs = [
        { id: "overview" as TabType, label: "Overview" },
        { id: "provider" as TabType, label: "Provider Referrals" },
        { id: "member" as TabType, label: "Member Referrals" },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sage/20 bg-white p-4">
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-4 py-2 text-small font-medium transition ${
                                activeTab === tab.id
                                    ? "bg-sage text-white"
                                    : "bg-cream text-charcoal hover:bg-cream/80"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Date Filters */}
                <div className="ml-auto flex gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="ph-input text-small"
                    />
                    <span className="flex items-center text-slateSoft">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="ph-input text-small"
                    />
                </div>
            </div>

            {/* KPIs */}
            <ReferralSummary kpis={kpis} loading={loading} />

            {/* Charts */}
            <ReferralCharts data={filteredAnalytics} loading={loading} />

            {/* Top Referrers Table */}
            <TopReferrersTable referrers={topReferrers} loading={loading} />
        </div>
    );
}

