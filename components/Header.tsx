'use client';

import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const NAVIGATION: Array<{ name: string; href: string; variant?: 'button' }> = [
  { name: 'Home', href: '/' },
  { name: 'Classes', href: '/classes' },
  { name: 'Clubs', href: '/clubs' },
  { name: 'Support', href: '/support' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
  { name: 'Add Listing', href: '/list-class', variant: 'button' },
];

const SCROLL_THRESHOLD = 40;
const HIDE_THRESHOLD = 80;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
          ? { type: 'tween' as const, duration: 0.2 }
          : { type: 'spring' as const, stiffness: 260, damping: 28 },
      },
      hidden: {
        y: shouldReduceMotion ? -88 : -120,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    }),
    [shouldReduceMotion],
  );

  const hoverMotionProps = shouldReduceMotion
    ? {}
    : {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: 'spring' as const, stiffness: 320, damping: 20 },
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.header
        variants={headerVariants}
        initial="visible"
        animate={isHidden ? 'hidden' : 'visible'}
        className={clsx(
          'sticky top-0 z-50 w-full transition-colors duration-300',
          hasScrolled ? 'bg-brand-cream/95 shadow-md backdrop-blur-md' : 'bg-transparent',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/LOGO_1749921006982.png"
                alt="Parent Helper logo"
                width={48}
                height={48}
                priority
                className="h-10 w-auto object-contain sm:h-12"
              />
              <span className="text-2xl font-semibold tracking-tight text-brand-teal">Parent Helper</span>
            </Link>

            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="ml-auto hidden items-center gap-6 font-medium text-brand-teal md:flex"
            >
              {NAVIGATION.map(({ name, href, variant }) =>
                variant === 'button' ? (
                  <Link
                    key={name}
                    href={href}
                    className="inline-flex items-center rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  >
                    {name}
                  </Link>
                ) : (
                  <Link
                    key={name}
                    href={href}
                    className="relative transition-colors duration-300 hover:text-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  >
                    {name}
                  </Link>
                ),
              )}
            </motion.nav>

            <motion.button
              type="button"
              onClick={toggleMenu}
              className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-brand-teal transition-colors duration-300 hover:text-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              {...hoverMotionProps}
            >
              {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full z-50 border-t border-brand-sage/40 bg-brand-cream/95 shadow-lg md:hidden"
            >
              <nav className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-brand-teal">
                {NAVIGATION.map(({ name, href, variant }) => (
                  <Link
                    key={name}
                    href={href}
                    onClick={closeMenu}
                    className={clsx(
                      'w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal sm:w-3/4',
                      variant === 'button'
                        ? 'bg-brand-teal text-white shadow-md hover:bg-brand-coral'
                        : 'hover:bg-brand-sage/30 hover:text-brand-coral',
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
