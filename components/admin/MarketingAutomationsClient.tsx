"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  created_at?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  action_type: string;
  enabled: boolean;
  campaign_id?: string;
  created_at?: string;
}

interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  sms_sent: number;
  sms_delivered: number;
  conversions: number;
  marketing_campaigns?: { name: string };
}

interface Props {
  campaigns: Campaign[];
  rules: AutomationRule[];
  metrics: CampaignMetric[];
}

export default function MarketingAutomationsClient({ campaigns, rules, metrics }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/marketing/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            ruleId,
            updates: { enabled },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update rule",
            variant: "destructive",
          });
          return;
        }

        router.refresh();
      } catch (err) {
        console.error("Error toggling rule:", err);
      }
    });
  };

  const toggleCampaign = async (campaignId: string, enabled: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/marketing/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            campaignId,
            updates: { enabled },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to update campaign",
            variant: "destructive",
          });
          return;
        }

        router.refresh();
      } catch (err) {
        console.error("Error toggling campaign:", err);
      }
    });
  };

  // Calculate totals from metrics
  const totalMetrics = metrics.reduce(
    (acc, m) => ({
      emails_sent: acc.emails_sent + (m.emails_sent || 0),
      emails_opened: acc.emails_opened + (m.emails_opened || 0),
      emails_clicked: acc.emails_clicked + (m.emails_clicked || 0),
      emails_bounced: acc.emails_bounced + (m.emails_bounced || 0),
      sms_sent: acc.sms_sent + (m.sms_sent || 0),
      conversions: acc.conversions + (m.conversions || 0),
    }),
    {
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      emails_bounced: 0,
      sms_sent: 0,
      conversions: 0,
    }
  );

  const openRate =
    totalMetrics.emails_sent > 0
      ? ((totalMetrics.emails_opened / totalMetrics.emails_sent) * 100).toFixed(1)
      : "0";
  const clickRate =
    totalMetrics.emails_sent > 0
      ? ((totalMetrics.emails_clicked / totalMetrics.emails_sent) * 100).toFixed(1)
      : "0";
  const conversionRate =
    totalMetrics.emails_sent > 0
      ? ((totalMetrics.conversions / totalMetrics.emails_sent) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Emails Sent</div>
          <div className="mt-1 text-title font-semibold text-charcoal">
            {totalMetrics.emails_sent.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Open Rate</div>
          <div className="mt-1 text-title font-semibold text-charcoal">{openRate}%</div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Click Rate</div>
          <div className="mt-1 text-title font-semibold text-charcoal">{clickRate}%</div>
        </div>
        <div className="rounded-2xl border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Conversion Rate</div>
          <div className="mt-1 text-title font-semibold text-charcoal">{conversionRate}%</div>
        </div>
      </div>

      {/* Automation Rules */}
      <section>
        <h2 className="mb-4 text-title font-semibold">Automation Rules</h2>
        <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
          <table className="min-w-full divide-y divide-sage/20 text-left text-small">
            <thead className="bg-cream/70 text-slateSoft">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-semibold text-charcoal">{rule.name}</td>
                  <td className="px-4 py-3 text-small text-slateSoft">{rule.trigger_type}</td>
                  <td className="px-4 py-3 text-small text-slateSoft">{rule.action_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => toggleRule(rule.id, e.target.checked)}
                          className="peer sr-only"
                          disabled={isPending}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sage peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sage/50"></div>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Campaigns */}
      <section>
        <h2 className="mb-4 text-title font-semibold">Campaigns</h2>
        <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
          <table className="min-w-full divide-y divide-sage/20 text-left text-small">
            <thead className="bg-cream/70 text-slateSoft">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-semibold text-charcoal">{campaign.name}</td>
                  <td className="px-4 py-3 text-small text-slateSoft">{campaign.type}</td>
                  <td className="px-4 py-3 capitalize">{campaign.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={campaign.enabled}
                          onChange={(e) => toggleCampaign(campaign.id, e.target.checked)}
                          className="peer sr-only"
                          disabled={isPending}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sage peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sage/50"></div>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

