"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal via-teal-dark to-lavender text-white py-24">
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-6xl font-bold mb-4"
        >
          Plan unforgettable days with your little one
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg sm:text-xl max-w-2xl mx-auto text-teal-50 mb-8"
        >
          Discover trusted baby and toddler classes, after-school clubs, and fun family experiences
          near you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button className="bg-white text-teal font-semibold hover:bg-teal-100">
            Browse local classes →
          </Button>
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-[url('/images/hero-texture.svg')] opacity-10" />
    </section>
  );
}
