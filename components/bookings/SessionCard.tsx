"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Check } from "lucide-react";

type SessionCardProps = {
  session: {
    sessionId: number;
    startTime: string;
    endTime: string;
    capacity: number;
    seatsTaken: number;
    seatsAvailable: number;
    isAvailable: boolean;
  };
  selected?: boolean;
  onSelect: () => void;
};

export default function SessionCard({ session, selected, onSelect }: SessionCardProps) {
  const startDate = new Date(session.startTime);
  const endDate = new Date(session.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected
          ? "border-sage bg-sage/10"
          : session.isAvailable
            ? "border-sage/30 hover:border-sage/50 hover:shadow-md"
            : "border-gray-200 opacity-50 cursor-not-allowed"
      }`}
      onClick={session.isAvailable ? onSelect : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-sage" />
              <span className="font-semibold">{format(startDate, "EEE, MMM d")}</span>
            </div>
            <p className="text-sm text-slateSoft mb-2">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")} ({duration} min)
            </p>
            <div className="flex items-center gap-4 text-xs text-slateSoft">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>
                  {session.seatsAvailable} of {session.capacity} available
                </span>
              </div>
            </div>
          </div>
          {selected && (
            <div className="flex-shrink-0">
              <div className="rounded-full bg-sage text-white p-1">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
        {!session.isAvailable && (
          <p className="text-xs text-red-600 mt-2">Fully booked</p>
        )}
      </CardContent>
    </Card>
  );
}








