"use client";

import React, { memo, useMemo } from "react";
import { isPersonalizationEnabled, isWeatherWidgetEnabled } from "@/lib/env";
import HeroSection from "@/components/HeroSection";

type HeroSearchProps = {
  initialLocation?: string | null;
  heroCopy?: {
    headline: string;
    subheadline?: string;
  };
};

const HeroSearch = memo<HeroSearchProps>(function HeroSearch({ initialLocation, heroCopy }) {
  // Compute feature flags once to ensure deterministic rendering
  // Use robust boolean checks to prevent crashes when flags are undefined
  const showWidgets = useMemo(() => {
    const personalizationEnabled = !!isPersonalizationEnabled();
    const weatherWidgetEnabled = !!isWeatherWidgetEnabled();
    return personalizationEnabled || weatherWidgetEnabled;
  }, []);

  if (!showWidgets) {
    return <HeroSection heroCopy={heroCopy} />;
  }

  return (
    <HeroSection
      initialLocation={showWidgets ? initialLocation : null}
      heroCopy={heroCopy}
    />
  );
});

HeroSearch.displayName = "HeroSearch";

export default HeroSearch;
