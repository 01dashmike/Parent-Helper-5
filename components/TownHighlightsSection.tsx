"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { fadeInUp, staggerContainer } from "@/motion/variants";

const TOWNS = [
  {
    name: "London",
    blurb:
      "Creative adventures across every borough with sensory play, STEM labs, and story sessions.",
    tags: ["Creative Clubs", "STEM Labs", "Weekend Fun"],
    href: "/classes/london",
  },
  {
    name: "Manchester",
    blurb:
      "Community-led hubs for music, movement, and outdoor explorations in the heart of the city.",
    tags: ["Music & Movement", "Forest Play", "Parent Meetups"],
    href: "/classes/manchester",
  },
  {
    name: "Bristol",
    blurb: "Harbourside hideouts and eco-minded classes designed for curious little explorers.",
    tags: ["Eco Adventures", "Harbourside", "Art & Makers"],
    href: "/classes/bristol",
  },
];

export default function TownHighlightsSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="container mx-auto px-6 py-16"
    >
      <motion.div variants={fadeInUp} className="mx-auto mb-12 max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-500">
          Top Town Highlights
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          Where families are booking this week
        </h2>
        <p className="mt-4 text-base text-slate-600">
          Discover the hotspots families love right now and bookmark your next adventure in London,
          Manchester, or Bristol.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {TOWNS.map((town) => (
          <motion.div
            key={town.name}
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="rounded-2xl bg-white shadow-lg shadow-blue-900/10 ring-1 ring-slate-100 dark:bg-gray-800"
          >
            <div className="flex h-full flex-col gap-6 p-6">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {town.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                  {town.blurb}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {town.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={town.href}
                className="mt-auto inline-flex items-center text-sm font-semibold text-blue-600 hover:text-indigo-600"
              >
                Browse classes in {town.name} →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
