"use client";

import { ReactNode } from "react";

interface DocsSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function DocsSection({
  id,
  title,
  description,
  children,
  className = "",
}: DocsSectionProps) {
  return (
    <section id={id} className={`mb-12 scroll-mt-20 ${className}`}>
      <div className="mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-title font-semibold text-charcoal">{title}</h2>
        {description && (
          <p className="mt-1 text-small text-slateSoft">{description}</p>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}

