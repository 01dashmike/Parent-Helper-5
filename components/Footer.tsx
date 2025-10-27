"use client";

import { motion, useInView } from "framer-motion";
import { Facebook, Instagram, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import { fadeInUp, staggerContainer } from "@/motion/variants";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Footer() {
  const containerRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    try {
      setStatus("loading");
      setMessage(null);

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Unable to subscribe right now.");
      }

      setStatus("success");
      setMessage("Thanks for subscribing! Please check your inbox to confirm.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Try again?");
    }
  };

  return (
    <motion.footer
      ref={containerRef}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      className="mt-20 bg-gray-950 text-gray-300"
    >
      <div className="container mx-auto flex flex-col gap-12 px-6 py-16 sm:px-8 lg:px-10">
        <motion.div variants={fadeInUp} className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
                Parent Helper
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Stay connected with the Parent Helper family
              </h2>
              <p className="mt-4 max-w-md text-sm text-gray-400 sm:text-base">
                Weekly inspiration, provider spotlights, and exclusive beta invites direct to your
                inbox. Join other parents discovering the best experiences across the UK.
              </p>
            </div>

            <div className="flex gap-4">
              <Link
                href="https://instagram.com"
                aria-label="Parent Helper on Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-300 transition-colors hover:border-blue-500 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="https://facebook.com"
                aria-label="Parent Helper on Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-300 transition-colors hover:border-blue-500 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <motion.div
            variants={fadeInUp}
            className="rounded-3xl bg-gray-900 p-6 shadow-lg shadow-blue-900/20 ring-1 ring-gray-800"
          >
            <h3 className="text-lg font-semibold text-white">Supabase Newsletter</h3>
            <p className="mt-2 text-sm text-gray-400">
              Be first to know about product launches, community events, and featured providers.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label
                className="block text-xs font-medium uppercase tracking-[0.2em] text-gray-500"
                htmlFor="footer-email"
              >
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 shadow-inner placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <motion.button
                type="submit"
                disabled={status === "loading"}
                whileHover={{ scale: status === "loading" ? 1 : 1.02 }}
                whileTap={{ scale: status === "loading" ? 1 : 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-opacity duration-300 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </motion.button>
            </form>
            {message ? (
              <p
                role={status === "error" ? "alert" : "status"}
                className={`mt-3 text-sm ${status === "error" ? "text-rose-400" : "text-emerald-400"}`}
              >
                {message}
              </p>
            ) : null}
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col gap-4 border-t border-gray-800 pt-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>&copy; {new Date().getFullYear()} Parent Helper. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="transition-colors hover:text-gray-300">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/contact" className="transition-colors hover:text-gray-300">
              Contact
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
