"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/lib/hooks/useToast";
import { saveNotificationSettings } from "@/app/account/settings/notifications/actions";

const providerNotificationSettingsSchema = z.object({
  emailMarketingOptIn: z.boolean(),
  emailTransactionalOptIn: z.boolean(),
  smsOptIn: z.boolean(),
});

type ProviderNotificationSettingsFormData = z.infer<typeof providerNotificationSettingsSchema>;

type ProviderNotificationSettingsFormProps = {
  userId: string;
  initialSettings?: {
    email_marketing_opt_in: boolean;
    email_transactional_opt_in: boolean;
    sms_opt_in: boolean;
  };
};

export default function ProviderNotificationSettingsForm({
  userId: _userId,
  initialSettings,
}: ProviderNotificationSettingsFormProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const form = useForm<ProviderNotificationSettingsFormData>({
    resolver: zodResolver(providerNotificationSettingsSchema),
    defaultValues: {
      emailMarketingOptIn: initialSettings?.email_marketing_opt_in ?? true,
      emailTransactionalOptIn: initialSettings?.email_transactional_opt_in ?? true,
      smsOptIn: initialSettings?.sms_opt_in ?? false,
    },
  });

  const onSubmit = async (data: ProviderNotificationSettingsFormData) => {
    setIsSubmitting(true);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("emailMarketingOptIn", data.emailMarketingOptIn.toString());
      formData.append("emailTransactionalOptIn", data.emailTransactionalOptIn.toString());
      formData.append("smsOptIn", data.smsOptIn.toString());

      const result = await saveNotificationSettings(formData);

      if (result.error) {
        showError(result.error);
        return;
      }

      setSaved(true);
      showSuccess("Settings saved");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showError("Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-slateSoft">Manage how we communicate with you</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailTransactionalOptIn">Booking Notifications</Label>
              <p className="text-sm text-slateSoft">
                Receive booking confirmations and important updates
              </p>
            </div>
            <Switch
              id="emailTransactionalOptIn"
              checked={form.watch("emailTransactionalOptIn")}
              onCheckedChange={(checked) => form.setValue("emailTransactionalOptIn", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailMarketingOptIn">Weekly Performance Summaries</Label>
              <p className="text-sm text-slateSoft">
                Receive weekly performance digests and growth tips
              </p>
            </div>
            <Switch
              id="emailMarketingOptIn"
              checked={form.watch("emailMarketingOptIn")}
              onCheckedChange={(checked) => form.setValue("emailMarketingOptIn", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="onboardingReminders">Onboarding Reminders</Label>
              <p className="text-sm text-slateSoft">
                Receive reminders to complete your profile (auto-disabled after completion)
              </p>
            </div>
            <Switch
              id="onboardingReminders"
              checked={form.watch("emailMarketingOptIn")}
              onCheckedChange={(checked) => form.setValue("emailMarketingOptIn", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Settings saved</span>
          </div>
        )}
        <Button type="submit" disabled={isSubmitting} size="lg">
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
        </form>
      </FormProvider>
    </div>
    {ToastComponent}
    </>
  );
}

