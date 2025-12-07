"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Coins, Calendar } from "lucide-react";
import CreditSettingsForm from "@/components/provider/credits/CreditSettingsForm";
import type { ProviderCreditSettings } from "@/lib/wallet/providerCredits";

type ProviderCreditsClientProps = {
  providerId: number;
  initialSettings: ProviderCreditSettings | null;
};

export default function ProviderCreditsClient({
  providerId,
  initialSettings,
}: ProviderCreditsClientProps) {
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [passPurchases, setPassPurchases] = useState(0);
  const [revenue, setRevenue] = useState(0);

  // Fetch analytics (placeholder - implement actual queries)
  useEffect(() => {
    // TODO: Fetch from booking_credit_redemptions and wallet_ledger
    // For now, using placeholder values
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Credit Settings</h1>
        <p className="text-slateSoft">Configure credit-based bookings for your classes</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <CreditSettingsForm providerId={providerId} initialSettings={initialSettings} />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Coins className="h-8 w-8 text-sage" />
                </div>
                <p className="text-sm text-slateSoft mb-1">Credits Used (30d)</p>
                <p className="text-2xl font-bold">{creditsUsed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-sage" />
                </div>
                <p className="text-sm text-slateSoft mb-1">Pass Purchases (30d)</p>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-8 w-8 text-sage" />
                </div>
                <p className="text-sm text-slateSoft mb-1">Revenue from Credits</p>
                <p className="text-2xl font-bold">£0.00</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

