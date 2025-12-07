"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLevelBadge } from "./ActivityLevelBadge";
import { ActivityScopeTag } from "./ActivityScopeTag";
import { ActivityMetadataDrawer } from "./ActivityMetadataDrawer";
import { formatTimeRelative } from "@/lib/utils/date";

export interface ActivityLogEntry {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  level: "info" | "warning" | "error";
  scope: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  provider_id?: number | null;
  class_id?: number | null;
  user_id?: string | null;
}

interface ActivityItemProps {
  activity: ActivityLogEntry;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  function redactSensitiveData(metadata: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!metadata) return null;

    const redacted = { ...metadata };
    const sensitiveKeys = ["email", "token", "password", "secret", "api_key"];

    for (const key of sensitiveKeys) {
      if (key in redacted) {
        redacted[key] = "[REDACTED]";
      }
    }

    return redacted;
  }

  const { relative, absolute } = formatTimeRelative(activity.created_at);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ActivityLevelBadge level={activity.level} />
                <ActivityScopeTag scope={activity.scope} />
                <span className="text-small text-slateSoft">
                  {relative} · {absolute}
                </span>
              </div>

              <h3 className="font-semibold text-charcoal">{activity.title}</h3>

              {activity.description && (
                <p className="text-small text-slateSoft">{activity.description}</p>
              )}

              {/* Show provider/class info if available */}
              {(activity.provider_id || activity.class_id) && (
                <div className="flex items-center gap-4 text-small text-slateSoft">
                  {activity.provider_id && (
                    <span>Provider ID: {activity.provider_id}</span>
                  )}
                  {activity.class_id && <span>Class ID: {activity.class_id}</span>}
                </div>
              )}
            </div>

            {activity.metadata && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMetadata(true)}
                className="shrink-0"
              >
                <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showMetadata && (
        <ActivityMetadataDrawer
          activity={activity}
          metadata={redactSensitiveData(activity.metadata ?? null)}
          onClose={() => setShowMetadata(false)}
        />
      )}
    </>
  );
}

