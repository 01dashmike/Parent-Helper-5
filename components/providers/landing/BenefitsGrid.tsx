"use client";

import { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsGridProps {
  benefits: Benefit[];
}

export function BenefitsGrid({ benefits }: BenefitsGridProps) {
  return (
    <div className="grid-responsive gap-section">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        return (
          <div
            key={benefit.title}
            className="group rounded-2xl border border-sage/20 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:border-sage/40 hover:shadow-elevated"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sage/10 text-sage transition-colors group-hover:bg-sage/20">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-title font-semibold text-charcoal">{benefit.title}</h3>
            <p className="text-small leading-relaxed text-text-tertiary">{benefit.description}</p>
          </div>
        );
      })}
    </div>
  );
}

