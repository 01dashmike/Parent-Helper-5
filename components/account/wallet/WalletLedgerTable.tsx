"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { LedgerEntry } from "@/lib/wallet/wallet";

type WalletLedgerTableProps = {
  entries: LedgerEntry[];
  getTypeLabel: (type: LedgerEntry["type"]) => string;
  getTypeColor: (type: LedgerEntry["type"]) => string;
};

export default function WalletLedgerTable({
  entries,
  getTypeLabel,
  getTypeColor,
}: WalletLedgerTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-slateSoft">
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-sage/20">
            <th className="text-left p-3 text-sm font-semibold">Date</th>
            <th className="text-left p-3 text-sm font-semibold">Type</th>
            <th className="text-left p-3 text-sm font-semibold">Description</th>
            <th className="text-right p-3 text-sm font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-sage/10 hover:bg-cream/30">
              <td className="p-3 text-sm">
                {format(entry.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </td>
              <td className="p-3">
                <Badge variant="outline">{getTypeLabel(entry.type)}</Badge>
              </td>
              <td className="p-3 text-sm">
                {String(
                  (entry.metadata?.description as string | undefined) ??
                  (entry.metadata?.reason as string | undefined) ??
                  "-"
                )}
              </td>
              <td className={`p-3 text-sm font-semibold text-right ${getTypeColor(entry.type)}`}>
                {entry.amount > 0 ? "+" : ""}
                {entry.amount} credits
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


