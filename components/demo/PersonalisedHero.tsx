"use client";

import { motion } from "framer-motion";

interface PersonalisedHeroProps {
  household: string;
  postcode: string;
}

export default function PersonalisedHero({ household, postcode }: PersonalisedHeroProps) {
  // Simulate weather (in production, fetch from weather API)
  const weatherEmoji = "🌤";
  const temperature = "10";
  const location = postcode.startsWith("SW") ? "Clapham" : "Manchester";
  const weatherMessage = "perfect for outdoor play today!";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-sage/20 bg-gradient-to-br from-white to-cream/30 p-6 shadow-sm"
    >
      <h2 className="text-title text-charcoal">{household}</h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-small text-slateSoft"
      >
        {weatherEmoji} {temperature} °C in {location} — {weatherMessage}
      </motion.p>
    </motion.div>
  );
}

