"use client";

import { motion, useReducedMotion } from "framer-motion";

import ContactSection from "@/components/ContactSection";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-brand-cream">
      <HeroSection />

      <div className="relative h-16 w-full -mt-6" aria-hidden="true">
        {!prefersReducedMotion ? (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-brand-cream/0 via-brand-cream/60 to-brand-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/0 via-brand-cream/60 to-brand-cream" />
        )}
      </div>

      <section className="mt-8 md:mt-6">
        <FeaturesCarousel />
      </section>

      <HowItWorksSection />
      <ContactSection />
    </main>
  );
}
