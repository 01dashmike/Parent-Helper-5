"use client";

import { useState, useEffect } from "react";
import { Mail, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProviderReport {
  provider_name: string;
  bookings: number;
  revenue_cents: number;
  rating: number;
  referral_count: number;
}

export default function ProviderReportsPanel() {
  const [reports, setReports] = useState<ProviderReport[]>([]);
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    fetchToggles();
  }, []);

  async function fetchReports() {
    try {
      const response = await fetch("/api/admin/automation/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchToggles() {
    try {
      const response = await fetch("/api/admin/automation/toggles");
      if (response.ok) {
        const data = await response.json();
        setAutoSendEnabled(data.flags?.WEEKLY_REPORTS_ENABLED || false);
      }
    } catch (error) {
      console.error("Error fetching toggles:", error);
    }
  }

  async function handleToggleAutoSend(enabled: boolean) {
    try {
      const response = await fetch("/api/admin/automation/toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          WEEKLY_REPORTS_ENABLED: enabled,
        }),
      });
      if (response.ok) {
        setAutoSendEnabled(enabled);
      }
    } catch (error) {
      console.error("Error updating toggle:", error);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-4">
            <div className="h-4 bg-sage/20 rounded w-3/4"></div>
            <div className="h-4 bg-sage/20 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title font-semibold text-charcoal">Provider Reports</h2>
          <p className="text-small text-slateSoft mt-1">
            Weekly performance reports sent to providers
          </p>
        </div>
      </div>

      {/* Auto-send Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-sage" aria-hidden="true" />
            Automated Weekly Reports
          </CardTitle>
          <CardDescription>
            Enable automatic weekly email reports to providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-send" className="text-body font-medium">
              Auto-send Weekly Reports
            </Label>
            <Switch
              id="auto-send"
              checked={autoSendEnabled}
              onCheckedChange={handleToggleAutoSend}
            />
          </div>
        </CardContent>
      </Card>

      {/* Provider Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sage" aria-hidden="true" />
            Provider Performance Summary
          </CardTitle>
          <CardDescription>
            Last 30 days performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage/20">
                  <th className="text-left py-3 px-4 font-semibold text-charcoal">Provider</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal">Bookings</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal">Rating</th>
                  <th className="text-right py-3 px-4 font-semibold text-charcoal">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slateSoft">
                      No provider data available
                    </td>
                  </tr>
                ) : (
                  reports.map((report, idx) => (
                    <tr key={idx} className="border-b border-sage/10 hover:bg-cream/40">
                      <td className="py-3 px-4 font-medium text-charcoal">{report.provider_name}</td>
                      <td className="py-3 px-4 text-right text-charcoal">{report.bookings}</td>
                      <td className="py-3 px-4 text-right text-charcoal">
                        £{(report.revenue_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-charcoal">
                        {report.rating ? report.rating.toFixed(1) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-charcoal">{report.referral_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
