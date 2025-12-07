"use client";

import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.slow, ease: motionTokens.easeOut }}
      className="flex flex-col items-center justify-center rounded-3xl border border-sage/20 bg-white px-8 py-14 text-center shadow-soft"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-4 text-display-1"
          aria-hidden="true"
        >
          {icon}
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-title font-semibold text-charcoal"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 max-w-xl text-small text-slateSoft"
      >
        {description}
      </motion.p>
      {actionLabel && actionHref && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Link
            href={actionHref}
            className="inline-flex items-center rounded-full bg-sage px-5 py-2 text-small font-semibold text-white shadow-soft transition-all duration-200 hover:bg-sage-darker hover:shadow-md hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:ring-offset-2"
          >
            {actionLabel}
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}


