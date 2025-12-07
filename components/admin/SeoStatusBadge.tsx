"use client";

import { useId } from "react";
import { getSeoStatus } from "@/lib/seo/getSeoStatus";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type ClassMetadata = {
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type SeoStatusBadgeProps = {
  classItem: ClassMetadata;
};

export function SeoStatusBadge({ classItem }: SeoStatusBadgeProps) {
  const status = getSeoStatus(classItem);

  const statusConfig = {
    ready: {
      label: "AI SEO: ready",
      className: "bg-green-100 text-green-800",
    },
    missing: {
      label: "AI SEO: missing",
      className: "bg-yellow-100 text-yellow-800",
    },
    outdated: {
      label: "AI SEO: outdated",
      className: "bg-orange-100 text-orange-800",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  const badgeId = useId();
  
  return (
    <>
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-small font-medium ${config.className}`}
        aria-describedby={badgeId}
      >
        {config.label}
      </span>
      <VisuallyHidden id={badgeId}>
        SEO metadata status: {status}
      </VisuallyHidden>
    </>
  );
}

