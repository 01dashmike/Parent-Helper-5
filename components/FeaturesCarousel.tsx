"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { features } from "@/data/featuresData";
import { useIsMobile } from "@/hooks/useMediaQuery";

export default function FeaturesCarousel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateBounds = () => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (!wrapper || !track) return;
      const maxDrag = Math.max(0, track.scrollWidth - wrapper.clientWidth);
      setDragBounds({ left: -maxDrag, right: 0 });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let direction = 1;
    const interval = window.setInterval(() => {
      const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      if (wrapper.scrollLeft >= maxScroll - 16) {
        direction = -1;
      } else if (wrapper.scrollLeft <= 16) {
        direction = 1;
      }

      wrapper.scrollTo({ left: wrapper.scrollLeft + direction * 140, behavior: "smooth" });
    }, 6000);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  const cardTransition = useMemo(
    () => ({ duration: isMobile ? 0.4 : 0.55, ease: "easeOut" as const }),
    [isMobile]
  );

  return (
    <section className="space-y-8">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold text-brand-teal sm:text-4xl">What We’re Building</h2>
        <p className="text-sm text-brand-teal/70 sm:text-base">
          A colourful, curated directory designed to make family life easier and more joyful.
        </p>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-cream to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-cream to-transparent" />

        <div ref={wrapperRef} className="overflow-hidden">
          <motion.div
            ref={trackRef}
            drag={shouldReduceMotion ? false : "x"}
            dragConstraints={dragBounds}
            dragElastic={0.08}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 py-2 hide-scrollbar"
            style={{ cursor: shouldReduceMotion ? "auto" : "grab" }}
            whileTap={shouldReduceMotion ? undefined : { cursor: "grabbing" }}
          >
            {features.map(({ icon, title, description, link, gradient }) => {
              const card = (
                <motion.article
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.02 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={cardTransition}
                  style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
                  className={`min-w-[260px] snap-center rounded-2xl bg-gradient-to-b ${
                    gradient ?? "from-brand-cream via-white to-brand-sage/50"
                  } p-5 shadow-md sm:min-w-[280px]`}
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
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
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
        </div>
      </div>
    </section>
  );
}
