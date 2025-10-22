"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPinned, Sparkles, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";

import SearchBar from "@/components/SearchBar";
import { useIsMobile } from "@/hooks/useMediaQuery";

const HIGHLIGHTS = [
  { icon: MapPinned, text: "Verified classes across the UK" },
  { icon: Sparkles, text: "Inspiring experiences for every age" },
  { icon: HeartHandshake, text: "Trusted support for parents & carers" },
];

export default function HeroSection() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const headingDuration = isMobile ? 0.45 : 0.6;
  const bodyDuration = isMobile ? 0.35 : 0.5;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-sage via-brand-cream to-white px-6 py-14 shadow sm:px-8 sm:py-16 lg:py-20">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-4 px-2 sm:px-0">
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: headingDuration, ease: "easeOut" }}
            style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
            className="text-3xl font-bold tracking-tight text-brand-teal sm:text-4xl lg:text-5xl"
          >
            Discover the Best Family Activities Near You
          </motion.h1>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.2,
              duration: bodyDuration,
              ease: "easeOut",
            }}
            style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
          >
            <p className="text-sm text-brand-teal/80 sm:text-base lg:text-lg">
              Find classes, clubs, and support groups for parents, babies, and toddlers—all curated
              by Parent Helper.
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.25,
            duration: bodyDuration,
            ease: "easeOut",
          }}
          style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
          className="w-full px-2 sm:px-0"
        >
          <SearchBar />
        </motion.div>
        <motion.button
          type="button"
          onClick={() => router.push("/classes/winchester")}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300 }}
          className="inline-flex items-center justify-center rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Explore Classes
        </motion.button>
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              whileHover={shouldReduceMotion ? undefined : { rotate: 2, scale: 1.05 }}
              transition={{ duration: isMobile ? 0.2 : 0.25 }}
              style={shouldReduceMotion ? undefined : { willChange: "transform" }}
              className="flex items-center justify-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs text-brand-teal shadow-sm sm:px-4 sm:text-sm"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
