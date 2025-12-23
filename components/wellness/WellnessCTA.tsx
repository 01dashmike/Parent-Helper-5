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
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-700 bg-white px-6 py-3 text-body font-semibold text-emerald-700 transition hover:bg-emerald-50"
                aria-label={`${exploreLabel} - Search for classes`}
                prefetch={false}
            >
                {exploreLabel}
            </LinkComponent>
            {toolsHref && (
                <LinkComponent
                    href={toolsHref}
                    className="inline-flex items-center justify-center rounded-full border-2 border-emerald-700 bg-white px-6 py-3 text-body font-semibold text-emerald-700 transition hover:bg-emerald-50"
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
                    className="inline-flex items-center justify-center rounded-full border-2 border-emerald-700 bg-white px-6 py-3 text-body font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    aria-label="Sign up for wellness newsletter"
                >
                    Newsletter signup
                </button>
            )}
        </div>
    );
}

