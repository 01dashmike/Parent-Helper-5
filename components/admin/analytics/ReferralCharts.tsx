"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { formatMonthDay } from "@/lib/utils/date";
import { themeColors } from "@/lib/theme-colors";

interface AnalyticsData {
    referral_type: string;
    reward_status: string;
    week: string;
    referrals: number;
    conversions: number;
    total_reward_value: number;
}

interface Props {
    data: AnalyticsData[];
    loading?: boolean;
}

export default function ReferralCharts({ data, loading }: Props) {
    // Process data for weekly conversions line chart
    const weeklyConversions = useMemo(() => {
        const weekMap = new Map<string, { week: string; weekDate: Date; member: number; provider: number }>();

        data.forEach((item) => {
            const weekDate = new Date(item.week);
            const week = formatMonthDay(weekDate);
            const existing = weekMap.get(week) || { week, weekDate, member: 0, provider: 0 };

            if (item.referral_type === "member") {
                existing.member += item.conversions || 0;
            } else if (item.referral_type === "provider") {
                existing.provider += item.conversions || 0;
            }

            weekMap.set(week, existing);
        });

        return Array.from(weekMap.values()).sort((a, b) => a.weekDate.getTime() - b.weekDate.getTime());
    }, [data]);

    // Process data for total reward value bar chart
    const weeklyRewards = useMemo(() => {
        const weekMap = new Map<string, { week: string; weekDate: Date; value: number }>();

        data.forEach((item) => {
            const weekDate = new Date(item.week);
            const week = formatMonthDay(weekDate);
            const existing = weekMap.get(week) || { week, weekDate, value: 0 };
            existing.value += item.total_reward_value || 0;
            weekMap.set(week, existing);
        });

        return Array.from(weekMap.values())
            .sort((a, b) => a.weekDate.getTime() - b.weekDate.getTime())
            .slice(-12); // Last 12 weeks
    }, [data]);

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-80 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl border border-sage/20 bg-cream" />
                <div className="h-80 motion-safe:animate-pulse motion-reduce:animate-none rounded-2xl border border-sage/20 bg-cream" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-sage/20 bg-white p-12 text-center text-charcoal/70">
                <p>No data available for the selected filters.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Conversions Line Chart */}
            <div className="rounded-2xl border border-sage/20 bg-white p-6">
                <h3 className="mb-4 text-title font-semibold text-charcoal">Weekly Conversions</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyConversions}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gray[200]} />
                        <XAxis dataKey="week" stroke={themeColors.gray[500]} fontSize={12} />
                        <YAxis stroke={themeColors.gray[500]} fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: themeColors.white,
                                border: `1px solid ${themeColors.sage.DEFAULT}`,
                                borderRadius: "8px",
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="member" stroke={themeColors.sage.DEFAULT} strokeWidth={2} name="Member Referrals" />
                        <Line type="monotone" dataKey="provider" stroke={themeColors.blueStandard[500]} strokeWidth={2} name="Provider Referrals" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Total Reward Value Bar Chart */}
            <div className="rounded-2xl border border-sage/20 bg-white p-6">
                <h3 className="mb-4 text-title font-semibold text-charcoal">Total Reward Value (£)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyRewards}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gray[200]} />
                        <XAxis dataKey="week" stroke={themeColors.gray[500]} fontSize={12} />
                        <YAxis stroke={themeColors.gray[500]} fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: themeColors.white,
                                border: `1px solid ${themeColors.sage.DEFAULT}`,
                                borderRadius: "8px",
                            }}
                            formatter={(value: number) => `£${value.toFixed(2)}`}
                        />
                        <Bar dataKey="value" fill={themeColors.sage.DEFAULT} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

