"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

type AffiliateOffer = {
  partner: string;
  title: string;
  description: string;
  url: string;
  rewardPoints?: number;
  walletCreditCents?: number;
  imageUrl?: string;
};

export function AffiliateCard({ offer }: { offer: AffiliateOffer }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Record click
      await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner: offer.partner,
          url: offer.url,
          rewardPoints: offer.rewardPoints || 0,
          walletCreditCents: offer.walletCreditCents || 0,
        }),
      });

      // Open affiliate link
      window.open(offer.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to record affiliate click:", error);
      // Still open the link even if tracking fails
      window.open(offer.url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60 transition-shadow duration-200 hover:shadow-soft-lg">
      {offer.imageUrl && (
        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={offer.imageUrl}
            alt={offer.title || "Affiliate offer"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <h3 className="mb-small text-title font-semibold text-charcoal">{offer.title}</h3>
      <p className="mb-4 text-small text-text-tertiary">{offer.description}</p>
      {((offer.rewardPoints ?? 0) > 0 || (offer.walletCreditCents ?? 0) > 0) && (
        <div className="mb-4 rounded-md bg-sage/10 p-2 text-small text-forest">
          {(offer.rewardPoints ?? 0) > 0 && (
            <span className="font-medium">{offer.rewardPoints} reward points</span>
          )}
          {(offer.rewardPoints ?? 0) > 0 && (offer.walletCreditCents ?? 0) > 0 && " • "}
          {(offer.walletCreditCents ?? 0) > 0 && (
            <span className="font-medium">
              £{((offer.walletCreditCents ?? 0) / 100).toFixed(2)} wallet credit
            </span>
          )}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-sage text-white font-medium rounded-xl px-4 py-3 shadow-soft hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 w-full gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Visit ${offer.partner} (opens in new tab)`}
      >
        {loading ? (
          "Loading..."
        ) : (
          <>
            Visit Partner <ExternalLink size={iconSize.sm} aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}


