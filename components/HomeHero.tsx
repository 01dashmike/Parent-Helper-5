"use client";

import LinkComponent from "@/components/ui/link";
import { useExperiment } from "@/hooks/useExperiment";

const HIGHLIGHTS = [
  { label: "Curated activities", value: "5,000+" },
  { label: "Trusted providers", value: "320" },
  { label: "Cities covered", value: "75" },
];

export default function HomeHero() {
  const heroVariant = useExperiment("homepage_hero");

  return (
    <div className="relative overflow-hidden rounded-hero bg-gradient-to-br from-primary via-accent to-secondary p-10 text-white shadow-glow sm:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
      <div className="relative grid gap-12 md:grid-cols-[1.2fr,0.8fr] md:items-center">
        <div className="space-y-6">
          {heroVariant === "B" ? (
            <span className="inline-flex items-center rounded-full bg-white/20 px-md py-xs text-small font-semibold tracking-wide uppercase text-white/90 shadow-sm backdrop-blur">
              Trusted by thousands of families
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/20 px-md py-xs text-small font-semibold tracking-wide uppercase text-white/90 shadow-sm backdrop-blur">
              For joyful childhood adventures
            </span>
          )}
          <h1 className="text-display-1">
            {heroVariant === "B" 
              ? "Find the perfect classes for your little one"
              : "Discover magical days out with Parent Helper"
            }
          </h1>
          <p className="max-w-xl text-body text-white/90">
            {heroVariant === "B" 
              ? "Explore thousands of trusted baby and toddler activities. Find classes, compare options, and discover experiences your family will love."
              : "Search inspiring parent-and-child classes, compare warm community spaces, and save the experiences that light up your little one's world. We deliver beautifully organised recommendations every week."
            }
          </p>
          <div className="flex flex-wrap gap-4">
            <LinkComponent
              href="/search?town=london"
              className="btn btn-md bg-white text-primary hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-white/80"
              prefetch={false}
            >
              {heroVariant === "B" ? "Explore classes" : "Browse featured towns"}
            </LinkComponent>
            <LinkComponent
              href="#join"
              className="btn btn-md border border-white/60 bg-transparent text-white/90 hover:border-white hover:bg-white/10 focus-visible:ring-white/80"
              prefetch={false}
            >
              Join the family newsletter
            </LinkComponent>
          </div>
        </div>

        <div className="rounded-hero bg-white/15 p-6 shadow-inner backdrop-blur">
          <div className="grid gap-section">
            {HIGHLIGHTS.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-hero border border-white/30 bg-white/10 p-6 shadow-soft transition-standard hover:bg-white/15"
              >
                <p className="text-small font-medium uppercase tracking-widest text-white/80">
                  {highlight.label}
                </p>
                <p className="mt-sm text-display-2">{highlight.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
