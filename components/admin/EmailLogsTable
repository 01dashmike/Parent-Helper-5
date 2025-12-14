"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { EmailLog } from "@/lib/types/email";
import DetailDrawer from "./DetailDrawer";

interface EmailLogsTableProps {
    rows: EmailLog[];
    total: number;
    page: number;
    limit: number;
    ok: boolean;
    error?: string;
}

const STATUS_STYLES: Record<EmailLog["status"] | string, string> = {
    sent: "bg-sage/15 text-sage",
    failed: "bg-terracotta/10 text-terracotta",
    preview: "bg-charcoal/10 text-charcoal/80",
};

const LIMIT_OPTIONS = [20, 50];

export default function EmailLogsTable({
    rows,
    total,
    page,
    limit,
    ok,
    error,
}: EmailLogsTableProps) {
    const router = useRouter();
    const pathname = usePathname() ?? "/admin/email-logs";
    const searchParams = useSearchParams();
    const [selected, setSelected] = useState<EmailLog | null>(null);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    const handleChangeParam = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams((searchParams ?? new URLSearchParams()).toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const handleExport = () => {
        const params = searchParams?.toString() ?? "";
        const url = `/api/admin/email-logs/export${params ? `?${params}` : ""}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const paginationNumbers = useMemo(() => {
        const pages: number[] = [];
        const maxVisible = 7;
        const start = Math.max(1, page - 3);
        const end = Math.min(totalPages, start + maxVisible - 1);
        for (let i = start; i <= end; i += 1) {
            pages.push(i);
        }
        return pages;
    }, [page, totalPages]);

    const renderStatusPill = (status: EmailLog["status"]) => {
        const style = STATUS_STYLES[status] ?? "bg-charcoal/10 text-charcoal";
        return (
            <span className={`inline-flex rounded-full px-3 py-1 text-small font-semibold ${style}`}>
                {status}
            </span>
        );
    };

    const formatDateTime = (iso: string) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-small text-slateSoft">
                    <span>Total: {total.toLocaleString()}</span>
                    {!ok && error ? (
                        <span className="rounded-full border border-terracotta/40 bg-terracotta/10 px-2 py-1 text-terracotta">
                            {error}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-3">
                    <label
                        htmlFor="email-log-limit"
                        className="text-small font-semibold uppercase tracking-wide text-slateSoft"
                    >
                        Per page
                    </label>
                    <select
                        id="email-log-limit"
                        value={limit}
                        onChange={(event) =>
                            handleChangeParam({ limit: Number(event.target.value), page: 1 })
                        }
                        className="rounded-full border border-sage/30 bg-white px-3 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
                    >
                        {LIMIT_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="rounded-full border border-sage/30 px-4 py-2 text-small font-semibold text-sage shadow-sm transition hover:border-sage hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-sage/20 bg-white shadow-soft">
                <table
                    className="min-w-full divide-y divide-sage/15 text-left text-small text-charcoal"
                    aria-label="Email logs"
                >
                    <thead className="bg-cream/70 text-small font-semibold uppercase tracking-wide text-slateSoft">
                        <tr>
                            <th scope="col" className="px-4 py-3">
                                Date / Time
                            </th>
                            <th scope="col" className="px-4 py-3">
                                Recipient
                            </th>
                            <th scope="col" className="px-4 py-3">
                                Subject
                            </th>
                            <th scope="col" className="px-4 py-3">
                                Type
                            </th>
                            <th scope="col" className="px-4 py-3">
                                Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                                View
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10 text-small">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-small text-slateSoft"
                                >
                                    No email logs match your filters.
                                </td>
                            </tr>
                        ) : (
                            rows.map((log) => (
                                <tr
                                    key={log.id}
                                    className="cursor-pointer transition hover:bg-cream/40 focus-within:bg-cream/50"
                                    onClick={() => setSelected(log)}
                                >
                                    <td className="px-4 py-3 text-slateSoft">{formatDateTime(log.created_at)}</td>
                                    <td className="px-4 py-3 break-words">{log.to_address}</td>
                                    <td className="px-4 py-3 break-words font-medium">{log.subject}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-sage/15 px-2 py-1 text-small font-semibold uppercase tracking-wide text-sage">
                                            {log.type || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{renderStatusPill(log.status)}</td>
                                    <td className="px-2 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelected(log);
                                            }}
                                            className="rounded-full border border-sage/30 px-3 py-1 text-small font-semibold text-sage transition hover:border-sage hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                                            aria-label={`View email log ${log.subject}`}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-sage/20 bg-white px-4 py-3 text-small text-slateSoft shadow-soft">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!hasPrevious}
                            onClick={() => handleChangeParam({ page: page - 1 })}
                            className="rounded-full border border-sage/30 px-3 py-1 font-semibold text-sage transition hover:border-sage hover:bg-sage/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            aria-label="Previous page"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={!hasNext}
                            onClick={() => handleChangeParam({ page: page + 1 })}
                            className="rounded-full border border-sage/30 px-3 py-1 font-semibold text-sage transition hover:border-sage hover:bg-sage/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            aria-label="Next page"
                        >
                            Next
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {paginationNumbers.map((pageNumber) => (
                            <button
                                key={pageNumber}
                                type="button"
                                onClick={() => handleChangeParam({ page: pageNumber })}
                                className={`rounded-full px-3 py-1 text-small font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${pageNumber === page
                                        ? "bg-sage text-white shadow-soft"
                                        : "border border-sage/30 text-sage hover:border-sage hover:bg-sage/10"
                                    }`}
                                aria-current={pageNumber === page ? "page" : undefined}
                            >
                                {pageNumber}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <DetailDrawer
                title={selected ? "Email Log Details" : ""}
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
            >
                {selected ? (
                    <div className="space-y-4 text-small">
                        <DefinitionRow label="Subject" value={selected.subject} />
                        <DefinitionRow label="Recipient" value={selected.to_address} />
                        <DefinitionRow label="Type" value={selected.type} />
                        <DefinitionRow label="Status" value={selected.status} />
                        <DefinitionRow label="Created" value={formatDateTime(selected.created_at)} />
                        <DefinitionRow
                            label="Error"
                            value={selected.error ? selected.error : "—"}
                            valueClass={selected.error ? "text-terracotta" : "text-slateSoft"}
                        />
                        <div>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
                                    } catch (clipError) {
                                        console.warn("[EmailLogsTable] Failed to copy email log JSON:", clipError);
                                    }
                                }}
                                className="rounded-full border border-sage/30 px-4 py-2 text-small font-semibold text-sage transition hover:border-sage hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                            >
                                Copy row as JSON
                            </button>
                        </div>
                    </div>
                ) : null}
            </DetailDrawer>
        </div>
    );
}

function DefinitionRow({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-2xl border border-sage/15 bg-cream/40 px-4 py-3">
            <span className="text-small font-semibold uppercase tracking-wide text-slateSoft">{label}</span>
            <span className={`text-small text-charcoal ${valueClass ?? ""}`}>{value}</span>
        </div>
    );
}


