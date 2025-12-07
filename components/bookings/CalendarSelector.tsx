"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isPast } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarSelectorProps = {
  sessions: Array<{
    sessionId: number;
    startTime: string;
    endTime: string;
    seatsAvailable: number;
    isAvailable: boolean;
  }>;
  selectedSessionId?: number;
  onSelectSession: (sessionId: number) => void;
};

export default function CalendarSelector({
  sessions,
  selectedSessionId,
  onSelectSession,
}: CalendarSelectorProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      return isSameDay(sessionDate, date);
    });
  };

  const nextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const prevWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">
            {format(currentWeek, "MMM d")} - {format(addDays(currentWeek, 6), "MMM d, yyyy")}
          </h3>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const daySessions = getSessionsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isPastDate = isPast(day) && !isToday;

            return (
              <div key={i} className="text-center">
                <div
                  className={`text-xs font-medium mb-1 ${
                    isToday ? "text-sage" : isPastDate ? "text-gray-400" : "text-charcoal"
                  }`}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-sm mb-2 ${
                    isToday ? "font-bold text-sage" : isPastDate ? "text-gray-400" : "text-charcoal"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {daySessions.map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={() => session.isAvailable && onSelectSession(session.sessionId)}
                      disabled={!session.isAvailable || isPastDate}
                      className={`w-full text-xs p-1 rounded ${
                        selectedSessionId === session.sessionId
                          ? "bg-sage text-white"
                          : session.isAvailable && !isPastDate
                            ? "bg-cream hover:bg-sage/20 text-charcoal"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {format(new Date(session.startTime), "HH:mm")}
                      <br />
                      <span className="text-[10px]">
                        {session.seatsAvailable} left
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}





