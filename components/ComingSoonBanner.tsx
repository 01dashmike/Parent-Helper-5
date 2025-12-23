"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function ComingSoonBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto mb-4 max-w-4xl px-4"
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-lg border border-sage/30 bg-sage/10 px-4 py-3 text-center text-sm text-charcoal md:px-6 md:py-4 md:text-base">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle
            className="h-5 w-5 shrink-0 text-sage md:h-6 md:w-6"
            aria-hidden="true"
          />
          <p className="font-medium">
            Coming soon! We are busy building this function, please explore the rest of the working features.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
