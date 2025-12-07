"use client";

import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";

interface CampaignStat {
  campaignId: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface MarketingTableProps {
  campaigns: CampaignStat[];
}

export default function MarketingTable({ campaigns }: MarketingTableProps) {
  const sortedCampaigns = [...campaigns].sort((a, b) => b.conversionRate - a.conversionRate);

  if (sortedCampaigns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Marketing Effectiveness</h3>
        <p className="text-small text-slateSoft">No campaign data available yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionTokens.slow }}
      className="rounded-2xl border border-sage/20 bg-white p-6"
    >
      <h3 className="mb-4 text-title font-semibold text-charcoal">Marketing Effectiveness</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20">
          <thead className="bg-cream/70">
            <tr>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Campaign
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Sent
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Opened
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Clicked
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Open Rate
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                CTR
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Conversion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10 bg-white">
            {sortedCampaigns.map((campaign, index) => (
              <motion.tr
                key={campaign.campaignId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-cream/60"
              >
                <td className="px-4 py-3 text-small font-medium text-charcoal">
                  {campaign.campaignId}
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  {campaign.sent.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  {campaign.opened.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  {campaign.clicked.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  <span
                    className={`font-semibold ${
                      campaign.openRate > 20 ? "text-green-600" : campaign.openRate > 10 ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {campaign.openRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  <span
                    className={`font-semibold ${
                      campaign.clickRate > 5 ? "text-green-600" : campaign.clickRate > 2 ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {campaign.clickRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-small text-charcoal">
                  <span
                    className={`font-semibold ${
                      campaign.conversionRate > 2 ? "text-green-600" : campaign.conversionRate > 1 ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {campaign.conversionRate.toFixed(1)}%
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

