"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LowSlotsNotificationProps {
  area: string;
  availableSlots: number;
  totalSlots: number;
}

export default function LowSlotsNotification({
  area,
  availableSlots,
  totalSlots,
}: LowSlotsNotificationProps) {
  // Guard against invalid values
  const safeAvailableSlots = availableSlots ?? 0;
  const safeTotalSlots = totalSlots ?? 0;
  
  if (safeTotalSlots === 0 || safeAvailableSlots > safeTotalSlots * 0.2) {
    return null; // Only show if less than 20% slots available
  }

  const percentage = Math.round((safeAvailableSlots / safeTotalSlots) * 100);

  return (
    <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">Featured listing slots running low</h3>
          <p className="mt-1 text-sm text-yellow-800">
            Only {safeAvailableSlots} of {safeTotalSlots} featured slots available in {area} ({percentage}% remaining).
          </p>
          <Link
            href="/provider/(console)/classes"
            className="mt-2 inline-block text-sm font-medium text-yellow-900 underline hover:text-yellow-700"
          >
            Upgrade your listing →
          </Link>
        </div>
      </div>
    </div>
  );
}

