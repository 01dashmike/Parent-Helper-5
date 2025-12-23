"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, Calendar, ArrowRight, History } from "lucide-react";
import Link from "next/link";
import type { Wallet, LedgerEntry } from "@/lib/wallet/wallet";
import type { ParentPass } from "@/lib/wallet/passes";
import WalletLedgerTable from "./WalletLedgerTable";
import WalletPassesPanel from "./WalletPassesPanel";
import { getWalletTier } from "@/lib/wallet/tiers";
import { useMemo } from "react";

type WalletOverviewProps = {
  wallet: Wallet;
  ledger: LedgerEntry[];
  passes: ParentPass[];
  userId: string;
  expiringAmount?: number; // Optional: credits expiring soon (calculated server-side)
};

export default function WalletOverview({
  wallet,
  ledger,
  passes,
  userId: _userId,
  expiringAmount = 0,
}: WalletOverviewProps) {
  // Calculate tier (client-side, derived from props)
  const tierInfo = useMemo(() => {
    return getWalletTier(wallet.creditBalance, ledger);
  }, [wallet.creditBalance, ledger]);

  const getLedgerTypeLabel = (type: LedgerEntry["type"]) => {
    const labels: Record<LedgerEntry["type"], string> = {
      purchase: "Purchase",
      spend: "Spent",
      refund: "Refund",
      bonus: "Bonus",
      expiry: "Expired",
      admin_adjustment: "Admin Adjustment",
      pass_purchase: "Pass Purchase",
      pass_usage: "Pass Usage",
    };
    return labels[type] || type;
  };

  const getLedgerTypeColor = (type: LedgerEntry["type"]) => {
    if (type === "purchase" || type === "refund" || type === "bonus" || type === "pass_purchase") {
      return "text-green-600";
    }
    if (type === "spend" || type === "expiry" || type === "pass_usage") {
      return "text-red-600";
    }
    return "text-slateSoft";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
        <p className="text-slateSoft">Manage your credits and passes</p>
      </div>

      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm text-slateSoft">Available Credits</p>
                {tierInfo?.currentTier && (
                  <Badge variant="outline" className="text-xs">
                    Tier: {tierInfo.currentTier.name}
                  </Badge>
                )}
              </div>
              <p className="text-5xl font-bold text-sage">
                {wallet.creditBalance}
              </p>
              {expiringAmount > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  Warning: {expiringAmount} credits expiring in the next 30 days
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/account/wallet/buy-credits">
                  <Plus className="mr-2 h-4 w-4" />
                  Buy Credits
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Passes */}
      {passes.length > 0 && (
        <div className="mb-6">
          <WalletPassesPanel passes={passes} />
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            {ledger.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href="/account/wallet/history">
                  View Full History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <WalletLedgerTable
            entries={ledger}
            getTypeLabel={getLedgerTypeLabel}
            getTypeColor={getLedgerTypeColor}
          />
        </CardContent>
      </Card>
    </div>
  );
}


