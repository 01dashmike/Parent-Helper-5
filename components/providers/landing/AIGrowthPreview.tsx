"use client";

import LinkComponent from "@/components/ui/link";
import { Sparkles, TrendingUp, Target, ArrowRight } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

export function AIGrowthPreview() {
  return (
    <div className="rounded-2xl border-2 border-sage/30 bg-gradient-to-br from-sage/5 to-white p-8 md:p-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage/20">
            <Sparkles className="h-6 w-6 text-sage" />
          </div>
          <div>
            <h2 className="text-title font-semibold text-charcoal md:text-display-2">
              AI Growth Assistant
            </h2>
            <p className="text-small text-charcoal/60">Available in your provider dashboard</p>
          </div>
        </div>

        <p className="mb-6 text-body text-text-tertiary">
          Get personalized recommendations to grow your classes. Our AI assistant analyzes your
          listing, suggests improvements, and helps you reach more families.
        </p>

        <div className="mb-8 grid gap-card md:grid-cols-3">
          <div className="rounded-lg border border-sage/20 bg-white p-4">
            <TrendingUp className="mb-2 h-6 w-6 text-sage" />
            <h3 className="mb-1 font-semibold text-charcoal">Growth Insights</h3>
            <p className="text-small text-charcoal/60">
              Track your progress and see what&apos;s working
            </p>
          </div>
          <div className="rounded-lg border border-sage/20 bg-white p-4">
            <Target className="mb-2 h-6 w-6 text-sage" />
            <h3 className="mb-1 font-semibold text-charcoal">Actionable Tips</h3>
            <p className="text-small text-charcoal/60">
              Get specific suggestions to improve your listing
            </p>
          </div>
          <div className="rounded-lg border border-sage/20 bg-white p-4">
            <Sparkles className="mb-2 h-6 w-6 text-sage" />
            <h3 className="mb-1 font-semibold text-charcoal">SEO Optimization</h3>
            <p className="text-small text-charcoal/60">
              Improve your search visibility automatically
            </p>
          </div>
        </div>

        <LinkComponent
          href="/providers/register"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-body font-semibold text-white transition hover:bg-brand/90"
          prefetch={false}
        >
          Get started to access AI Assistant
          <ArrowRight size={iconSize.sm} aria-hidden="true" />
        </LinkComponent>
      </div>
    </div>
  );
}

