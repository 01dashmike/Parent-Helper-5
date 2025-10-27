"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const NAVIGATION: Array<{ name: string; href: string; variant?: "button" }> = [
  { name: "Browse Classes", href: "/classes" },
  { name: "Providers", href: "/providers" },
  { name: "Join Now", href: "/join", variant: "button" },
];

const SCROLL_THRESHOLD = 40;
const HIDE_THRESHOLD = 80;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;

    const handleScroll = () => {
      if (typeof window === "undefined") return;
      const currentY = window.scrollY;
      setHasScrolled(currentY > SCROLL_THRESHOLD);

      if (!shouldReduceMotion) {
        if (currentY > lastY + 10 && currentY > HIDE_THRESHOLD) {
          setIsHidden(true);
        } else if (currentY < lastY - 10 || currentY <= HIDE_THRESHOLD) {
          setIsHidden(false);
        }
      }

      lastY = currentY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (menuOpen) setIsHidden(false);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  const headerVariants = useMemo<Variants>(
    () => ({
      visible: {
        y: 0,
        transition: shouldReduceMotion
          ? { type: "tween" as const, duration: 0.2 }
          : { type: "spring" as const, stiffness: 260, damping: 28 },
      },
      hidden: {
        y: shouldReduceMotion ? -88 : -120,
        transition: { duration: 0.3, ease: "easeInOut" },
      },
    }),
    [shouldReduceMotion]
  );

  const hoverMotionProps = shouldReduceMotion
    ? {}
    : {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: "spring" as const, stiffness: 320, damping: 20 },
      };

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-overlay"
            className="fixed inset-0 z-40 bg-brand-cream/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.header
        variants={headerVariants}
        initial="visible"
        animate={isHidden ? "hidden" : "visible"}
        className={clsx(
          "fixed inset-x-0 top-0 z-50 border-b border-teal-100 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300",
          hasScrolled ? "shadow-md" : "shadow-sm"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="px-4 py-4 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
            <Link href="/" className="group">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center space-x-2"
              >
                <Image
                  src="/LOGO_1749921006982.png"
                  alt="Parent Helper"
                  width={140}
                  height={40}
                  priority
                  className="h-10 object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105"
                />
                <span className="text-teal-dark text-lg font-semibold tracking-tight">
                  Parent Helper
                </span>
              </motion.div>
            </Link>

            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="ml-auto hidden items-center gap-6 font-medium text-teal-dark md:flex"
            >
              {NAVIGATION.map(({ name, href, variant }) =>
                variant === "button" ? (
                  <Link
                    key={name}
                    href={href}
                    className="inline-flex items-center rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-coral/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-coral-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
                  >
                    {name}
                  </Link>
                ) : (
                  <Link
                    key={name}
                    href={href}
                    className="relative text-sm leading-none text-teal-dark/80 transition-colors duration-300 hover:text-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  >
                    {name}
                  </Link>
                )
              )}
            </motion.nav>

            <motion.button
              type="button"
              onClick={toggleMenu}
              className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-teal-dark transition-colors duration-300 hover:text-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              {...hoverMotionProps}
            >
              {menuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute left-0 right-0 top-full z-50 border-t border-teal-100 bg-white shadow-md md:hidden"
            >
              <nav className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-teal-dark">
                {NAVIGATION.map(({ name, href, variant }) => (
                  <Link
                    key={name}
                    href={href}
                    onClick={closeMenu}
                    className={clsx(
                      "w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:w-3/4",
                      variant === "button"
                        ? "bg-coral text-white shadow-md hover:bg-coral-dark"
                        : "hover:bg-teal-light/20 hover:text-teal-dark"
                    )}
                  >
                    {name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
