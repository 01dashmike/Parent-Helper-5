"use client";

import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";

interface WalletInsight {
  wallet_id: string;
  owner_id: string;
  total_credits: number;
  total_transactions: number;
  member_count: number;
}

interface WalletInsightsTableProps {
  wallets: WalletInsight[];
}

export default function WalletInsightsTable({ wallets }: WalletInsightsTableProps) {
  if (wallets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-sage/20 bg-white p-6"
      >
        <h3 className="mb-4 text-title font-semibold text-charcoal">Family Wallet Insights</h3>
        <p className="text-small text-slateSoft">No wallet data available yet.</p>
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
      <h3 className="mb-4 text-title font-semibold text-charcoal">Top 10 Most Active Wallets</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20">
          <thead className="bg-cream/70">
            <tr>
              <th className="px-4 py-3 text-left text-small font-medium uppercase tracking-wide text-slateSoft">
                Wallet ID
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Total Credits
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Transactions
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Members
              </th>
              <th className="px-4 py-3 text-right text-small font-medium uppercase tracking-wide text-slateSoft">
                Avg per Member
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10 bg-white">
            {wallets.map((wallet, index) => {
              const avgPerMember = wallet.member_count > 0
                ? wallet.total_credits / wallet.member_count
                : 0;

              return (
                <motion.tr
                  key={wallet.wallet_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-cream/60"
                >
                  <td className="px-4 py-3 text-small font-mono text-charcoal">
                    {wallet.wallet_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-right text-small font-semibold text-charcoal">
                    £{wallet.total_credits.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-small text-charcoal">
                    {wallet.total_transactions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-small text-charcoal">
                    {wallet.member_count}
                  </td>
                  <td className="px-4 py-3 text-right text-small text-slateSoft">
                    £{avgPerMember.toFixed(2)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

