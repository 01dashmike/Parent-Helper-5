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

type PingEntry = {
  id: string;
  engine: string;
  status: number | null;
  success: boolean;
  timestamp: string;
  message?: string | null;
};

export default function AdminAnalyticsPage() {
  const [pings, setPings] = useState<PingEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return <p className="p-8 text-gray-500">Loading ping data...</p>;
  }

  const chartData = pings
    .map((p) => ({
      time: dayjs(p.timestamp).format("MMM D, HH:mm"),
      [p.engine]: p.success ? 1 : 0,
    }))
    .reverse();

  return (
    <div className="space-y-8 p-8">
      <Card className="border-t-4 border-teal-500 shadow-lg">
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
