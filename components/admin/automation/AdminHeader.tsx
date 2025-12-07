"use client";

import { motion } from "framer-motion";

export default function AdminHeader({ title }: { title: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-display-2 font-bold text-charcoal">{title}</h1>
      <p className="mt-2 text-small text-slateSoft">
        Monitor growth metrics, automate reports, and get AI-powered insights
      </p>
    </motion.header>
  );
}

