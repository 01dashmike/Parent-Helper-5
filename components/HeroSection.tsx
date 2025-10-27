"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import SearchBar from "@/components/SearchBar";
import { fadeInUp, staggerContainer } from "@/motion/variants";

const TAGLINES = [
  "Plan unforgettable days together",
  "Find trusted providers nearby",
  "Book inspiring local classes",
];

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const taglines = useMemo(() => TAGLINES, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = window.setInterval(() => {
      setIndex((value) => (value + 1) % taglines.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, taglines.length]);

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-teal via-teal-dark to-lavender px-6 py-16 text-white shadow-2xl shadow-teal-dark/40 sm:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-coral/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
        <motion.div
          variants={staggerContainer}
          className="flex w-full max-w-xl flex-col gap-8 text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              Parent Helper
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold leading-tight sm:text-5xl">
              Find Amazing Classes for Your Little Ones
            </h1>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.6, delay: 0.1 }}>
            {shouldReduceMotion ? (
              <span className="text-lg text-white/80">{taglines[0]}</span>
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="inline-block text-lg font-medium text-white"
                >
                  {taglines[index]}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/80"
          >
            <p>
              We hand-pick trusted providers across the UK so you can spend less time searching and
              more time making memories. Browse sensory play, STEM adventures, outdoor escapades,
              and more.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.6, delay: 0.25 }}>
            <div className="rounded-2xl bg-white p-4 shadow-2xl shadow-teal-dark/30 ring-1 ring-white/40">
              <SearchBar />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start lg:items-center"
          >
            <Link
              href="/classes"
              className="inline-flex items-center justify-center rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-coral/40 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-coral-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore classes
            </Link>
            <Link
              href="/providers"
              className="inline-flex items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Become a provider
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex w-full max-w-md flex-col items-center gap-6"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/90 p-4 shadow-2xl shadow-teal-dark/30 ring-1 ring-white/40">
            <Image
              src="/images/hero-illustration.png"
              alt="Family enjoying playful learning"
              width={480}
              height={340}
              priority
              className="h-auto w-full"
            />
          </div>
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex w-full flex-wrap justify-center gap-2 text-sm text-white/80"
          >
            {taglines.map((tagline) => (
              <span
                key={tagline}
                className="rounded-full bg-white/15 px-3 py-1 shadow-lg shadow-teal-dark/20"
              >
                {tagline}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
