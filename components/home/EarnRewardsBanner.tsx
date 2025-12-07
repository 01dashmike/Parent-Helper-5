"use client";

import LinkComponent from "@/components/ui/link";
import { Gift, Share2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { useToast } from "@/hooks/use-toast";
import { CardContainer, CardBody } from "@/components/cards";

type EarnRewardsBannerProps = {
  referralCode: string | null;
  referralsSent: number;
};

export function EarnRewardsBanner({ referralCode, referralsSent }: EarnRewardsBannerProps) {
  const { toast } = useToast();
  // Only show if user has 0 referrals sent and has a referral code
  if (referralsSent > 0 || !referralCode) {
    return null;
  }

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${referralCode}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Parent Helper",
          text: `Check out Parent Helper - amazing classes for kids! Use my referral code: ${referralCode}`,
          url: referralUrl,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(referralUrl);
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
          variant: "success",
        });
      } catch {
        console.error("Failed to copy referral link");
        toast({
          title: "Error",
          description: "Failed to copy referral link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <CardContainer bgVariant="cream">
      <CardBody>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-sage/20 p-2">
            <Gift size={iconSize.md} className="text-sage" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-small font-semibold text-charcoal">Earn rewards</h3>
            <p className="mt-1 text-small text-slateSoft">
              Share your referral link and earn rewards when friends join
            </p>

            {/* Referral code display */}
            <div className="mt-3 rounded-card border border-sage/20 bg-white/60 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-small text-slateSoft">Your referral code</p>
                  <p className="mt-0.5 font-mono text-small font-semibold text-charcoal">
                    {referralCode}
                  </p>
                </div>
                <button
                  onClick={handleShare}
                  className="flex-shrink-0 rounded-full bg-sage p-2 text-white transition hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 min-h-10 min-w-10"
                  aria-label="Share referral link"
                >
                  <Share2 size={iconSize.sm} aria-hidden="true" />
                </button>
              </div>
            </div>

            <LinkComponent
              href="/account/referrals"
              className="mt-3 inline-block text-body text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              prefetch={false}
            >
              View referral dashboard →
            </LinkComponent>
          </div>
        </div>
      </CardBody>
    </CardContainer>
  );
}

