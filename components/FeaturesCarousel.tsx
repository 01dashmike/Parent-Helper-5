"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { features } from "@/data/featuresData";
import { fadeUp } from "@/motion/variants";

export default function FeaturesCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const pausedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const node = carouselRef.current;
    if (!node) return;

    const SCROLL_RESET_THRESHOLD = 1;
    const PX_PER_MS = 0.045; // gentle drift (~2.7px per 60fps frame)

    const step = (timestamp: number) => {
      if (prevTimeRef.current === null) {
        prevTimeRef.current = timestamp;
      }

      const delta = timestamp - (prevTimeRef.current ?? timestamp);
      prevTimeRef.current = timestamp;

      if (!pausedRef.current) {
        node.scrollLeft += delta * PX_PER_MS;

        if (node.scrollLeft + node.clientWidth >= node.scrollWidth - SCROLL_RESET_THRESHOLD) {
          node.scrollLeft = 0;
        }
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    const pause = () => {
      pausedRef.current = true;
    };

    const resume = () => {
      pausedRef.current = false;
    };

    const resumeWithDelay = () => {
      pausedRef.current = true;
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
      resumeTimeoutRef.current = window.setTimeout(() => {
        pausedRef.current = false;
      }, 600);
    };

    frameRef.current = window.requestAnimationFrame(step);

    node.addEventListener("pointerdown", pause);
    node.addEventListener("pointerup", resumeWithDelay);
    node.addEventListener("pointerenter", pause);
    node.addEventListener("pointerleave", resume);
    node.addEventListener("touchstart", pause, { passive: true });
    node.addEventListener("touchend", resumeWithDelay, { passive: true });

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      prevTimeRef.current = null;
      node.removeEventListener("pointerdown", pause);
      node.removeEventListener("pointerup", resumeWithDelay);
      node.removeEventListener("pointerenter", pause);
      node.removeEventListener("pointerleave", resume);
      node.removeEventListener("touchstart", pause);
      node.removeEventListener("touchend", resumeWithDelay);
    };
  }, [shouldReduceMotion]);

  return (
    <motion.section
      className="space-y-6 rounded-3xl bg-brand-cream px-4 py-6 sm:px-8"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <header className="space-y-2 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="text-2xl font-bold text-brand-teal md:text-3xl"
        >
          What We’re Building
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
          className="text-sm text-brand-lavender leading-relaxed sm:text-base"
        >
          A colourful, curated directory designed to make family life easier and more joyful.
        </motion.p>
      </header>

      <div className="relative">
        <motion.div
          ref={carouselRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.35,
            duration: 0.45,
            ease: "easeOut",
          }}
          className="flex gap-4 overflow-x-auto scroll-snap-x mandatory px-4 py-2 hide-scrollbar"
        >
          {features.map(({ icon, title, description, link, gradient }) => {
            const card = (
              <motion.article
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                className={`min-w-[260px] snap-center rounded-2xl bg-gradient-to-b ${
                  gradient ?? "from-brand-cream via-white to-brand-sage/30"
                } p-5 shadow-md transition-shadow duration-300 hover:shadow-lg sm:min-w-[280px]`}
              >
                <div className="mb-4 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/80 shadow-inner">
                    <Image
                      src={icon}
                      alt={title}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                    />
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-brand-teal">{title}</h3>
                <p className="mt-2 text-sm text-brand-lavender">{description}</p>
              </motion.article>
            );

            if (link) {
              return (
                <Link
                  key={title}
                  href={link}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                >
                  {card}
                </Link>
              );
            }

            return (
              <div key={title} className="block">
                {card}
              </div>
            );
          })}
        </motion.div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-cream via-brand-cream/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-cream via-brand-cream/70 to-transparent" />
      </div>
    </motion.section>
  );
}
