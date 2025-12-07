"use client";

import { Award, Sparkles, Users, Heart } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { SendBadge } from "./SendBadge";

export default function BadgeSystemPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-small text-title text-text-primary">SEND-Friendly Badge</h3>
        <p className="text-small text-text-tertiary">
          Display this badge on your class listing to show families that your class is designed to
          support children with additional needs.
        </p>
      </div>

      <div className="grid gap-card md:grid-cols-3">
        <div className="rounded-lg border border-sage/20 bg-surface-alt p-6 text-center">
          <div className="mb-3 flex justify-center">
            <SendBadge size="lg" />
          </div>
          <p className="text-small text-text-tertiary">Standard Badge</p>
        </div>

        <div className="rounded-lg border border-sage/20 bg-surface-alt p-6 text-center">
          <div className="mb-3 flex justify-center">
            <SendBadge size="md" />
          </div>
          <p className="text-small text-text-tertiary">Medium Badge</p>
        </div>

        <div className="rounded-lg border border-sage/20 bg-surface-alt p-6 text-center">
          <div className="mb-3 flex justify-center">
            <SendBadge size="sm" />
          </div>
          <p className="text-small text-text-tertiary">Small Badge</p>
        </div>
      </div>

      <div className="rounded-lg border border-sage/20 bg-brand/5 p-6">
        <h4 className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
          <Award size={iconSize.md} className="text-brand" aria-hidden="true" />
          Badge Benefits
        </h4>
        <ul className="space-y-2 text-small text-text-tertiary">
          <li className="flex items-start gap-2">
            <Sparkles size={iconSize.sm} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>Increased visibility in SEND-specific searches</span>
          </li>
          <li className="flex items-start gap-2">
            <Users size={iconSize.sm} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>Trust signal for families seeking inclusive classes</span>
          </li>
          <li className="flex items-start gap-2">
            <Heart size={iconSize.sm} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            <span>Featured placement in SEND Hub resources</span>
          </li>
        </ul>
      </div>

      <div className="rounded-lg bg-white border border-sage/20 p-section">
        <p className="text-small text-text-tertiary">
          <strong className="text-charcoal">How to earn:</strong> Complete the SEND-friendly
          checklist and have your class reviewed by our team. Badge is free and helps connect you
          with families who need your support.
        </p>
      </div>
    </div>
  );
}

