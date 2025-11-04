"use client";

import { motion } from "framer-motion";
import SearchFields from "@/components/SearchFields";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center py-8 md:py-10 space-y-4 md:space-y-6">
      <motion.h1
        className="text-3xl md:text-4xl font-semibold text-charcoal leading-tight tracking-tight max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Find baby and toddler classes near you
      </motion.h1>

      <motion.div
        className="mt-4 md:mt-6 flex justify-center w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      >
        <SearchFields />
      </motion.div>
    </section>
  );
}
