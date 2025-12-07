"use client";

import { useState, useEffect } from "react";
import { type DayOfWeek } from "@/lib/utils/recurrence";
import { Close } from "@/components/icons";

type BulkSchedulingDrawerProps = {
  open: boolean;
  className: string;
  onClose: () => void;
  onPreview: (config: RecurrenceFormData) => void;
  onSubmit: (config: RecurrenceFormData & { capacity: number | null; priceCents: number | null }) => void;
  isSubmitting: boolean;
};

type RecurrenceFormData = {
  daysOfWeek: DayOfWeek[];
  startDate: Date;
  endDate: Date;
  startTime: string;
  durationMinutes: number;
  excludeDates: Date[];
};

const DAYS_OF_WEEK: Array<{ value: DayOfWeek; label: string; short: string }> = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export default function BulkSchedulingDrawer({
  open,
  className,
  onClose,
  onPreview,
  onSubmit,
  isSubmitting,
}: BulkSchedulingDrawerProps) {
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([1, 3]); // Default: Mon, Wed
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("10:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [excludeDates, setExcludeDates] = useState<string[]>([]);
  const [newExcludeDate, setNewExcludeDate] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [priceCents, setPriceCents] = useState<string>("");

  // Set default dates (start: today, end: 6 weeks from today)
  useEffect(() => {
    if (open && !startDate) {
      const today = new Date();
      const sixWeeksLater = new Date();
      sixWeeksLater.setDate(today.getDate() + 42);

      setStartDate(today.toISOString().split("T")[0]);
      setEndDate(sixWeeksLater.toISOString().split("T")[0]);
    }
  }, [open, startDate]);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addExcludeDate = () => {
    if (newExcludeDate && !excludeDates.includes(newExcludeDate)) {
      setExcludeDates((prev) => [...prev, newExcludeDate].sort());
      setNewExcludeDate("");
    }
  };

  const removeExcludeDate = (date: string) => {
    setExcludeDates((prev) => prev.filter((d) => d !== date));
  };

  const handlePreview = () => {
    if (!startDate || !endDate || daysOfWeek.length === 0) {
      // Validation handled by UI, but keep for safety
      return;
    }

    onPreview({
      daysOfWeek,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      durationMinutes,
      excludeDates: excludeDates.map((d) => new Date(d)),
    });
  };

  const handleSubmit = () => {
    if (!startDate || !endDate || daysOfWeek.length === 0) {
      // Validation handled by UI, but keep for safety
      return;
    }

    onSubmit({
      daysOfWeek,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      durationMinutes,
      excludeDates: excludeDates.map((d) => new Date(d)),
      capacity: capacity ? parseInt(capacity, 10) : null,
      priceCents: priceCents ? Math.round(parseFloat(priceCents) * 100) : null,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-charcoal">Add Repeating Schedule</h2>
            <p className="mt-1 text-sm text-charcoal/70">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slateSoft transition hover:bg-cream"
            aria-label="Close bulk scheduling drawer"
          >
            <Close size={24} className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Days of Week <span className="text-terracotta">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    daysOfWeek.includes(day.value)
                      ? "bg-sage text-white"
                      : "bg-cream text-charcoal hover:bg-sage/20"
                  }`}
                >
                  {day.short}
                </button>
              ))}
            </div>
            {daysOfWeek.length === 0 && (
              <p className="mt-1 text-sm text-terracotta">Select at least one day</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Start Date <span className="text-terracotta">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                End Date <span className="text-terracotta">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                required
              />
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Start Time <span className="text-terracotta">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Duration (minutes) <span className="text-terracotta">*</span>
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                min={15}
                step={15}
                className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                required
              />
            </div>
          </div>

          {/* Exclude Dates */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Exclude Dates (e.g., school holidays)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newExcludeDate}
                onChange={(e) => setNewExcludeDate(e.target.value)}
                className="flex-1 rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
              />
              <button
                type="button"
                onClick={addExcludeDate}
                className="rounded-md border border-sage/50 px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-sage/10"
              >
                Add
              </button>
            </div>
            {excludeDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {excludeDates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm text-charcoal"
                  >
                    {new Date(date).toLocaleDateString("en-GB")}
                    <button
                      type="button"
                      onClick={() => removeExcludeDate(date)}
                      className="text-terracotta hover:text-terracotta/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Capacity (optional)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min={1}
                placeholder="e.g., 12"
                className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Price per session (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-charcoal/70">£</span>
                <input
                  type="number"
                  value={priceCents}
                  onChange={(e) => setPriceCents(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-md border border-sage/30 pl-8 pr-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-sage/20 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sage/50 px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-sage/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-md border border-sage/50 px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-sage/10"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || daysOfWeek.length === 0 || !startDate || !endDate}
              className="rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Occurrences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

