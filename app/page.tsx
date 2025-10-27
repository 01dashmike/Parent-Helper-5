"use client";

import ContactSection from "@/components/ContactSection";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TownHighlightsSection from "@/components/TownHighlightsSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream overflow-x-hidden">
      <HeroSection />
      <section className="mt-6">
        <TownHighlightsSection />
      </section>
      <div className="mt-2 md:mt-3">
        <FeaturesCarousel />
      </div>
      <section className="mt-6">
        <HowItWorksSection />
      </section>
      <section className="mt-6">
        <ContactSection />
      </section>
    </main>
  );
}
