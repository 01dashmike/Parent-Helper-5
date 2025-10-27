"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { mockResults } from "@/data/mockResults";
import { fadeInUp, staggerContainer } from "@/motion/variants";

const FEATURED = mockResults.slice(0, 6);

export default function FeaturedClasses() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-0">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-8"
      >
        <motion.header variants={fadeInUp} className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-dark">
            Featured classes
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Curated experiences loved by local families
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Hand-picked highlights from our top providers this week across Winchester, London, and
            Manchester.
          </p>
        </motion.header>

        <motion.div
          variants={fadeInUp}
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {FEATURED.map((item) => (
            <motion.article
              key={item.id}
              variants={fadeInUp}
              whileHover={{ translateY: -6, rotateX: 0.5 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-teal/10 ring-1 ring-teal/10"
            >
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-teal/20 via-cream to-lavender/20">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1280px) 360px, (min-width: 768px) 280px, 100vw"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-dark shadow">
                  {item.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-sm text-slate-500">
                  <span>{item.distanceKm} km away</span>
                  <Link
                    href={`/classes/${item.id}`}
                    className="font-semibold text-coral transition-colors duration-200 hover:text-coral-dark"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
