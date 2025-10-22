"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPinned, Sparkles, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import SearchBar from "@/components/SearchBar";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { fadeIn, fadeUp } from "@/motion/variants";

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
  const taglines = useMemo(
    () => [
      "Discover classes, clubs, and experiences for every stage of family life.",
      "Find fun, trusted activities for parents, babies, and toddlers.",
    ],
    []
  );
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = window.setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, taglines.length]);

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeIn}
      className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-b from-brand-cream to-brand-sage/15 px-6 py-10 shadow-sm sm:mt-10 sm:px-8 sm:py-14 md:mt-12 lg:py-16"
    >
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
        <div className="space-y-4 px-2 sm:px-0">
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: headingDuration, ease: "easeOut" }}
            style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
            className="text-3xl font-bold tracking-tight text-brand-teal sm:text-4xl lg:text-5xl"
          >
            Discover the <span className="text-brand-coral">Best Family Activities</span> Near You
          </motion.h1>
          <div className="h-12 text-sm text-brand-midnight sm:text-base lg:text-lg">
            {shouldReduceMotion ? (
              <p>Discover classes, clubs, and experiences for every stage of family life.</p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={taglineIndex}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="inline-block"
                >
                  {taglines[taglineIndex]}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
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
        <AnimatePresence>
          {!isMobile && (
            <motion.div
              key="hero-visual"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="relative mt-6 flex w-full justify-center"
            >
              <Image
                src="/images/hero-illustration.png"
                alt="Family illustration"
                width={640}
                height={360}
                className="h-auto w-full max-w-2xl object-contain"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
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
              className="flex items-center justify-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs text-brand-midnight shadow-sm sm:px-4 sm:text-sm"
            >
              <Icon className="h-4 w-4 text-brand-teal" aria-hidden="true" />
              <span>{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
