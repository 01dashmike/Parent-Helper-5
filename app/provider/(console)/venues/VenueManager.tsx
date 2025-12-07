"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createVenueAction, deleteVenueAction, updateVenueAction } from "./actions";
import { getInitialVenueState, VenueActionState } from "./state";
import { EmptyState } from "@/components/ui/emptystate";

type VenueRecord = {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    created_at: string;
    updated_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
});

function SubmitButton({
    idleLabel,
    pendingLabel,
    tone = "primary",
}: {
    idleLabel: string;
    pendingLabel: string;
    tone?: "primary" | "danger";
}) {
    const { pending } = useFormStatus();
    const base =
        tone === "primary"
            ? "bg-sage text-white hover:bg-sage/90"
            : "bg-terracotta text-white hover:bg-terracotta/90";
    return (
        <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-semibold transition disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${base}`}
        >
            {pending ? pendingLabel : idleLabel}
        </button>
    );
}

function ActionBanner({ state }: { state: VenueActionState }) {
    if (state.status === "idle") return null;
    const tone =
        state.status === "success"
            ? "border-sage/40 bg-sage/10 text-sage/80"
            : "border-terracotta/40 bg-terracotta/10 text-terracotta/80";
    return (
        <p className={`rounded-md border px-3 py-2 text-small ${tone}`} role={state.status === "success" ? "status" : "alert"} aria-live="polite">
            {state.message ??
                (state.status === "success"
                    ? "Changes saved."
                    : "We couldn’t complete that action. Please try again.")}
        </p>
    );
}

function VenueCard({ venue }: { venue: VenueRecord }) {
    const [state, action] = useFormState(updateVenueAction, getInitialVenueState());

    return (
        <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="text-title font-semibold text-charcoal truncate" lang="en">{venue.name}</h3>
                    <p className="text-small text-charcoal/60">
                        Updated {dateFormatter.format(new Date(venue.updated_at))}
                    </p>
                </div>
                <form action={deleteVenueAction}>
                    <input type="hidden" name="venue_id" value={venue.id} />
                    <SubmitButton tone="danger" idleLabel="Remove venue" pendingLabel="Removing…" />
                </form>
            </header>
            <form action={action} className="mt-5 space-y-4 rounded-lg border border-sage/30 bg-cream/40 p-4">
                <input type="hidden" name="venue_id" value={venue.id} />
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Name</span>
                        <input
                            name="name"
                            required
                            defaultValue={venue.name}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Slug</span>
                        <input
                            name="slug"
                            defaultValue={venue.slug ?? ""}
                            placeholder="auto-generated if blank"
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                </div>
                <label className="space-y-1 text-sm">
                    <span className="font-medium text-charcoal">Description</span>
                    <textarea
                        name="description"
                        rows={2}
                        defaultValue={venue.description ?? ""}
                        className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Address line 1</span>
                        <input
                            name="address_line1"
                            defaultValue={venue.address_line1 ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            autoComplete="street-address"
                        />
                    </label>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Address line 2</span>
                        <input
                            name="address_line2"
                            defaultValue={venue.address_line2 ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">City</span>
                        <input
                            name="city"
                            defaultValue={venue.city ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">County</span>
                        <input
                            name="county"
                            defaultValue={venue.county ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                        />
                    </label>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Postcode</span>
                        <input
                            name="postcode"
                            defaultValue={venue.postcode ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            autoComplete="postal-code"
                        />
                    </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Phone</span>
                        <input
                            name="phone"
                            defaultValue={venue.phone ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            autoComplete="tel"
                        />
                    </label>
                    <label className="space-y-1 text-small">
                        <span className="font-medium text-charcoal">Email</span>
                        <input
                            name="email"
                            type="email"
                            defaultValue={venue.email ?? ""}
                            className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            autoComplete="email"
                        />
                    </label>
                </div>
                <label className="space-y-1 text-sm">
                    <span className="font-medium text-charcoal">Website</span>
                    <input
                        name="website"
                        defaultValue={venue.website ?? ""}
                        placeholder="https://"
                        className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    />
                </label>
                <div className="flex items-center justify-end">
                    <SubmitButton idleLabel="Save venue" pendingLabel="Saving…" />
                </div>
                <ActionBanner state={state} />
            </form>
        </article>
    );
}

export function VenueManager({ venues }: { venues: VenueRecord[] }) {
    const [creating, setCreating] = useState(false);
    const [createState, createAction] = useFormState(createVenueAction, getInitialVenueState());

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-soft">
                <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-title font-semibold text-charcoal">Add a new venue</h2>
                        <p className="text-small text-charcoal/70">
                            Venues connect to classes and public profiles.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreating((prev) => !prev)}
                        className="text-small font-medium text-sage underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    >
                        {creating ? "Hide form" : "Add venue"}
                    </button>
                </header>
                {creating ? (
                    <form action={createAction} className="mt-5 space-y-4 rounded-lg border border-sage/30 bg-cream/40 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Name</span>
                                <input
                                    name="name"
                                    required
                                    placeholder="Parent Helper Hub"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    autoComplete="organization"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Slug</span>
                                <input
                                    name="slug"
                                    placeholder="auto-generated if blank"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                        </div>
                        <label className="space-y-1 text-small">
                            <span className="font-medium text-charcoal">Description</span>
                            <textarea
                                name="description"
                                rows={2}
                                placeholder="Warm welcome space with on-site cafe."
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Address line 1</span>
                                <input
                                    name="address_line1"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    autoComplete="street-address"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Address line 2</span>
                                <input
                                    name="address_line2"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">City</span>
                                <input
                                    name="city"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">County</span>
                                <input
                                    name="county"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Postcode</span>
                                <input
                                    name="postcode"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    autoComplete="postal-code"
                                />
                            </label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Phone</span>
                                <input
                                    name="phone"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    autoComplete="tel"
                                />
                            </label>
                            <label className="space-y-1 text-small">
                                <span className="font-medium text-charcoal">Email</span>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    autoComplete="email"
                                />
                            </label>
                        </div>
                        <label className="space-y-1 text-small">
                            <span className="font-medium text-charcoal">Website</span>
                            <input
                                name="website"
                                placeholder="https://"
                                className="w-full rounded-md border border-sage/40 bg-white px-3 py-2 text-small focus-visible:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                            />
                        </label>
                        <div className="flex items-center justify-end">
                            <SubmitButton idleLabel="Create venue" pendingLabel="Creating…" />
                        </div>
                        <ActionBanner state={createState} />
                    </form>
                ) : null}
            </section>

            <section className="space-y-4">
                <header className="flex items-center justify-between">
                    <div>
                        <h2 className="text-title font-semibold text-charcoal">Active venues</h2>
                        <p className="text-small text-charcoal/70">
                            Keep contact details current to power booking flows and SEO.
                        </p>
                    </div>
                    <p className="text-small text-charcoal/60">
                        {venues.length} {venues.length === 1 ? "venue" : "venues"}
                    </p>
                </header>
                {venues.length === 0 ? (
                    <EmptyState
                        title="No venues yet"
                        description="Add your first location above to unlock detailed class listings and better search visibility."
                        iconVariant="inbox"
                    />
                ) : (
                    <div className="space-y-6">
                        {venues.map((venue) => (
                            <VenueCard key={venue.id} venue={venue} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

