"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PingEntry = {
  id: string;
  engine: string;
  status: number | null;
  success: boolean;
  timestamp: string;
  message?: string | null;
};

interface HistoryEntry {
  date: string;
  rate: number;
}

export default function AdminAnalyticsPage() {
  const [pings, setPings] = useState<PingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function fetchPings() {
      const { data, error } = await supabase
        .from("sitemap_pings")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (!error && data) {
        setPings(data as PingEntry[]);
      } else {
        console.error("Failed to load ping data", error?.message);
      }

      setLoading(false);
    }

    fetchPings();
    fetchLastSent();
    fetchHistory();
  }, []);

  async function fetchLastSent() {
    try {
      const res = await fetch("/api/last-seo-report");
      const json = await res.json();
      if (json.lastSent) {
        setLastSent(json.lastSent);
      }
    } catch (err) {
      console.error("Failed to fetch last sent timestamp:", err);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch("/api/seo-report-history");
      const json = await res.json();
      if (json.data) {
        const formatted = [...json.data]
          .reverse()
          .map((entry: any) => ({
            date: dayjs(entry.sent_at).format("MMM D"),
            rate: Math.round(entry.success_rate ?? (entry.success ? 100 : 0)),
          }));
        setHistory(formatted);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }

  async function sendReport() {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/send-seo-summary");
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage("✅ Report sent successfully!");
        fetchLastSent();
        fetchHistory();
      } else {
        setMessage("⚠️ Failed to send report.");
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message ?? err}`);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-gray-500">Loading ping data...</p>;
  }

  const chartData = pings
    .map((p) => ({
      time: dayjs(p.timestamp).format("MMM D, HH:mm"),
      [p.engine]: p.success ? 1 : 0,
    }))
    .reverse();

  const sparklineColor = history.some((entry) => entry.rate < 90) ? "#fb7185" : "#14b8a6";

  return (
    <div className="space-y-8 p-8">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-teal">SEO Health Trend</h3>
            <span className="text-sm text-sage">Updated {dayjs().format("MMM D, HH:mm")}</span>
          </div>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={history}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip formatter={(value: number) => `${value}%`} labelFormatter={(label) => `Week of ${label}`} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke={sparklineColor}
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#fb7185", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-sage">No SEO history yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-soft hover:shadow-lg transition p-6 flex flex-col gap-3 justify-center">
          <Button
            onClick={sendReport}
            disabled={sending}
            className="bg-coral hover:bg-coral-500 text-white px-6 py-3 font-semibold shadow-md"
          >
            {sending ? "Sending..." : "📧 Send Test Report Now"}
          </Button>
          {lastSent ? (
            <span className="text-sm font-medium text-sage">
              Last sent: {dayjs(lastSent).format("YYYY-MM-DD HH:mm")}
            </span>
          ) : (
            <span className="text-sm text-sage">Report not sent yet</span>
          )}
          {message ? <span className="text-sm font-medium text-sage">{message}</span> : null}
        </div>
      </div>

      <Card className="border-t-4 border-teal shadow-lg">
        <CardHeader>
          <CardTitle>📊 Sitemap Ping Health</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Google" stroke="#0ea5e9" dot={false} />
              <Line type="monotone" dataKey="Bing" stroke="#9333ea" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border shadow">
        <CardHeader>
          <CardTitle>Recent Ping Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Engine</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Success</th>
                  <th className="py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {pings.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2">{dayjs(p.timestamp).format("YYYY-MM-DD HH:mm")}</td>
                    <td className="py-2">{p.engine}</td>
                    <td className="py-2">{p.status ?? "–"}</td>
                    <td className={`py-2 ${p.success ? "text-green-600" : "text-red-500"}`}>
                      {p.success ? "Yes" : "No"}
                    </td>
                    <td className="max-w-xs truncate py-2" title={p.message ?? "—"}>
                      {p.message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
