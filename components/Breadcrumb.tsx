"use client";

import LinkComponent from "@/components/ui/link";
import { ChevronRight } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Accessible breadcrumb navigation component
 * WCAG compliant with proper ARIA labels
 */
export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-small text-text-tertiary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-charcoal font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <>
                  <LinkComponent
                    href={item.href}
                    className="hover:text-text-primary motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none rounded text-body"
                    prefetch={false}
                  >
                    {item.label}
                  </LinkComponent>
                  <ChevronRight size={iconSize.sm} className="text-text-primary/40" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>{item.label}</span>
                  <ChevronRight size={iconSize.sm} className="text-charcoal/40" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

