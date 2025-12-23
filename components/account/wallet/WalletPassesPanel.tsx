"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { ParentPass } from "@/lib/wallet/passes";

type WalletPassesPanelProps = {
  passes: ParentPass[];
};

export default function WalletPassesPanel({ passes }: WalletPassesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Active Passes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {passes.map((pass) => {
            const daysRemaining = differenceInDays(pass.endsAt, new Date());
            return (
              <div
                key={pass.id}
                className="flex items-center justify-between p-4 border border-sage/20 rounded-lg"
              >
                <div>
                  <p className="font-semibold">
                    {pass.passType === "unlimited_weekly"
                      ? "Weekly Unlimited Pass"
                      : pass.passType === "unlimited_monthly"
                        ? "Monthly Unlimited Pass"
                        : "Custom Pass"}
                  </p>
                  <p className="text-sm text-slateSoft">
                    Valid until {format(pass.endsAt, "MMM d, yyyy")}
                    {daysRemaining > 0 && ` (${daysRemaining} days remaining)`}
                  </p>
                </div>
                <Badge variant={daysRemaining > 0 ? "default" : "destructive"}>
                  {daysRemaining > 0 ? "Active" : "Expired"}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}








