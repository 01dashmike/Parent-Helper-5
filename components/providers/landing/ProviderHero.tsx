"use client";

import LinkComponent from "@/components/ui/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

export function ProviderHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream to-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sage/30 bg-white/80 px-4 py-2 text-small font-semibold uppercase tracking-widest text-sage shadow-sm">
            <Sparkles className="h-4 w-4" />
            For Providers
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-display-2 font-bold leading-tight tracking-tight text-charcoal md:text-display-1">
            Boost your classes.
            <br />
            Reach more parents.
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-body text-text-tertiary md:text-title">
            Parent Helper connects you with families looking for local activities. Get discovered,
            fill your classes, and grow your business.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkComponent
              href="/providers/register"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-body font-semibold text-white shadow-lg transition hover:bg-brand/90 hover:shadow-xl"
              prefetch={false}
            >
              Register your class
              <ArrowRight size={iconSize.md} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </LinkComponent>
            <LinkComponent
              href="/providers"
              className="inline-flex items-center rounded-full border-2 border-sage px-8 py-4 text-body font-semibold text-brand transition hover:bg-brand/10"
              prefetch={false}
            >
              Learn more
            </LinkComponent>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-small text-charcoal/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sage" />
              <span>Free to get started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sage" />
              <span>Approved in 48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sage" />
              <span>No long-term contracts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sage/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sage/5 blur-3xl" />
    </section>
  );
}

