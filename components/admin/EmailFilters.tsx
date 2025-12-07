"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface EmailFiltersProps {
  typeOptions: string[];
  initialValues: {
    q?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
  };
}

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
];

const DEFAULT_TYPES = [
  "provider_thank_you",
  "admin_notify",
  "admin_alert",
  "test_email",
];

export default function EmailFilters({
  typeOptions,
  initialValues,
}: EmailFiltersProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin/emails";
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialValues.q ?? "");

  const types = useMemo(() => {
    const merged = new Set<string>(typeOptions.length ? typeOptions : DEFAULT_TYPES);
    return ["", ...Array.from(merged)];
  }, [typeOptions]);

  useEffect(() => {
    setSearch(initialValues.q ?? "");
  }, [initialValues.q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      updateParams({ q: search || undefined, page: undefined });
    }, 300);
    return () => clearTimeout(handler);
    // updateParams is intentionally omitted from dependencies to avoid re-running
    // the debounced effect when searchParams changes. The effect should only
    // trigger when the search input value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    startTransition(() => {
      const params = new URLSearchParams((searchParams ?? new URLSearchParams()).toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      if (!params.get("limit")) {
        params.set("limit", searchParams?.get("limit") ?? "20");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const handleReset = () => {
    setSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="sticky top-20 z-30 rounded-3xl border border-sage/20 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <VisuallyHidden as="label" htmlFor="email-filter-search">
            Filter by recipient or subject
          </VisuallyHidden>
          <input
            id="email-filter-search"
            type="search"
            placeholder="Filter by recipient or subject"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-full border border-sage/30 bg-white px-4 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
          />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div>
              <label
                htmlFor="email-filter-status"
                className="block text-small font-semibold uppercase tracking-wide text-slateSoft"
              >
                Status
              </label>
              <select
                id="email-filter-status"
                defaultValue={initialValues.status ?? ""}
                onChange={(event) =>
                  updateParams({ status: event.target.value || undefined, page: undefined })
                }
                className="rounded-full border border-sage/30 bg-white px-3 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="email-filter-type"
                className="block text-small font-semibold uppercase tracking-wide text-slateSoft"
              >
                Type
              </label>
              <select
                id="email-filter-type"
                defaultValue={initialValues.type ?? ""}
                onChange={(event) =>
                  updateParams({ type: event.target.value || undefined, page: undefined })
                }
                className="rounded-full border border-sage/30 bg-white px-3 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
              >
                <option value="">All types</option>
                {types
                  .filter((value) => value)
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label
                htmlFor="email-filter-from"
                className="block text-small font-semibold uppercase tracking-wide text-slateSoft"
              >
                From
              </label>
              <input
                id="email-filter-from"
                type="date"
                defaultValue={initialValues.from ?? ""}
                onChange={(event) =>
                  updateParams({ from: event.target.value || undefined, page: undefined })
                }
                className="rounded-full border border-sage/30 bg-white px-3 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
              />
            </div>
            <div>
              <label
                htmlFor="email-filter-to"
                className="block text-small font-semibold uppercase tracking-wide text-slateSoft"
              >
                To
              </label>
              <input
                id="email-filter-to"
                type="date"
                defaultValue={initialValues.to ?? ""}
                onChange={(event) =>
                  updateParams({ to: event.target.value || undefined, page: undefined })
                }
                className="rounded-full border border-sage/30 bg-white px-3 py-2 text-small text-charcoal shadow-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/40"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-sage/30 px-4 py-2 text-small font-semibold text-sage shadow-sm transition hover:border-sage hover:bg-sage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            disabled={isPending}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}


