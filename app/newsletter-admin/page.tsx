"use client";

import { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyRecord {
  date: string;
  impressions: number;
  signups: number;
}

interface Summary {
  impressions: number;
  signups: number;
  conversion: number;
  topPostcodes: Array<{ postcode: string; count: number }>;
}

export default function NewsletterAdminPage() {
  const [daily, setDaily] = useState<DailyRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({
    impressions: 0,
    signups: 0,
    conversion: 0,
    topPostcodes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/newsletter-admin");
        if (!response.ok) throw new Error("Failed to load analytics");
        const json = await response.json();
        setDaily(json.daily || []);
        setSummary(json.summary || summary);
      } catch (error) {
        console.error("Error fetching newsletter data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conversionLabel = useMemo(() => `${summary.conversion ?? 0}%`, [summary.conversion]);

  const handleExportCSV = () => {
    const rows = [
      ["Date", "Impressions", "Signups"],
      ...daily.map((item) => [item.date, item.impressions, item.signups]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "newsletter_report.csv");
  };

  if (loading) {
    return <div className="p-12 text-center text-brand-teal">Loading analytics…</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card className="bg-brand-cream border-brand-sage/50 shadow-lg">
        <CardHeader className="border-none pb-0">
          <CardTitle className="text-2xl">Newsletter Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 py-6 md:grid-cols-4 text-center">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-brand-teal">{summary.impressions}</p>
            <p className="text-sm text-brand-lavender">Impressions</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-brand-coral">{summary.signups}</p>
            <p className="text-sm text-brand-lavender">Signups</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-brand-lavender">{conversionLabel}</p>
            <p className="text-sm text-brand-lavender">Conversion Rate</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Button
              onClick={handleExportCSV}
              className="bg-brand-coral text-white hover:bg-brand-teal"
            >
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Daily Signups & Impressions</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E2F5" />
                <XAxis dataKey="date" stroke="#007A74" fontSize={12} tickMargin={8} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#D7E8E0" }} />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#E7E2F5"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#FF7A73"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-brand-lavender">No event data captured yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Top Postcodes</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.topPostcodes?.length ? (
            <ul className="grid gap-3 md:grid-cols-3">
              {summary.topPostcodes.map((entry) => (
                <li
                  key={entry.postcode}
                  className="flex items-center justify-between rounded-2xl bg-brand-sage/30 px-4 py-3 text-sm text-brand-teal"
                >
                  <span className="font-medium">{entry.postcode}</span>
                  <span>{entry.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-brand-lavender">No postcode data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
