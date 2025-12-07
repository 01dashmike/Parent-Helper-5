"use client";

import { Suspense } from "react";
import HeroSearch from "@/components/search/HeroSearch";

type ClientHeroSearchProps = {
  initialLocation?: string | null;
  heroCopy?: {
    headline: string;
    subheadline?: string;
  };
};

export default function ClientHeroSearch({ initialLocation, heroCopy }: ClientHeroSearchProps) {
  return (
    <Suspense fallback={<div className="h-16 rounded-full bg-cream" />}>
      <HeroSearch initialLocation={initialLocation} heroCopy={heroCopy} />
    </Suspense>
  );
}
