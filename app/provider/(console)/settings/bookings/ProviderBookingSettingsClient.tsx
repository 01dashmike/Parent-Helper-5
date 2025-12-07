"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/lib/hooks/useToast";

type ProviderBookingSettingsClientProps = {
  providerId: number;
  initialSettings?: {
    allow_free_bookings: boolean;
    allow_drop_ins: boolean;
    allow_block_bookings: boolean;
    default_capacity: number;
    require_child_details: boolean;
    require_parent_phone: boolean;
    booking_deadline_hours: number;
    cancellation_policy: string | null;
    refund_policy: string | null;
  };
};

export default function ProviderBookingSettingsClient({
  providerId,
  initialSettings,
}: ProviderBookingSettingsClientProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    allowFreeBookings: initialSettings?.allow_free_bookings ?? true,
    allowDropIns: initialSettings?.allow_drop_ins ?? true,
    allowBlockBookings: initialSettings?.allow_block_bookings ?? false,
    defaultCapacity: initialSettings?.default_capacity ?? 10,
    requireChildDetails: initialSettings?.require_child_details ?? true,
    requireParentPhone: initialSettings?.require_parent_phone ?? false,
    bookingDeadlineHours: initialSettings?.booking_deadline_hours ?? 2,
    cancellationPolicy: initialSettings?.cancellation_policy || "",
    refundPolicy: initialSettings?.refund_policy || "",
  });

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("providerId", providerId.toString());
      formData.append("allowFreeBookings", settings.allowFreeBookings.toString());
      formData.append("allowDropIns", settings.allowDropIns.toString());
      formData.append("allowBlockBookings", settings.allowBlockBookings.toString());
      formData.append("defaultCapacity", settings.defaultCapacity.toString());
      formData.append("requireChildDetails", settings.requireChildDetails.toString());
      formData.append("requireParentPhone", settings.requireParentPhone.toString());
      formData.append("bookingDeadlineHours", settings.bookingDeadlineHours.toString());
      formData.append("cancellationPolicy", settings.cancellationPolicy);
      formData.append("refundPolicy", settings.refundPolicy);

      const response = await fetch("/api/provider/settings/bookings", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        showError(data.error);
        return;
      }

      setSaved(true);
      showSuccess("Settings saved");
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      showError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Booking Settings</h1>
        <p className="text-slateSoft">Configure how parents can book your classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowFreeBookings">Allow Free Bookings</Label>
              <p className="text-sm text-slateSoft">Parents can book free/RSVP classes</p>
            </div>
            <Switch
              id="allowFreeBookings"
              checked={settings.allowFreeBookings}
              onCheckedChange={(checked) => setSettings({ ...settings, allowFreeBookings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowDropIns">Allow Drop-in Bookings</Label>
              <p className="text-sm text-slateSoft">Parents can book single sessions</p>
            </div>
            <Switch
              id="allowDropIns"
              checked={settings.allowDropIns}
              onCheckedChange={(checked) => setSettings({ ...settings, allowDropIns: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowBlockBookings">Allow Block Bookings</Label>
              <p className="text-sm text-slateSoft">Parents can book multiple weeks at once</p>
            </div>
            <Switch
              id="allowBlockBookings"
              checked={settings.allowBlockBookings}
              onCheckedChange={(checked) => setSettings({ ...settings, allowBlockBookings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireChildDetails">Require Child Details</Label>
              <p className="text-sm text-slateSoft">Parents must provide child name and age</p>
            </div>
            <Switch
              id="requireChildDetails"
              checked={settings.requireChildDetails}
              onCheckedChange={(checked) => setSettings({ ...settings, requireChildDetails: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireParentPhone">Require Parent Phone</Label>
              <p className="text-sm text-slateSoft">Parents must provide phone number</p>
            </div>
            <Switch
              id="requireParentPhone"
              checked={settings.requireParentPhone}
              onCheckedChange={(checked) => setSettings({ ...settings, requireParentPhone: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Capacity & Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultCapacity">Default Capacity</Label>
            <Input
              id="defaultCapacity"
              type="number"
              min="1"
              max="100"
              value={settings.defaultCapacity}
              onChange={(e) => setSettings({ ...settings, defaultCapacity: parseInt(e.target.value, 10) || 10 })}
            />
            <p className="text-sm text-slateSoft mt-1">Default number of spaces per session</p>
          </div>

          <div>
            <Label htmlFor="bookingDeadlineHours">Booking Deadline (Hours)</Label>
            <Input
              id="bookingDeadlineHours"
              type="number"
              min="0"
              max="168"
              value={settings.bookingDeadlineHours}
              onChange={(e) => setSettings({ ...settings, bookingDeadlineHours: parseInt(e.target.value, 10) || 2 })}
            />
            <p className="text-sm text-slateSoft mt-1">Minimum hours before session start that bookings must be made</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
            <Textarea
              id="cancellationPolicy"
              value={settings.cancellationPolicy}
              onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
              rows={4}
              placeholder="e.g., Cancellations must be made 24 hours in advance for a full refund..."
            />
          </div>

          <div>
            <Label htmlFor="refundPolicy">Refund Policy</Label>
            <Textarea
              id="refundPolicy"
              value={settings.refundPolicy}
              onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
              rows={4}
              placeholder="e.g., Refunds are processed within 5-7 business days..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        {saved && (
          <Alert className="flex-1 mr-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? (
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
    </div>
    {ToastComponent}
    </>
  );
}

