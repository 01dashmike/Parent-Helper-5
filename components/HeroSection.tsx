"use client";

import { useEffect, Suspense } from "react";
import { logExperimentAssignment } from "@/lib/analytics";
import LocalPhoto from "@/components/LocalPhoto";
import SearchFields from "@/components/SearchFields";
import WeatherCard from "@/components/WeatherCard";
import { MotionH1 } from "@/components/motion/MotionH1";
import { MotionP } from "@/components/motion/MotionP";
import { MotionDiv } from "@/components/motion/MotionDiv";

type HeroSectionProps = {
  initialLocation?: string | null;
  heroCopy?: {
    headline: string;
    subheadline?: string;
    variant?: "A" | "B";
    ctaPlacement?: "above" | "below";
  };
};

export default function HeroSection({ heroCopy, initialLocation }: HeroSectionProps) {
  const headline = heroCopy?.headline || "Find baby and toddler classes near you";
  const subheadline = heroCopy?.subheadline;
  const variant = heroCopy?.variant || "A";
  const ctaPlacement = heroCopy?.ctaPlacement || "below";

  // Log variant assignment on mount
  useEffect(() => {
    if (variant && heroCopy?.variant) {
      logExperimentAssignment({
        experiment: "hero_copy_cta",
        variant,
      });
    }
  }, [variant, heroCopy?.variant]);

  const searchFields = (
    <Suspense
      fallback={
        <div className="h-14 w-full max-w-4xl rounded-full border border-sage/20 bg-white/70 shadow-lg" />
      }
    >
      <SearchFields initialLocation={initialLocation} variant={variant} />
    </Suspense>
  );

  return (
    <section className="flex flex-col items-center space-y-4 py-8 text-center md:space-y-6 md:py-10">
      <MotionH1
        id="page-title"
        className="max-w-3xl text-title font-semibold leading-tight tracking-tight text-charcoal md:text-display-2 break-words"
        lang="en"
        animation="slideUp"
        delay={0}
        duration={0.6}
        distance={20}
      >
        {headline}
      </MotionH1>

      {subheadline && (
        <MotionP
          className="max-w-2xl text-body text-text-tertiary line-clamp-2"
          lang="en"
          animation="slideUp"
          delay={0.1}
          duration={0.6}
          distance={20}
        >
          {subheadline}
        </MotionP>
      )}

      <MotionDiv
        className="mt-4 flex w-full justify-center px-4 md:mt-6"
        animation="slideUp"
        delay={ctaPlacement === "above" ? 0.1 : 0.2}
        duration={0.6}
        distance={20}
      >
        {searchFields}
      </MotionDiv>

      {initialLocation && (
        <MotionDiv
          className="mt-6 flex w-full max-w-4xl flex-wrap items-center justify-center gap-4 px-4"
          animation="slideUp"
          delay={0.4}
          duration={0.6}
          distance={20}
        >
          <WeatherCard city={initialLocation} />
          <LocalPhoto city={initialLocation} />
        </MotionDiv>
      )}
    </section>
  );
}
