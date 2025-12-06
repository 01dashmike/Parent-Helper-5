"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Calendar, CheckCircle } from "lucide-react";

type CreditRedemptionBannerProps = {
  classId: number;
  sessionPrice: number;
  canUseCredits: boolean;
  canUsePass: boolean;
  creditCost?: number;
  pass?: {
    id: number;
    passType: string;
    endsAt: Date;
  };
  onUseCredits: () => void;
  onUsePass: () => void;
  selectedMethod?: "credits" | "pass" | null;
};

export default function CreditRedemptionBanner({
  classId: _classId,
  sessionPrice,
  canUseCredits,
  canUsePass,
  creditCost,
  pass,
  onUseCredits,
  onUsePass,
  selectedMethod,
}: CreditRedemptionBannerProps) {
  if (!canUseCredits && !canUsePass) {
    return null;
  }

  return (
    <Card className="border-sage/30 bg-cream/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {canUsePass && pass && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-sage" />
                  <span className="font-semibold">Unlimited Pass Active</span>
                  <Badge variant="default">Free Booking</Badge>
                </div>
                <p className="text-sm text-slateSoft">
                  Valid until {new Date(pass.endsAt).toLocaleDateString()}
                </p>
                {selectedMethod === "pass" && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pass selected</span>
                  </div>
                )}
                {selectedMethod !== "pass" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUsePass}
                    className="mt-2"
                  >
                    Use Unlimited Pass
                  </Button>
                )}
              </div>
            )}

            {canUseCredits && creditCost !== undefined && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-sage" />
                  <span className="font-semibold">
                    Use {creditCost} credit{creditCost !== 1 ? "s" : ""} instead of paying £{sessionPrice.toFixed(2)}
                  </span>
                </div>
                {selectedMethod === "credits" && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Credits selected</span>
                  </div>
                )}
                {selectedMethod !== "credits" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUseCredits}
                    className="mt-2"
                  >
                    Use Credits
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


