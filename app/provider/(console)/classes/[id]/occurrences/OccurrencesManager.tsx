"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { updateOccurrenceAction } from "./actions";
import { EmptyState } from "@/components/ui/emptystate";

type SessionInstance = {
  id: number;
  starts_at: string;
  ends_at: string | null;
  status: string;
  bookable: boolean;
  stripe_payment_link_url: string | null;
  capacity: number | null;
  available_spots: number | null;
};

type ClassSession = {
  id: number;
  title: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  session_instances: SessionInstance[];
};

type OccurrencesManagerProps = {
  classId: number;
  sessions: ClassSession[];
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function OccurrenceRow({ instance, sessionTitle }: { instance: SessionInstance; sessionTitle: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bookable, setBookable] = useState(instance.bookable);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(instance.stripe_payment_link_url || "");
  
  const [state, formAction] = useFormState<{ status: "idle" | "success" | "error"; message?: string }, FormData>(
    updateOccurrenceAction, 
    { status: "idle" }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await (formAction as any)(formData);
    setIsEditing(false);
  };

  return (
    <tr className="border-b border-sage/20">
      <td className="px-4 py-3 text-sm text-charcoal">
        <div>
          <div className="font-medium">{sessionTitle || "Session"}</div>
          <div className="text-sm text-charcoal/60">{formatDateTime(instance.starts_at)}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-charcoal">
        {instance.status === "scheduled" ? (
          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-sm text-green-700">Scheduled</span>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">{instance.status}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-charcoal">
        {instance.capacity !== null && instance.available_spots !== null
          ? `${instance.available_spots} / ${instance.capacity}`
          : "—"}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input type="hidden" name="occurrence_id" value={instance.id} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  name="bookable"
                  value="true"
                  checked={bookable}
                  onChange={(e) => setBookable(e.target.checked)}
                  className="rounded border-sage/30"
                />
                Bookable
              </label>
            </div>
            {bookable && (
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Stripe Payment Link URL</label>
                <input
                  type="url"
                  name="stripe_payment_link_url"
                  value={paymentLinkUrl}
                  onChange={(e) => setPaymentLinkUrl(e.target.value)}
                  placeholder="https://buy.stripe.com/..."
                  className="w-full rounded-md border border-sage/30 px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50"
                  required={bookable}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-sage px-3 py-1.5 text-sm font-semibold text-white hover:bg-sage/90"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setBookable(instance.bookable);
                  setPaymentLinkUrl(instance.stripe_payment_link_url || "");
                }}
                className="rounded-md border border-sage/30 px-3 py-1.5 text-sm font-semibold text-charcoal hover:bg-sage/10"
              >
                Cancel
              </button>
            </div>
            {state.status === "error" && (
              <p className="text-sm text-terracotta">{state.message || "Failed to update"}</p>
            )}
            {state.status === "success" && (
              <p className="text-sm text-green-600">{state.message || "Saved!"}</p>
            )}
          </form>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {instance.bookable ? (
                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-sm font-semibold text-green-700">
                  Bookable
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700">Not bookable</span>
              )}
            </div>
            {instance.stripe_payment_link_url && (
              <a
                href={instance.stripe_payment_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-sage hover:underline truncate max-w-xs"
              >
                {instance.stripe_payment_link_url}
              </a>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-sage hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function OccurrencesManager({ classId: _classId, sessions }: OccurrencesManagerProps) {
  const allInstances = sessions.flatMap((session) =>
    session.session_instances.map((instance) => ({
      instance,
      sessionTitle: session.title,
    }))
  );

  if (allInstances.length === 0) {
    return (
      <EmptyState
        title="No occurrences found"
        description="No occurrences found for this class. Create sessions and instances to schedule class dates and times."
        iconVariant="inbox"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-sage/20 bg-white overflow-hidden">
      <table className="w-full">
        <thead className="bg-cream/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
              Date & Time
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
              Availability
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-charcoal/70">
              Booking
            </th>
          </tr>
        </thead>
        <tbody>
          {allInstances.map(({ instance, sessionTitle }) => (
            <OccurrenceRow key={instance.id} instance={instance} sessionTitle={sessionTitle} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

