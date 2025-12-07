"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ActivityLogEntry } from "./ActivityItem";

interface ActivityMetadataDrawerProps {
  activity: ActivityLogEntry;
  metadata: Record<string, unknown> | null;
  onClose: () => void;
}

export function ActivityMetadataDrawer({
  activity,
  metadata,
  onClose,
}: ActivityMetadataDrawerProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Details</DialogTitle>
          <DialogDescription>
            Full metadata for: {activity.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-small mb-2">Event Information</h4>
            <div className="bg-cream rounded p-3 space-y-1 text-small">
              <div>
                <span className="font-medium">Event Type:</span> {activity.event_type}
              </div>
              <div>
                <span className="font-medium">Scope:</span> {activity.scope}
              </div>
              <div>
                <span className="font-medium">Level:</span> {activity.level}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {activity.description && (
            <div>
              <h4 className="font-semibold text-small mb-2">Description</h4>
              <p className="text-small text-slateSoft bg-cream rounded p-3">
                {activity.description}
              </p>
            </div>
          )}

          {metadata && (
            <div>
              <h4 className="font-semibold text-small mb-2">Metadata</h4>
              <pre className="bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto text-small">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}

          {!metadata && (
            <div className="text-small text-slateSoft text-center py-4">
              No metadata available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

