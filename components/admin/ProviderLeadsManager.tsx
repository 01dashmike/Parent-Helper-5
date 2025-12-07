"use client";

import { useState, useTransition, useMemo, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { formatDate } from "@/lib/utils/date";
import { approveLead, updateLeadStatus } from "@/app/admin/providers/leads/actions";
import DetailDrawer from "@/components/admin/DetailDrawer";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type LeadStatus = "new" | "approved" | "rejected";

type ProviderLead = {
    id: string;
    created_at: string;
    contact_name: string | null;
    email: string;
    phone: string | null;
    website: string | null;
    town: string | null;
    categories: string[] | null;
    description: string | null;
    status: LeadStatus;
    wants_newsletter: boolean | null;
    logo_path?: string | null;
    gallery_paths?: string[] | null;
    logo_url?: string | null;
    gallery_urls?: (string | null)[] | null;
};

interface Props {
    leads: ProviderLead[];
    searchTerm: string;
    statusFilter: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
    new: "Awaiting review",
    approved: "Approved",
    rejected: "Rejected",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
    new: "bg-sage/15 text-sage",
    approved: "bg-sage text-white",
    rejected: "bg-terracotta text-white",
};


export default function ProviderLeadsManager({ leads, searchTerm, statusFilter }: Props) {
    const [selectedLead, setSelectedLead] = useState<ProviderLead | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname() ?? "/admin/providers/leads";

    const totalCounts = useMemo(() => {
        return leads.reduce(
            (acc, lead) => {
                acc.all += 1;
                acc[lead.status] += 1;
                return acc;
            },
            { all: 0, new: 0, approved: 0, rejected: 0 } as Record<LeadStatus | "all", number>,
        );
    }, [leads]);

    const handleApprove = (lead: ProviderLead) => {
        setError(null);
        setMessage(null);
        startTransition(async () => {
            const result = await approveLead(lead.id);
            if (result.ok) {
                setMessage(`${lead.contact_name ?? lead.email} approved.`);
                setSelectedLead(null);
                router.refresh();
            } else {
                setError(result.error ?? "Unable to approve lead.");
            }
        });
    };

    const handleStatusChange = (lead: ProviderLead, status: LeadStatus) => {
        setError(null);
        setMessage(null);
        startTransition(async () => {
            const result = await updateLeadStatus(lead.id, status);
            if (result.ok) {
                setMessage(`Status updated to ${STATUS_LABELS[status]}.`);
                if (selectedLead) {
                    setSelectedLead({ ...selectedLead, status });
                }
                router.refresh();
            } else {
                setError(result.error ?? "Unable to update status.");
            }
        });
    };

    const leadsSearchId = useId();
    const leadsStatusId = useId();

    return (
        <section className="space-y-6 rounded-3xl border border-sage/25 bg-white p-6 shadow-soft">
            <form className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" method="get">
                <VisuallyHidden as="label" htmlFor={leadsSearchId}>
                  Search by name, email, or town
                </VisuallyHidden>
                <input
                    id={leadsSearchId}
                    type="search"
                    name="q"
                    placeholder="Search by name, email, or town"
                    defaultValue={searchTerm}
                    className="w-full rounded-full border border-sage/20 px-4 py-2.5 text-small focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
                <VisuallyHidden as="label" htmlFor={leadsStatusId}>
                  Filter by status
                </VisuallyHidden>
                <select
                    id={leadsStatusId}
                    name="status"
                    defaultValue={statusFilter}
                    className="rounded-full border border-sage/20 bg-white px-4 py-2.5 text-small focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                >
                    <option value="">All statuses</option>
                    <option value="new">Awaiting review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-sage px-5 py-2 text-small font-semibold text-white transition hover:bg-sage/90"
                    >
                        Filter
                    </button>
                    <a
                        href={pathname}
                        className="inline-flex items-center rounded-full border border-sage px-5 py-2 text-small font-semibold text-forest transition hover:bg-sage/10"
                    >
                        Reset
                    </a>
                </div>
            </form>

            <div className="flex flex-wrap gap-3 text-small text-charcoal/70">
                <span className="rounded-full border border-sage/20 px-3 py-1">
                    All leads: {totalCounts.all}
                </span>
                <span className="rounded-full border border-sage/20 px-3 py-1">
                    New: {totalCounts.new}
                </span>
                <span className="rounded-full border border-sage/20 px-3 py-1">
                    Approved: {totalCounts.approved}
                </span>
                <span className="rounded-full border border-sage/20 px-3 py-1">
                    Rejected: {totalCounts.rejected}
                </span>
            </div>

            {message ? (
                <div className="rounded-2xl border border-sage/40 bg-sage/10 px-4 py-3 text-small text-forest">
                    {message}
                </div>
            ) : null}
            {error ? (
                <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-small text-terracotta">
                    {error}
                </div>
            ) : null}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage/15 text-small">
                    <thead className="bg-cream/70 text-small font-semibold uppercase tracking-wide text-slateSoft">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left">
                                Submitted
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                                Contact
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                                Email
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                                Town
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                                Categories
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10 text-charcoal">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-cream/40">
                                <td className="px-4 py-3 text-small text-charcoal/70">{formatDate(lead.created_at, "datetime")}</td>
                                <td className="px-4 py-3 text-small font-medium">
                                    {lead.contact_name || "—"}
                                    <div className="text-small text-charcoal/50">{lead.phone || "No phone"}</div>
                                </td>
                                <td className="px-4 py-3 text-small">
                                    <a
                                        href={`mailto:${lead.email}`}
                                        className="text-sage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    >
                                        {lead.email}
                                    </a>
                                </td>
                                <td className="px-4 py-3 text-small text-charcoal/70">{lead.town || "—"}</td>
                                <td className="px-4 py-3 text-small text-charcoal/70">
                                    {lead.categories?.length ? lead.categories.join(", ") : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-small font-semibold ${STATUS_STYLES[lead.status]}`}
                                    >
                                        {STATUS_LABELS[lead.status]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-small">
                                    <div className="inline-flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="rounded-full border border-sage/40 px-3 py-1 text-small font-semibold text-forest transition hover:bg-sage/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                            onClick={() => setSelectedLead(lead)}
                                        >
                                            View
                                        </button>
                                        {lead.status === "new" ? (
                                            <button
                                                type="button"
                                                className="rounded-full bg-sage px-3 py-1 text-small font-semibold text-white transition hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                                onClick={() => handleApprove(lead)}
                                                disabled={isPending}
                                            >
                                                Approve
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!leads.length ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-small text-charcoal/60">
                                    No leads match your filters yet.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>

            <DetailDrawer
                title={selectedLead ? selectedLead.contact_name ?? selectedLead.email : "Lead details"}
                open={Boolean(selectedLead)}
                onClose={() => setSelectedLead(null)}
            >
                {selectedLead ? (
                    <div className="space-y-6 text-small text-charcoal/80">
                        <section className="space-y-2">
                            <p className="text-small uppercase tracking-wide text-slateSoft">
                                Submitted {formatDate(selectedLead.created_at, "datetime")}
                            </p>
                            <div className="flex flex-col gap-2">
                                <span className="text-body font-semibold text-charcoal">
                                    {selectedLead.contact_name || "No name provided"}
                                </span>
                                <a
                                    href={`mailto:${selectedLead.email}`}
                                    className="text-sage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                >
                                    {selectedLead.email}
                                </a>
                                {selectedLead.phone ? (
                                    <a
                                        href={`tel:${selectedLead.phone}`}
                                        className="text-sage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                    >
                                        {selectedLead.phone}
                                    </a>
                                ) : null}
                                {selectedLead.website ? (
                                    <a
                                        href={selectedLead.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                        aria-label="Visit website (opens in new tab)"
                                    >
                                        Visit website
                                    </a>
                                ) : null}
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h3 className="text-small font-semibold text-charcoal">About their classes</h3>
                            <p className="whitespace-pre-wrap rounded-2xl bg-cream/50 p-3">
                                {selectedLead.description || "No description provided."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedLead.categories?.map((category: string) => (
                                    <span
                                        key={category}
                                        className="rounded-full bg-sage/15 px-3 py-1 text-small font-semibold text-forest"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                            <p className="text-small text-charcoal/60">
                                {selectedLead.town ? `Based in ${selectedLead.town}.` : "Location unknown."}
                            </p>
                            {selectedLead.wants_newsletter ? (
                                <span className="rounded-full bg-sage/15 px-3 py-1 text-small font-semibold text-forest">
                                    Opted into newsletter
                                </span>
                            ) : null}
                        </section>

                                {selectedLead.logo_url || selectedLead.gallery_urls?.length ? (
                            <section className="space-y-3">
                                <h3 className="text-small font-semibold text-charcoal">Uploads</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {selectedLead.logo_url ? (
                                        <figure className="rounded-2xl border border-sage/20 bg-cream/40 p-4 aspect-[5/2]">
                                                    <Image
                                                        src={selectedLead.logo_url}
                                                        alt="Provider logo"
                                                        className="mx-auto max-h-32 object-contain"
                                                        width={320}
                                                        height={128}
                                                    />
                                            <figcaption className="mt-2 text-center text-small text-charcoal/60">
                                                Logo
                                            </figcaption>
                                        </figure>
                                    ) : null}
                                    {selectedLead.gallery_urls?.map((url: string | null, index: number) =>
                                        url ? (
                                            <figure
                                                key={url}
                                                className="rounded-2xl border border-sage/20 bg-cream/40 p-1 aspect-[16/9]"
                                            >
                                                        <Image
                                                            src={url}
                                                            alt={`Gallery image ${index + 1}`}
                                                            fill
                                                            className="rounded-2xl object-cover"
                                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        />
                                            </figure>
                                        ) : null,
                                    )}
                                </div>
                            </section>
                        ) : null}

                        <section className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                className="rounded-full bg-sage px-4 py-2 text-small font-semibold text-white transition hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => handleApprove(selectedLead)}
                                disabled={isPending || selectedLead.status === "approved"}
                            >
                                {selectedLead.status === "approved" ? "Already approved" : "Approve & publish"}
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-sage px-4 py-2 text-small font-semibold text-forest transition hover:bg-sage/10 disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => handleStatusChange(selectedLead, "rejected")}
                                disabled={isPending || selectedLead.status === "rejected"}
                            >
                                Mark as rejected
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-sage/40 px-4 py-2 text-small font-semibold text-charcoal transition hover:bg-sage/10 disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => handleStatusChange(selectedLead, "new")}
                                disabled={isPending || selectedLead.status === "new"}
                            >
                                Move back to review
                            </button>
                        </section>
                    </div>
                ) : null}
            </DetailDrawer>
        </section>
    );
}

