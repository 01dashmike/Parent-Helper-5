"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Compass, Sparkles, Users } from "lucide-react";

import { fadeUp } from "@/motion/variants";

const STEPS = [
  {
    icon: Compass,
    title: "Search",
    description: "Find activities nearby with tailored filters and trusted listings.",
  },
  {
    icon: Sparkles,
    title: "Discover",
    description: "Explore verified providers and curated experiences for every stage.",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Join the community and enjoy memorable moments together.",
  },
];

export default function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{ backgroundColor: "#FCFAF6" }}
      whileInView={{ backgroundColor: "#F5F9F6" }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" }}
      className="rounded-3xl bg-brand-cream px-4 py-12 sm:px-8"
    >
      <motion.header
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="text-3xl font-semibold text-brand-teal sm:text-4xl">How It Works</h2>
        <p className="mt-3 text-sm text-brand-midnight/80 sm:text-base">
          Three simple steps to discover and enjoy family-friendly experiences.
        </p>
      </motion.header>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <motion.article
            key={title}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: shouldReduceMotion ? 0 : index * 0.1 }}
            className={`flex h-full flex-col gap-4 rounded-2xl p-6 shadow transition-shadow duration-300 ease-out hover:shadow-lg ${
              index % 2 === 0 ? "bg-white" : "bg-brand-sage/20"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-sage/70 text-brand-teal">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-brand-teal">{title}</h3>
            <p className="text-sm text-brand-midnight/80">{description}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
