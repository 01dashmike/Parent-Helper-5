"use client";

import { useMemo, useState, useRef, memo, useCallback } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
    createClassAction,
    createOccurrenceAction,
    deleteClassAction,
    deleteOccurrenceAction,
    updateClassAction,
} from "./actions";
import { getInitialActionState, ActionState } from "./state";
import { AIContentSuggestion } from "./AIContentSuggestion";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { EmptyState } from "@/components/ui/emptystate";

type VenueOption = {
    id: string;
    name: string;
    city: string | null;
    postcode: string | null;
};

type ClassOccurrence = {
    id: string;
    starts_at: string;
    ends_at: string | null;
    status: string;
    venue_id: string | null;
};

type ProviderClass = {
    id: string;
    title: string;
    summary: string | null;
    price: string | null;
    booking_url: string | null;
    is_published: boolean;
    tags: string[] | null;
    venue_id: string | null;
    created_at: string;
    class_occurrences: ClassOccurrence[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
});

const SubmitButton = memo(function SubmitButton({
    idleLabel,
    pendingLabel,
    tone = "primary",
}: {
    idleLabel: string;
    pendingLabel: string;
    tone?: "primary" | "danger" | "ghost";
}) {
    const { pending } = useFormStatus();
    const base =
        tone === "primary"
            ? "bg-sage text-white hover:bg-sage/90"
            : tone === "danger"
                ? "bg-terracotta text-white hover:bg-terracotta/90"
                : "border border-sage/50 text-charcoal hover:bg-sage/10";

    return (
        <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-semibold transition disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${base}`}
        >
            {pending ? pendingLabel : idleLabel}
        </button>
    );
});

const ActionMessage = memo(function ActionMessage({ state }: { state: ActionState }) {
    if (state.status === "idle") return null;
    const tone =
        state.status === "success"
            ? "border-sage/30 bg-sage/10 text-sage/80"
            : "border-terracotta/30 bg-terracotta/10 text-terracotta/80";
    return (
        <p 
            className={`rounded-md border px-3 py-2 text-small ${tone}`}
            role="status"
            aria-live="polite"
        >
            {state.message ??
                (state.status === "success"
                    ? "Saved!"
                    : "We couldn't complete that action. Please try again.")}
        </p>
    );
});

const ClassCard = memo(function ClassCard({
    item,
    venues,
}: {
    item: ProviderClass;
    venues: VenueOption[];
}) {
    const [updateState, updateAction] = useFormState(updateClassAction, getInitialActionState());
    const [occurrenceState, occurrenceAction] = useFormState(
        createOccurrenceAction,
        getInitialActionState()
    );
    const titleInputRef = useRef<HTMLInputElement>(null);
    const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    const venueLabel = useMemo(() => {
        const venue = venues.find((venue) => venue.id === item.venue_id);
        if (!venue) return "No venue";
        return venue.city
            ? `${venue.name} · ${venue.city}`
            : `${venue.name}${venue.postcode ? ` · ${venue.postcode}` : ""}`;
    }, [item.venue_id, venues]);

    const handleApplySuggestion = useCallback((title: string, summary: string) => {
        if (titleInputRef.current) {
            titleInputRef.current.value = title;
        }
        if (summaryTextareaRef.current) {
            summaryTextareaRef.current.value = summary;
        }
    }, []);

    return (
        <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="text-title font-semibold text-charcoal truncate" lang="en">{item.title}</h3>
                    <p className="text-small text-charcoal/60 opacity-80">
                        Created {dateFormatter.format(new Date(item.created_at))}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-small font-medium uppercase tracking-wide ${item.is_published
                            ? "border-sage/40 bg-sage/10 text-sage/80"
                            : "border-charcoal/20 bg-charcoal/5 text-charcoal/60"
                            }`}
                    >
                        {item.is_published ? "Published" : "Draft"}
                    </span>
                    <form action={deleteClassAction}>
                        <input type="hidden" name="class_id" value={item.id} />
                        <SubmitButton tone="danger" idleLabel="Delete" pendingLabel="Deleting…" />
                    </form>
                </div>
            </header>

            <section className="mt-5 space-y-4">
                <AIContentSuggestion
                    currentTitle={item.title}
                    currentSummary={item.summary}
                    onApply={handleApplySuggestion}
                />
                    <form action={updateAction} className="space-y-4 rounded-2xl border border-sage/30 bg-cream/40 p-4">
                    <input type="hidden" name="class_id" value={item.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-small text-charcoal/80">
                            <span className="font-medium text-charcoal">Title</span>
                            <input
                                ref={titleInputRef}
                                name="title"
                                defaultValue={item.title}
                                required
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <label className="space-y-1 text-small text-charcoal/80">
                            <span className="font-medium text-charcoal">Venue</span>
                            <select
                                name="venue_id"
                                defaultValue={item.venue_id ?? ""}
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            >
                                <option value="">Assign later</option>
                                {venues.map((venue) => (
                                    <option key={venue.id} value={venue.id}>
                                        {venue.name}
                                        {venue.city ? ` · ${venue.city}` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Summary</span>
                            <textarea
                                ref={summaryTextareaRef}
                                name="summary"
                                defaultValue={item.summary ?? ""}
                                rows={3}
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                    </label>
                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-1 text-small">
                            <span className="font-medium text-charcoal">Price</span>
                            <input
                                name="price"
                                defaultValue={item.price ?? ""}
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <label className="space-y-1 text-small md:col-span-2">
                            <span className="font-medium text-charcoal">Booking URL</span>
                            <input
                                name="booking_url"
                                defaultValue={item.booking_url ?? ""}
                                placeholder="https://"
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                    </div>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Tags (comma separated)</span>
                        <input
                            name="tags"
                            defaultValue={item.tags?.join(", ") ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-small text-charcoal">
                        <input
                            name="is_published"
                            type="checkbox"
                            defaultChecked={item.is_published}
                            className="h-4 w-4 rounded border-sage/50 text-sage focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                        <span>Show this class publicly (published)</span>
                    </label>
                    <div className="flex items-center justify-between">
                        <p className="text-small text-charcoal/60">{venueLabel}</p>
                        <SubmitButton idleLabel="Save changes" pendingLabel="Saving…" />
                    </div>
                    <ActionMessage state={updateState} />
                </form>

                <section className="space-y-3 rounded-2xl border border-sage/30 bg-white p-4">
                    <header className="flex items-center justify-between">
                        <h4 className="text-body font-semibold text-charcoal">Upcoming sessions</h4>
                        <div className="flex items-center gap-2">
                          {(process.env.NEXT_PUBLIC_BULK_SCHEDULING_ENABLED === "true" ||
                            process.env.BULK_SCHEDULING_ENABLED === "true") && (
                            <Link
                              href={`/provider/classes/${item.id}/schedule`}
                              className="text-small text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            >
                              Bulk Schedule
                            </Link>
                          )}
                          <p className="text-small text-charcoal/60 opacity-80">Linked to this class</p>
                        </div>
                    </header>
                    <div className="space-y-3">
                        {item.class_occurrences.length === 0 ? (
                            <EmptyState
                                title="No sessions yet"
                                description="Add your first occurrence below to schedule class dates and times."
                                iconVariant="calendar"
                                size="sm"
                            />
                        ) : (
                            item.class_occurrences.map((occurrence) => (
                                <div
                                    key={occurrence.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-sage/20 bg-cream/40 p-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="text-body font-medium text-charcoal">
                                            {dateFormatter.format(new Date(occurrence.starts_at))}
                                        </p>
                                        {occurrence.ends_at ? (
                                            <p className="text-small text-charcoal/60 opacity-80">
                                                Ends {dateFormatter.format(new Date(occurrence.ends_at))}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span className="inline-flex items-center justify-center rounded-full border border-sage/40 bg-white px-3 py-1 text-small font-medium uppercase tracking-wide text-forest">
                                        {occurrence.status}
                                    </span>
                                    <form action={deleteOccurrenceAction}>
                                        <input type="hidden" name="occurrence_id" value={occurrence.id} />
                                        <SubmitButton tone="ghost" idleLabel="Remove" pendingLabel="Removing…" />
                                    </form>
                                </div>
                            ))
                        )}
                    </div>
                    <form action={occurrenceAction} className="space-y-3 rounded-2xl border border-sage/30 bg-cream/60 p-3">
                        <input type="hidden" name="class_id" value={item.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Start time</span>
                                <input
                                    type="datetime-local"
                                    name="starts_at"
                                    required
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">End time</span>
                                <input
                                    type="datetime-local"
                                    name="ends_at"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            <label className="space-y-1 text-small md:col-span-2">
                                <span className="font-medium text-charcoal">Venue</span>
                                <select
                                    name="venue_id"
                                    defaultValue={item.venue_id ?? ""}
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                >
                                    <option value="">Use class venue</option>
                                    {venues.map((venue) => (
                                        <option key={venue.id} value={venue.id}>
                                            {venue.name}
                                            {venue.city ? ` · ${venue.city}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Status</span>
                                <select
                                    name="status"
                                    defaultValue="scheduled"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="published">Published</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Price override</span>
                                <input
                                    name="price"
                                    placeholder="Optional"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Booking URL</span>
                                <input
                                    name="booking_url"
                                    placeholder="https://"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <SubmitButton idleLabel="Add occurrence" pendingLabel="Saving…" />
                        </div>
                        <ActionMessage state={occurrenceState} />
                    </form>
                </section>
            </section>
        </article>
    );
});

export function ClassManager({
    classes,
    venues,
}: {
    classes: ProviderClass[];
    venues: VenueOption[];
}) {
    const [createState, createAction] = useFormState(createClassAction, getInitialActionState());
    const [collapseCreate, setCollapseCreate] = useState(false);

    return (
        <ErrorBoundaryWrapper>
            <div className="space-y-8">
                <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                <header className="flex items-center justify-between">
                    <div>
                        <h2 className="text-title font-semibold text-charcoal">Create a new class</h2>
                        <p className="text-small text-charcoal/70">
                            Draft a class and publish when you&apos;re ready.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCollapseCreate((prev) => !prev)}
                        className="text-small font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    >
                        {collapseCreate ? "Show form" : "Hide form"}
                    </button>
                </header>
                {!collapseCreate ? (
                    <form action={createAction} className="mt-5 space-y-4 rounded-2xl border border-sage/30 bg-cream/40 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Title</span>
                                <input
                                    name="title"
                                    required
                                    placeholder="Baby sensory sessions"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Venue</span>
                                <select
                                    name="venue_id"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                >
                                    <option value="">Assign later</option>
                                    {venues.map((venue) => (
                                        <option key={venue.id} value={venue.id}>
                                            {venue.name}
                                            {venue.city ? ` · ${venue.city}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="space-y-1 text-small">
                            <span className="font-medium text-charcoal">Summary</span>
                            <textarea
                                name="summary"
                                rows={3}
                                placeholder="One or two lines describing the class focus."
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="space-y-1 text-sm">
                                <span className="font-medium text-charcoal">Price</span>
                                <input
                                    name="price"
                                    placeholder="£10 per child"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-sm md:col-span-2">
                                <span className="font-medium text-charcoal">Booking URL</span>
                                <input
                                    name="booking_url"
                                    placeholder="https://"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                        </div>
                        <label className="space-y-1 text-small">
                            <span className="font-medium text-charcoal">Tags (comma separated)</span>
                            <input
                                name="tags"
                                placeholder="music, newborn, baby sensory"
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <label className="flex items-center gap-2 text-small text-charcoal">
                            <input
                                name="is_published"
                                type="checkbox"
                                className="h-4 w-4 rounded border-sage/50 text-sage focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                            <span>Publish immediately</span>
                        </label>
                        <div className="flex items-center justify-end">
                            <SubmitButton idleLabel="Create class" pendingLabel="Creating…" />
                        </div>
                        <ActionMessage state={createState} />
                    </form>
                ) : null}
            </section>

            <section className="space-y-4">
                <header className="flex items-center justify-between">
                    <div>
                        <h2 className="text-title font-semibold text-charcoal">Your classes</h2>
                        <p className="text-small text-charcoal/70">
                            Manage titles, venues, visibility, and session schedules.
                        </p>
                    </div>
                    <p className="text-small text-charcoal/50 opacity-80">
                        {classes.length} {classes.length === 1 ? "class" : "classes"}
                    </p>
                </header>
                {classes.length === 0 ? (
                    <EmptyState
                        title="No classes yet"
                        description="Use the form above to create your first class and start adding sessions."
                        iconVariant="package"
                        actionLabel="Add your first class"
                        actionOnClick={() => {
                            // Scroll to form or focus on form
                            const formElement = document.querySelector('form');
                            if (formElement) {
                                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                const firstInput = formElement.querySelector('input, textarea, select') as HTMLElement;
                                if (firstInput) {
                                    setTimeout(() => firstInput.focus(), 300);
                                }
                            }
                        }}
                        size="default"
                    />
                ) : (
                    <div className="space-y-6">
                        {classes.map((item) => (
                            <ClassCard key={item.id} item={item} venues={venues} />
                        ))}
                    </div>
                )}
            </section>
            </div>
        </ErrorBoundaryWrapper>
    );
}

