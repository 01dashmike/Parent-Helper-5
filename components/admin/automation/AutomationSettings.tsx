"use client";

import { useState, useCallback, useEffect } from "react";
import { Settings, Sparkles, Mail, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FeatureFlags {
  AI_INSIGHTS_ENABLED: boolean;
  WEEKLY_REPORTS_ENABLED: boolean;
  AI_PERFORMANCE_COACH_ENABLED: boolean;
}

export default function AutomationSettings() {
  const [flags, setFlags] = useState<FeatureFlags>({
    AI_INSIGHTS_ENABLED: false,
    WEEKLY_REPORTS_ENABLED: false,
    AI_PERFORMANCE_COACH_ENABLED: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchToggles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/automation/toggles");
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || {
          AI_INSIGHTS_ENABLED: false,
          WEEKLY_REPORTS_ENABLED: false,
          AI_PERFORMANCE_COACH_ENABLED: false,
        });
      }
    } catch (error) {
      console.error("Error fetching toggles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  async function handleToggle(flagKey: keyof FeatureFlags, enabled: boolean) {
    setSaving(flagKey);
    try {
      const response = await fetch("/api/admin/automation/toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [flagKey]: enabled,
        }),
      });
      if (response.ok) {
        setFlags((prev) => ({ ...prev, [flagKey]: enabled }));
      }
    } catch (error) {
      console.error("Error updating toggle:", error);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-4">
            <div className="h-4 bg-sage/20 rounded w-3/4"></div>
            <div className="h-4 bg-sage/20 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const settings = [
    {
      key: "AI_INSIGHTS_ENABLED" as const,
      title: "AI Growth Insights Engine",
      description: "Enable weekly AI-generated growth insights and recommendations",
      icon: Sparkles,
    },
    {
      key: "WEEKLY_REPORTS_ENABLED" as const,
      title: "Automated Weekly Provider Reports",
      description: "Enable automatic weekly email reports sent to providers",
      icon: Mail,
    },
    {
      key: "AI_PERFORMANCE_COACH_ENABLED" as const,
      title: "AI Performance Coach",
      description: "Enable AI chat assistant for growth metrics and insights",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title font-semibold text-charcoal">Automation Settings</h2>
        <p className="text-small text-slateSoft mt-1">
          Control which automation features are enabled
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-sage" aria-hidden="true" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Toggle automation features on or off
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting) => {
            const Icon = setting.icon;
            const isSaving = saving === setting.key;
            return (
              <div
                key={setting.key}
                className="flex items-start justify-between p-4 rounded-lg border border-sage/20 bg-cream/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-sage" aria-hidden="true" />
                    <Label htmlFor={setting.key} className="text-body font-semibold text-charcoal">
                      {setting.title}
                    </Label>
                  </div>
                  <p className="text-small text-slateSoft ml-7">{setting.description}</p>
                </div>
                <div className="ml-4">
                  <Switch
                    id={setting.key}
                    checked={flags[setting.key]}
                    onCheckedChange={(checked) => handleToggle(setting.key, checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
