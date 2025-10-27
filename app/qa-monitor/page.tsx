"use client";

import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Report {
  timestamp: string;
  lighthouse: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  visualDiff: string;
  overall: number;
}

export default function QAMonitorPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [latest, setLatest] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/qa/reports.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setReports(data);
          setLatest(data[data.length - 1]);
        }
      })
      .catch(() => console.warn("No QA report data found"));
  }, []);

  if (!latest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-sage text-lg">Loading QA results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <h1 className="text-3xl font-bold text-teal-dark mb-4 flex items-center gap-2">
        <Gauge className="h-6 w-6" /> QA Dashboard
      </h1>
      <p className="text-sage mb-8">Live quality metrics across builds</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(latest.lighthouse).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl shadow-md p-4 text-center border-t-4 border-teal">
            <h3 className="text-sm uppercase text-gray-500">{key}</h3>
            <p
              className={`text-3xl font-bold ${
                value >= 90 ? "text-teal" : value >= 80 ? "text-yellow-500" : "text-red-500"
              }`}
            >
              {value}%
            </p>
          </div>
        ))}
        <div className="bg-white rounded-xl shadow-md p-4 text-center border-t-4 border-coral">
          <h3 className="text-sm uppercase text-gray-500">Overall</h3>
          <p className="text-3xl font-bold text-coral">{latest.overall}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-teal-dark mb-4">Performance Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reports}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis domain={[50, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="lighthouse.performance" stroke="#14b8a6" name="Performance" />
            <Line type="monotone" dataKey="lighthouse.accessibility" stroke="#a78bfa" name="Accessibility" />
            <Line type="monotone" dataKey="lighthouse.seo" stroke="#f97316" name="SEO" />
            <Line type="monotone" dataKey="lighthouse.bestPractices" stroke="#65a30d" name="Best Practices" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-10 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-teal-dark mb-2">Visual Regression</h2>
        <p className="text-sage">{latest.visualDiff}</p>
      </div>

      <p className="text-gray-400 text-xs mt-6">Last updated {new Date(latest.timestamp).toLocaleString()}</p>
    </div>
  );
}
