"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import { BookNowButton } from "@/components/BookNowButton";
import { BookingButton } from "@/components/BookingButton";
import { isBookingsFeatureEnabled } from "@/lib/env";
import { formatDate, formatDateRange as formatDateRangeHelper } from "@/lib/utils/date";

type Occurrence = {
  id: string | number;
  starts_at: string;
  ends_at: string | null;
  status: string;
  bookable: boolean;
  stripe_payment_link_url: string | null;
  capacity?: number | null;
  available_spots?: number | null;
  price?: string | null;
  discount_price?: string | null;
};

type ClassCalendarClientProps = {
  occurrences: Occurrence[];
  classId: number;
};

type ViewMode = "month" | "week";

function formatDateRange(start: string, end: string | null) {
  if (!end) {
    return formatDate(start, "datetime");
  }
  return formatDateRangeHelper(start, end);
}

export default function ClassCalendarClient({ occurrences, classId }: ClassCalendarClientProps) {
  // Use lazy initialization to prevent hydration mismatches (server/client time differences)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);

  // Group occurrences by date
  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    occurrences.forEach((occ) => {
      const dateKey = format(new Date(occ.starts_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(occ);
    });
    return map;
  }, [occurrences]);

  // Get occurrences for a specific date
  const getOccurrencesForDate = (date: Date): Occurrence[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return occurrencesByDate.get(dateKey) || [];
  };

  // Determine status color
  const getStatusColor = (occurrence: Occurrence): string => {
    if (occurrence.discount_price) {
      return "bg-amber-100 border-amber-300 text-amber-900"; // On discount
    }
    if (occurrence.capacity && occurrence.available_spots !== null) {
      if (occurrence.available_spots === 0) {
        return "bg-red-100 border-red-300 text-red-900"; // Full
      }
    }
    if (occurrence.status === "cancelled") {
      return "bg-cream border-sage/20 text-slateSoft"; // Cancelled
    }
    return "bg-green-100 border-green-300 text-green-900"; // Available
  };

  // Month view calendar days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Week view calendar days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  }, [currentDate]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((date) => (direction === "next" ? addMonths(date, 1) : subMonths(date, 1)));
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((date) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    const occs = getOccurrencesForDate(date);
    if (occs.length > 0) {
      setSelectedOccurrence(occs[0]);
    }
  };

  const handleOccurrenceClick = (occurrence: Occurrence, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedOccurrence(occurrence);
  };

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "rounded-lg px-4 py-2 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
              viewMode === "month" ? "bg-sage text-white" : "bg-white text-charcoal hover:bg-cream"
            )}
            aria-label="Switch to month view"
            aria-pressed={viewMode === "month"}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "rounded-lg px-4 py-2 text-small font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
              viewMode === "week" ? "bg-sage text-white" : "bg-white text-charcoal hover:bg-cream"
            )}
            aria-label="Switch to week view"
            aria-pressed={viewMode === "week"}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-sage/30 bg-white px-3 py-2 text-small font-medium text-charcoal transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => (viewMode === "month" ? navigateMonth("prev") : navigateWeek("prev"))}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-sage/30 bg-white p-2 text-charcoal transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0"
            aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
          >
            <ChevronLeft size={iconSize.sm} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => (viewMode === "month" ? navigateMonth("next") : navigateWeek("next"))}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-sage/30 bg-white p-2 text-charcoal transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0"
            aria-label={viewMode === "month" ? "Next month" : "Next week"}
          >
            <ChevronRight size={iconSize.sm} aria-hidden="true" />
          </button>
          <span className="min-w-[140px] text-center text-small font-semibold text-charcoal">
            {format(currentDate, "MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-sage/30 bg-white p-4">
        {viewMode === "month" ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="p-2 text-center text-small font-semibold uppercase text-charcoal/80">
                {day}
              </div>
            ))}
            {/* Calendar days */}
            {monthDays.map((day, idx) => {
              const dayOccurrences = getOccurrencesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "min-h-[80px] w-full rounded-lg border p-2 text-left transition hover:bg-cream/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                    !isCurrentMonth && "opacity-40",
                    isDayToday && "ring-2 ring-sage/50 bg-sage/5"
                  )}
                  aria-label={`Select date ${format(day, "EEEE, MMMM d, yyyy")}`}
                >
                  <div className={cn("mb-1 text-small font-medium", isDayToday && "text-forest font-bold")}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayOccurrences.slice(0, 2).map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOccurrenceClick(occ, e);
                        }}
                        className={cn(
                          "w-full rounded px-1.5 py-0.5 text-small font-medium border text-left transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-1",
                          getStatusColor(occ)
                        )}
                        aria-label={`View occurrence at ${format(new Date(occ.starts_at), "HH:mm")}`}
                      >
                        {format(new Date(occ.starts_at), "HH:mm")}
                      </button>
                    ))}
                    {dayOccurrences.length > 2 && (
                      <div className="text-small text-charcoal/60">+{dayOccurrences.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 border-b border-sage/20 pb-2">
              {weekDays.map((day) => {
                const dayOccurrences = getOccurrencesForDate(day);
                const isDayToday = isToday(day);
                return (
                  <div key={day.toISOString()} className="text-center">
                    <div className={cn("text-small font-semibold uppercase text-charcoal/80", isDayToday && "text-forest")}>
                      {format(day, "EEE")}
                    </div>
                    <div className={cn("text-body font-bold text-charcoal", isDayToday && "text-sage")}>
                      {format(day, "d")}
                    </div>
                    <div className="mt-1 text-small text-charcoal/60">{dayOccurrences.length} sessions</div>
                  </div>
                );
              })}
            </div>
            {/* Week occurrences */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayOccurrences = getOccurrencesForDate(day);
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    {dayOccurrences.map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={(e) => handleOccurrenceClick(occ, e)}
                        className={cn(
                          "w-full rounded-lg border p-2 text-left text-small transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                          getStatusColor(occ)
                        )}
                        aria-label={`View occurrence from ${format(new Date(occ.starts_at), "HH:mm")}${occ.ends_at ? ` to ${format(new Date(occ.ends_at), "HH:mm")}` : ""}${occ.available_spots !== null && occ.capacity ? `, ${occ.available_spots} of ${occ.capacity} spots available` : ""}`}
                      >
                        <div className="font-medium">{format(new Date(occ.starts_at), "HH:mm")}</div>
                        {occ.ends_at && (
                          <div className="text-small opacity-80">
                            {format(new Date(occ.ends_at), "HH:mm")}
                          </div>
                        )}
                        {occ.available_spots !== null && occ.capacity && (
                          <div className="mt-1 text-small">
                            {occ.available_spots}/{occ.capacity} spots
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedOccurrence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-details-title"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            onClick={() => setSelectedOccurrence(null)}
            aria-label="Close dialog"
          />
          <div
            className="relative w-full max-w-md rounded-dialog border border-sage/30 bg-white p-dialog shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 id="event-details-title" className="text-title font-bold text-charcoal">Session Details</h3>
              <button
                type="button"
                onClick={() => setSelectedOccurrence(null)}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg p-1 text-charcoal/60 transition hover:bg-cream hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0"
                aria-label="Close dialog"
              >
                <ChevronRight size={iconSize.md} className="rotate-90" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-small font-medium text-charcoal/80">Date & Time</div>
                <div className="text-body font-semibold text-charcoal">
                  {formatDateRange(selectedOccurrence.starts_at, selectedOccurrence.ends_at)}
                </div>
              </div>

              {selectedOccurrence.capacity && selectedOccurrence.available_spots !== null && (
                <div>
                  <div className="text-small font-medium text-charcoal/80">Availability</div>
                  <div className="text-body font-semibold text-charcoal">
                    {selectedOccurrence.available_spots} of {selectedOccurrence.capacity} spots available
                  </div>
                </div>
              )}

              {(selectedOccurrence.price || selectedOccurrence.discount_price) && (
                <div>
                  <div className="text-small font-medium text-charcoal/80">Price</div>
                  <div className="flex items-center gap-2">
                    {selectedOccurrence.discount_price && (
                      <>
                        <span className="text-body font-bold text-amber-600">{selectedOccurrence.discount_price}</span>
                        {selectedOccurrence.price && (
                          <span className="text-small text-charcoal/60 line-through">{selectedOccurrence.price}</span>
                        )}
                      </>
                    )}
                    {!selectedOccurrence.discount_price && selectedOccurrence.price && (
                      <span className="text-title font-bold text-charcoal">{selectedOccurrence.price}</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="text-small font-medium text-charcoal/80">Status</div>
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-small font-medium uppercase",
                    getStatusColor(selectedOccurrence)
                  )}
                >
                  {selectedOccurrence.status}
                </span>
              </div>

              <div className="pt-4">
                {selectedOccurrence.bookable && isBookingsFeatureEnabled() ? (
                  <BookNowButton
                    classId={classId}
                    occurrenceId={typeof selectedOccurrence.id === "number" ? selectedOccurrence.id : Number(selectedOccurrence.id)}
                    className="w-full"
                  />
                ) : selectedOccurrence.bookable && selectedOccurrence.stripe_payment_link_url ? (
                  <BookingButton
                    paymentLinkUrl={selectedOccurrence.stripe_payment_link_url}
                    occurrenceId={typeof selectedOccurrence.id === "number" ? selectedOccurrence.id : Number(selectedOccurrence.id)}
                    className="w-full"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

