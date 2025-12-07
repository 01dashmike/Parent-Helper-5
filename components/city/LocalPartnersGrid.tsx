"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LinkComponent from "@/components/ui/link";
import { ExternalLink } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { isLocalPartnersEnabled } from "@/lib/env";

interface Partner {
    id: string;
    name: string;
    type: string;
    url: string;
    image_url?: string | null;
    summary?: string | null;
    is_featured: boolean;
    affiliate_code?: string | null;
}

interface Props {
    citySlug: string;
}

export default function LocalPartnersGrid({ citySlug }: Props) {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Robust flag check - early return if feature is disabled
        if (!isLocalPartnersEnabled()) {
            setLoading(false);
            return;
        }

        async function fetchPartners() {
            try {
                const response = await fetch(`/api/partners?city_slug=${encodeURIComponent(citySlug)}&limit=6`);
                if (!response.ok) return;
                const data = await response.json();
                setPartners(data.partners || []);
            } catch (error) {
                console.error("Error fetching partners:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPartners();
    }, [citySlug]);

    // Early return if feature disabled, still loading, or no partners
    // Robust flag check prevents crashes when flag is undefined
    if (!isLocalPartnersEnabled() || loading || partners.length === 0) {
        return null;
    }

    const handlePartnerClick = async (partnerId: string, url: string, affiliateCode?: string | null) => {
        // Track click
        try {
            await fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    events: [
                        {
                            eventType: "partner_click",
                            payload: {
                                sessionId: crypto.randomUUID(),
                                partnerId,
                                citySlug,
                                url,
                                affiliateCode: affiliateCode || null,
                            },
                        },
                    ],
                }),
            });
        } catch (error) {
            console.error("Error tracking partner click:", error);
        }
    };

    const buildPartnerUrl = (url: string, affiliateCode?: string | null) => {
        if (!affiliateCode) return url;
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}utm_source=parenthelper&utm_medium=referral&utm_campaign=local_partners&ref=${encodeURIComponent(affiliateCode)}`;
    };

    return (
        <section className="border-t border-sage/20 bg-white py-12">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-heading">
                    <h2 className="text-display-2 font-semibold text-charcoal">Local Partners</h2>
                    <p className="mt-2 text-small text-text-tertiary">
                        Discover local cafes, parks, museums, and more in your area
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {partners.map((partner) => {
                        const partnerUrl = buildPartnerUrl(partner.url, partner.affiliate_code);
                        return (
                            <LinkComponent
                                key={partner.id}
                                href={partnerUrl}
                                onClick={() => handlePartnerClick(partner.id, partner.url, partner.affiliate_code)}
                                className="group block rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60 transition-shadow duration-200 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                aria-label={`Visit ${partner.name} (opens in new tab)`}
                            >
                                {partner.image_url && (
                                    <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl">
                                        <Image
                                            src={partner.image_url}
                                            alt={partner.name || "Local partner"}
                                            fill
                                            className="object-cover transition group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-title font-semibold text-charcoal group-hover:text-sage">
                                            {partner.name}
                                        </h3>
                                        <ExternalLink size={iconSize.sm} className="flex-shrink-0 text-sage opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-sage/10 px-2 py-1 text-small text-sage capitalize">
                                            {partner.type}
                                        </span>
                                        {partner.is_featured && (
                                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-small text-yellow-800">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    {partner.summary && (
                                        <p className="line-clamp-2 text-small text-text-tertiary">
                                            {partner.summary}
                                        </p>
                                    )}
                                </div>
                            </LinkComponent>
                        );
                    })}
                </div>
                <div className="mt-6 text-center">
                    <LinkComponent
                        href={`/partners?city=${encodeURIComponent(citySlug)}`}
                        className="inline-block text-body font-medium text-brand hover:underline"
                        prefetch={false}
                    >
                        View all partners →
                    </LinkComponent>
                </div>
            </div>
        </section>
    );
}

