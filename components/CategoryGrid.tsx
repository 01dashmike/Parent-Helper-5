"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { fadeInUp, staggerContainer } from "@/motion/variants";

const CATEGORIES = [
  {
    name: "Baby & Toddler",
    description: "Sensory sessions, music play, and bonding experiences for 0–3 years.",
    href: "/search?category=baby",
  },
  {
    name: "Creative & Art",
    description: "Mess-friendly art, dance, and drama workshops that spark imagination.",
    href: "/search?category=creative",
  },
  {
    name: "STEM & Coding",
    description: "Hands-on science labs and coding clubs for curious minds.",
    href: "/search?category=stem",
  },
  {
    name: "Outdoor & Adventure",
    description: "Forest school, nature trails, and active clubs for every season.",
    href: "/search?category=outdoor",
  },
  {
    name: "Wellbeing",
    description: "Yoga, mindfulness, and confidence-building sessions for families.",
    href: "/search?category=wellbeing",
  },
  {
    name: "Support & Meetups",
    description: "Parent meetups, workshops, and community-led drop-ins.",
    href: "/search?category=support",
  },
];

export default function CategoryGrid() {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6 lg:px-0">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-8"
      >
        <motion.header variants={fadeInUp} className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-dark">
            Explore by interest
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Find the perfect class for every milestone
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Browse popular categories curated from our Parent Helper community and book directly with
            trusted providers.
          </p>
        </motion.header>

        <motion.div
          variants={fadeInUp}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {CATEGORIES.map((category) => (
            <motion.div
              key={category.name}
              variants={fadeInUp}
              whileHover={{ translateY: -4 }}
              className="group rounded-3xl border border-teal/10 bg-white p-6 shadow-md shadow-teal/10 transition-colors duration-300 hover:border-teal hover:bg-teal/5"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-teal-dark">{category.name}</h3>
                <p className="text-sm text-slate-600">{category.description}</p>
                <Link
                  href={category.href}
                  className="inline-flex items-center text-sm font-semibold text-coral transition-colors duration-200 group-hover:text-coral-dark"
                >
                  Discover classes →
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
