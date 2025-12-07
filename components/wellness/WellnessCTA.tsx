"use client";

import LinkComponent from "@/components/ui/link";

type WellnessCTAProps = {
    exploreQuery?: string;
    exploreLabel?: string;
    toolsHref?: string;
    toolsLabel?: string;
    showNewsletter?: boolean;
};

export default function WellnessCTA({
    exploreQuery = "",
    exploreLabel = "Explore classes",
    toolsHref = "/tools",
    toolsLabel = "Try tools",
    showNewsletter = true,
}: WellnessCTAProps) {
    const exploreHref = exploreQuery
        ? `/search?q=${encodeURIComponent(exploreQuery)}`
        : "/search";

    const handleNewsletterClick = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("newsletter:open", { detail: { source: "wellness" } })
            );
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <LinkComponent
                href={exploreHref}
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-body font-semibold text-white transition hover:bg-brand/90 hover:text-terracotta"
                aria-label={`${exploreLabel} - Search for classes`}
                prefetch={false}
            >
                {exploreLabel}
            </LinkComponent>
            {toolsHref && (
                <LinkComponent
                    href={toolsHref}
                    className="inline-flex items-center justify-center rounded-full border border-sage/40 bg-surface-alt px-6 py-3 text-body font-semibold text-brand transition hover:bg-brand/10"
                    aria-label={`${toolsLabel} - Access wellness tools`}
                    prefetch={false}
                >
                    {toolsLabel}
                </LinkComponent>
            )}
            {showNewsletter && (
                <button
                    type="button"
                    onClick={handleNewsletterClick}
                    className="inline-flex items-center justify-center rounded-full border border-sage/40 bg-cream/50 px-6 py-3 text-small font-semibold text-charcoal transition hover:bg-cream"
                    aria-label="Sign up for wellness newsletter"
                >
                    Newsletter signup
                </button>
            )}
        </div>
    );
}

