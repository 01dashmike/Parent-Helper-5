"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BulkSchedulingDrawer from "./BulkSchedulingDrawer";
import { expandRecurrence, type ExpandedOccurrence, type DayOfWeek } from "@/lib/utils/recurrence";
import { createOccurrencesBatch } from "./actions";
import { useToast } from "@/hooks/use-toast";

type ExistingOccurrence = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number | null;
  price_cents: number | null;
};

type BulkSchedulingClientProps = {
  classId: number;
  className: string;
  existingOccurrences: ExistingOccurrence[];
};

export default function BulkSchedulingClient({
  classId,
  className,
  existingOccurrences,
}: BulkSchedulingClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOccurrences, setPreviewOccurrences] = useState<ExpandedOccurrence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreview = (config: {
    daysOfWeek: DayOfWeek[];
    startDate: Date;
    endDate: Date;
    startTime: string;
    durationMinutes: number;
    excludeDates: Date[];
  }) => {
    const expanded = expandRecurrence({
      ...config,
      timezone: "Europe/London",
    });
    setPreviewOccurrences(expanded);
  };

  const handleSubmit = async (config: {
    daysOfWeek: DayOfWeek[];
    startDate: Date;
    endDate: Date;
    startTime: string;
    durationMinutes: number;
    excludeDates: Date[];
    capacity: number | null;
    priceCents: number | null;
  }) => {
    setIsSubmitting(true);
    try {
      const expanded = expandRecurrence({
        ...config,
        timezone: "Europe/London",
      });

      const result = await createOccurrencesBatch({
        classId,
        occurrences: expanded.map((occ) => ({
          startAt: occ.startAt.toISOString(),
          endAt: occ.endAt.toISOString(),
        })),
        capacity: config.capacity,
        priceCents: config.priceCents,
      });

      if (result.status === "success") {
        router.refresh();
        setDrawerOpen(false);
        setPreviewOccurrences([]);
        toast({
          title: "Success",
          description: "Occurrences created successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create occurrences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating occurrences:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating occurrences",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingOccurrences = useMemo(() => {
    const now = new Date();
    return existingOccurrences
      .filter((occ) => new Date(occ.start_at) >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 10);
  }, [existingOccurrences]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Upcoming Occurrences</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            {existingOccurrences.length} total occurrence{existingOccurrences.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage/90"
        >
          + Add Repeating Schedule
        </button>
      </div>

      {previewOccurrences.length > 0 && (
        <div className="rounded-xl border border-sage/30 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-charcoal">Preview</h3>
          <p className="mb-4 text-sm text-charcoal/70">
            {previewOccurrences.length} occurrence{previewOccurrences.length !== 1 ? "s" : ""} will be created
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-sage/20 text-sm">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-charcoal/70">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-charcoal/70">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-charcoal/70">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10">
                {previewOccurrences.slice(0, 20).map((occ, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-charcoal">
                      {new Date(occ.startAt).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2 text-charcoal">
                      {new Date(occ.startAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2 text-charcoal/70">
                      {Math.round((occ.endAt.getTime() - occ.startAt.getTime()) / 60000)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewOccurrences.length > 20 && (
              <p className="mt-2 text-sm text-charcoal/60">
                ... and {previewOccurrences.length - 20} more
              </p>
            )}
          </div>
        </div>
      )}

      {upcomingOccurrences.length > 0 ? (
        <div className="rounded-xl border border-sage/30 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Capacity
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/20">
              {upcomingOccurrences.map((occ) => (
                <tr key={occ.id} className="hover:bg-cream/30">
                  <td className="px-4 py-3 text-sm text-charcoal">
                    {new Date(occ.start_at).toLocaleString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal/70">
                    {Math.round(
                      (new Date(occ.end_at).getTime() - new Date(occ.start_at).getTime()) / 60000
                    )}{" "}
                    min
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal/70">
                    {occ.capacity ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal/70">
                    {occ.price_cents ? `£${(occ.price_cents / 100).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-sage/30 bg-white p-8 text-center text-charcoal/70">
          <p>No upcoming occurrences scheduled.</p>
          <p className="mt-2 text-sm">Use &quot;Add Repeating Schedule&quot; to create occurrences.nces.</p>
        </div>
      )}

      <BulkSchedulingDrawer
        open={drawerOpen}
        className={className}
        onClose={() => {
          setDrawerOpen(false);
          setPreviewOccurrences([]);
        }}
        onPreview={handlePreview}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

