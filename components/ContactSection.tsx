"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { fadeUp } from "@/motion/variants";

export default function ContactSection() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const sectionDuration = isMobile ? 0.5 : 0.6;
  const childDuration = isMobile ? 0.4 : 0.5;

  return (
    <motion.section
      initial={{
        opacity: shouldReduceMotion ? 1 : 0,
        y: shouldReduceMotion ? 0 : 40,
        backgroundColor: "rgba(255,255,255,0.9)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        backgroundColor: shouldReduceMotion ? "rgba(255,255,255,0.9)" : "rgba(236,227,245,0.6)",
      }}
      transition={{ duration: sectionDuration, ease: "easeOut" }}
      viewport={{ once: false, amount: 0.1 }}
      style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
      className="space-y-10 rounded-3xl bg-gradient-to-br from-brand-lavender/40 via-white to-brand-cream/80 p-8 shadow transition-colors duration-500 sm:p-10 lg:p-12"
    >
      <motion.header
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="space-y-2 text-center"
      >
        <h2 className="text-3xl font-semibold text-brand-teal sm:text-4xl">Get in Touch</h2>
        <p className="text-sm text-brand-midnight/80 sm:text-base">
          Be the first to know when we launch, or share your ideas with the Parent Helper team.
        </p>
      </motion.header>

      <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
        <motion.form
          className="flex flex-col gap-4 rounded-2xl bg-white/90 p-6 shadow sm:p-8"
          initial={shouldReduceMotion ? false : { opacity: 0, x: -30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: childDuration, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.1 }}
          style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
        >
          <label className="sr-only" htmlFor="contact-name">
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            placeholder="Your name"
            className="w-full rounded-xl border border-brand-teal/20 px-4 py-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            required
          />
          <label className="sr-only" htmlFor="contact-email">
            Your email address
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            placeholder="Your email address"
            className="w-full rounded-xl border border-brand-teal/20 px-4 py-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            required
          />
          <label className="sr-only" htmlFor="contact-type">
            Message type
          </label>
          <select
            id="contact-type"
            name="type"
            className="w-full rounded-xl border border-brand-teal/20 px-4 py-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            required
          >
            <option value="">Select message type</option>
            <option value="early-access">Early Access Notification</option>
            <option value="provider">I&rsquo;m an Activity Provider</option>
            <option value="question">General Question</option>
            <option value="suggestion">Suggestion</option>
          </select>
          <label className="sr-only" htmlFor="contact-message">
            Your message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            placeholder="Your message (optional)"
            className="w-full rounded-xl border border-brand-teal/20 px-4 py-3 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          />
          <motion.button
            type="submit"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300 }}
            className="rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Send Message
          </motion.button>
        </motion.form>

        <motion.div
          className="flex flex-col justify-between gap-6 rounded-2xl bg-white/70 p-6 text-sm text-brand-midnight shadow sm:p-8"
          initial={shouldReduceMotion ? false : { opacity: 0, x: 30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: childDuration, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.1 }}
          style={shouldReduceMotion ? undefined : { willChange: "transform, opacity" }}
        >
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-teal">For Activity Providers</h3>
            <p className="text-brand-midnight/80">
              Want to list your classes or services? We&rsquo;d love to feature quality providers on
              our platform.
            </p>
            <a
              href="mailto:notification@parenthelper.co.uk"
              className="font-medium text-brand-coral hover:text-brand-teal"
            >
              notification@parenthelper.co.uk
            </a>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-teal">For Parents</h3>
            <p className="text-brand-midnight/80">
              Have questions, suggestions, or want early access? We&rsquo;d love to hear from you!
            </p>
            <p className="text-brand-midnight/60">
              Use the form and we&rsquo;ll respond within 24 hours.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
