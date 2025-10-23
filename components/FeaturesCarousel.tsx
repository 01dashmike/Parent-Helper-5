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

  useEffect(() => {
    if (shouldReduceMotion) return;

    const element = carouselRef.current;
    if (!element) return;

    const delayTimeout = window.setTimeout(() => {
      if (!carouselRef.current) return;
      let scrollX = carouselRef.current.scrollLeft;
      const tick = window.setInterval(() => {
        const el = carouselRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        scrollX = el.scrollLeft + 1;
        if (scrollX >= maxScroll) {
          scrollX = 0;
        }
        el.scrollTo({ left: scrollX, behavior: "smooth" });
      }, 50);

      const stop = () => window.clearInterval(tick);
      element.addEventListener("pointerdown", stop, { once: true });
    }, 1500);

    return () => {
      window.clearTimeout(delayTimeout);
    };
  }, [shouldReduceMotion]);

  return (
    <motion.section
      className="space-y-8 rounded-3xl bg-gradient-to-b from-brand-cream to-brand-sage/10 px-4 py-10 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <header className="space-y-2 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="text-3xl font-semibold text-brand-teal sm:text-4xl"
        >
          What We’re Building
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
          className="text-sm text-brand-midnight/80 sm:text-base"
        >
          A colourful, curated directory designed to make family life easier and more joyful.
        </motion.p>
      </header>

      <motion.div
        ref={carouselRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
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
              } p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:min-w-[280px]`}
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
              <p className="mt-2 text-sm text-brand-midnight/80">{description}</p>
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
    </motion.section>
  );
}
