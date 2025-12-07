"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/formfield";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/lib/hooks/useToast";
import { saveCreditSettings } from "@/app/provider/(console)/credits/actions";
import type { ProviderCreditSettings } from "@/lib/wallet/providerCredits";

const creditSettingsSchema = z.object({
  acceptsCredits: z.boolean(),
  creditCostPerClass: z.number().min(1, "Credit cost must be at least 1"),
  unlimitedPassEnabled: z.boolean(),
  unlimitedPassPrice: z.number().min(0).optional(),
  unlimitedPassType: z.enum(["weekly", "monthly"]).optional(),
  classOverrides: z.record(z.number()).default({}),
}).refine((data) => {
  if (data.unlimitedPassEnabled && !data.unlimitedPassType) {
    return false;
  }
  return true;
}, {
  message: "Pass type is required when unlimited pass is enabled",
  path: ["unlimitedPassType"],
}).refine((data) => {
  if (data.unlimitedPassEnabled && data.unlimitedPassType && (!data.unlimitedPassPrice || data.unlimitedPassPrice <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Pass price is required when unlimited pass is enabled",
  path: ["unlimitedPassPrice"],
});

type CreditSettingsFormData = z.infer<typeof creditSettingsSchema>;

type CreditSettingsFormProps = {
  providerId: number;
  initialSettings: ProviderCreditSettings | null;
};

export default function CreditSettingsForm({
  providerId,
  initialSettings,
}: CreditSettingsFormProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreditSettingsFormData>({
    resolver: zodResolver(creditSettingsSchema),
    defaultValues: {
      acceptsCredits: initialSettings?.acceptsCredits || false,
      creditCostPerClass: initialSettings?.creditCostPerClass || 1,
      unlimitedPassEnabled: initialSettings?.unlimitedPassEnabled || false,
      unlimitedPassPrice: initialSettings?.unlimitedPassPrice || undefined,
      unlimitedPassType: initialSettings?.unlimitedPassType || undefined,
      classOverrides: initialSettings?.classOverrides
        ? Object.fromEntries(
            Object.entries(initialSettings.classOverrides).map(([classId, override]) => [
              classId,
              override?.creditCost ?? initialSettings.creditCostPerClass ?? 0,
            ])
          )
        : {},
    },
  });

  const acceptsCredits = form.watch("acceptsCredits");
  const unlimitedPassEnabled = form.watch("unlimitedPassEnabled");
  const unlimitedPassType = form.watch("unlimitedPassType");

  const onSubmit = async (data: CreditSettingsFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("providerId", providerId.toString());
      formData.append("acceptsCredits", data.acceptsCredits.toString());
      formData.append("creditCostPerClass", data.creditCostPerClass.toString());
      formData.append("unlimitedPassEnabled", data.unlimitedPassEnabled.toString());
      if (data.unlimitedPassPrice) {
        formData.append("unlimitedPassPrice", data.unlimitedPassPrice.toString());
      }
      if (data.unlimitedPassType) {
        formData.append("unlimitedPassType", data.unlimitedPassType);
      }
      formData.append("classOverrides", JSON.stringify(data.classOverrides));

      const result = await saveCreditSettings(formData);

      if (result.error) {
        showError(result.error);
        return;
      }

      showSuccess("Settings saved");
    } catch {
      showError("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
    <Card>
      <CardHeader>
        <CardTitle>Credit Acceptance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="acceptsCredits">Accept Credits</Label>
            <p className="text-sm text-slateSoft">
              Allow parents to book classes using credits
            </p>
          </div>
          <Switch
            id="acceptsCredits"
            checked={acceptsCredits}
            onCheckedChange={(checked) => form.setValue("acceptsCredits", checked)}
          />
        </div>

        {acceptsCredits && (
          <FormField
            label="Credit Cost Per Class"
            required
            error={form.formState.errors.creditCostPerClass?.message}
            id="creditCostPerClass"
          >
            <Input
              {...form.register("creditCostPerClass", { valueAsNumber: true })}
              type="number"
              min="1"
            />
            <p className="text-sm text-slateSoft mt-1">
              Number of credits required per class booking
            </p>
          </FormField>
        )}

        <div className="border-t border-sage/20 pt-6">
          <h3 className="font-semibold mb-4">Unlimited Passes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="unlimitedPassEnabled">Offer Unlimited Pass</Label>
                <p className="text-sm text-slateSoft">
                  Allow parents to purchase weekly or monthly unlimited passes
                </p>
              </div>
              <Switch
                id="unlimitedPassEnabled"
                checked={unlimitedPassEnabled}
                onCheckedChange={(checked) => form.setValue("unlimitedPassEnabled", checked)}
              />
            </div>

            {unlimitedPassEnabled && (
              <>
                <FormField
                  label="Pass Type"
                  required
                  error={form.formState.errors.unlimitedPassType?.message}
                  id="unlimitedPassType"
                >
                  <select
                    {...form.register("unlimitedPassType")}
                    className="w-full rounded-md border border-sage/30 bg-white px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                  >
                    <option value="">Select type</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </FormField>

                {unlimitedPassType && (
                  <FormField
                    label="Pass Price (pence)"
                    required
                    error={form.formState.errors.unlimitedPassPrice?.message}
                    id="unlimitedPassPrice"
                  >
                    <Input
                      {...form.register("unlimitedPassPrice", { valueAsNumber: true })}
                      type="number"
                      min="0"
                    />
                    <p className="text-sm text-slateSoft mt-1">
                      Price in pence (e.g., 5000 = £50.00)
                    </p>
                  </FormField>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
      </form>
    </FormProvider>
    {ToastComponent}
    </>
  );
}

