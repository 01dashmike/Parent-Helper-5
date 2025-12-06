"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type UpsellItem = {
  id: number;
  title: string;
  description: string;
  price: number;
  type: "block_upgrade" | "add_on" | "subscription_offer";
  metadata?: Record<string, unknown>;
};

type UpsellSelectorProps = {
  upsells: UpsellItem[];
  selectedUpsellIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
};

export default function UpsellSelector({
  upsells,
  selectedUpsellIds,
  onSelectionChange,
}: UpsellSelectorProps) {
  const handleToggle = (upsellId: number) => {
    if (selectedUpsellIds.includes(upsellId)) {
      onSelectionChange(selectedUpsellIds.filter((id) => id !== upsellId));
    } else {
      onSelectionChange([...selectedUpsellIds, upsellId]);
    }
  };

  if (upsells.length === 0) {
    return null;
  }

  const selectedUpsells = upsells.filter((u) => selectedUpsellIds.includes(u.id));
  const totalUpsellPrice = selectedUpsells.reduce((sum, u) => sum + u.price, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle>Add-ons & Upgrades</CardTitle>
        </div>
        <p className="text-sm text-slateSoft mt-1">
          Enhance your booking with these optional extras
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {upsells.map((upsell) => {
          const isSelected = selectedUpsellIds.includes(upsell.id);
          const isBlockUpgrade = upsell.type === "block_upgrade";
          const isSubscription = upsell.type === "subscription_offer";

          return (
            <div
              key={upsell.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-sage bg-sage/10"
                  : "border-sage/20 hover:border-sage/40"
              }`}
              onClick={() => handleToggle(upsell.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(upsell.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="font-semibold cursor-pointer">{upsell.title}</Label>
                    <Badge variant={isBlockUpgrade ? "info" : isSubscription ? "warning" : "secondary"}>
                      {upsell.price === 0 ? "Free" : `£${upsell.price.toFixed(2)}`}
                    </Badge>
                  </div>
                  {upsell.description && (
                    <p className="text-sm text-slateSoft">{upsell.description}</p>
                  )}
                  {isBlockUpgrade && typeof upsell.metadata?.block_weeks === "number" && (
                    <p className="text-xs text-sage mt-1">
                      {upsell.metadata.block_weeks} weeks at {typeof upsell.metadata.discount_percent === "number" ? upsell.metadata.discount_percent : 0}% off
                    </p>
                  )}
                  {isSubscription && (
                    <p className="text-xs text-amber-600 mt-1">Trial offer - Limited time</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {totalUpsellPrice > 0 && (
          <div className="mt-4 pt-4 border-t border-sage/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total add-ons:</span>
              <span className="text-lg font-bold text-sage">£{totalUpsellPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


