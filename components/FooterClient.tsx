"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import Image from "next/image";
import LinkComponent from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { isBrowser } from "@/lib/env/isBrowser";
import { safeImage } from "@/lib/images";
import { getCurrentYear } from "@/lib/utils/date";

function normalizePath(path: string): string {
  return path.split("?")[0].split("#")[0];
}

function isLinkActive(pathname: string, href: string): boolean {
  const normalizedHref = normalizePath(href);
  const normalizedPathname = normalizePath(pathname);
  
  if (normalizedHref === "/") {
    return normalizedPathname === "/";
  }
  
  return normalizedPathname.startsWith(normalizedHref);
}

type FooterClientProps = {
  latestPosts: Array<{ title: string; slug: string }>;
};

export default function FooterClient({ latestPosts }: FooterClientProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const [showScroll, setShowScroll] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Only handle scroll-to-top button (client-side interactivity)
  useEffect(() => {
    if (!isBrowser()) return;
    const onScroll = () => setShowScroll(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    if (isBrowser()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer role="contentinfo" className="relative bg-charcoal py-12 px-6 text-cream md:px-12">
      <motion.div
        className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-3"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        whileInView={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: motionTokens.slow, ease: motionTokens.easeOut }}
        viewport={{ once: true }}
      >
        <div className="flex flex-col items-center space-y-3 text-center md:items-start md:text-left">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            whileInView={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: motionTokens.slow, ease: motionTokens.easeOut }}
          >
            {(() => {
              const { src, alt } = safeImage({ src: "/images/logo.png", alt: "Parent Helper logo" });
              return <Image src={src} alt={alt} width={120} height={48} className="h-12 w-auto" />;
            })()}
          </motion.div>
          <p className="max-w-sm text-small text-cream/70">
            Parent Helper is your companion for finding joyful family classes, guides, and warm community spaces near you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-card text-small md:grid-cols-4">
          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">Explore</h3>
            <ul className="space-y-1">
              <li>
                <LinkComponent 
                  href="/classes" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/classes") ? "page" : undefined}
                >
                  Classes
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/search" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/search") ? "page" : undefined}
                >
                  Search
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/about" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/about") ? "page" : undefined}
                >
                  About Us
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/contact" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/contact") ? "page" : undefined}
                >
                  Contact
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/referrals/info" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/referrals/info") ? "page" : undefined}
                >
                  Referral Program
                </LinkComponent>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">For Providers</h3>
            <ul className="space-y-1">
              <li>
                <LinkComponent 
                  href="/provider/(auth)/login" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/provider/(auth)/login") ? "page" : undefined}
                >
                  Login
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/providers/register" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/providers/register") ? "page" : undefined}
                >
                  Join Parent Helper
                </LinkComponent>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">Legal</h3>
            <ul className="space-y-1">
              <li>
                <LinkComponent 
                  href="/legal/terms" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/legal/terms") ? "page" : undefined}
                >
                  Terms of Service
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/legal/privacy" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/legal/privacy") ? "page" : undefined}
                >
                  Privacy Policy
                </LinkComponent>
              </li>
              <li>
                <LinkComponent 
                  href="/legal/cookies" 
                  className="transition-standard hover:text-sage"
                  aria-current={isLinkActive(currentPath, "/legal/cookies") ? "page" : undefined}
                >
                  Cookie Policy
                </LinkComponent>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">Journal</h3>
            <ul className="space-y-1">
              {latestPosts.length ? (
                latestPosts.map((item) => {
                  const blogHref = `/blog/${item.slug}`;
                  return (
                    <li key={item.slug}>
                      <LinkComponent 
                        href={blogHref} 
                        className="transition-standard hover:text-sage"
                        aria-current={isLinkActive(currentPath, blogHref) ? "page" : undefined}
                      >
                        {item.title}
                      </LinkComponent>
                    </li>
                  );
                })
              ) : (
                <li className="text-cream/60">Fresh stories arriving soon.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="mb-3 font-semibold text-cream/90">Stay in the loop</h3>
          <p className="text-small text-cream/70">
            Subscribe for curated updates, new classes, and parenting inspiration.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full flex-1 rounded-full px-4 py-2 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium bg-sage text-white transition-standard hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Subscribe
            </button>
          </form>
        </div>
      </motion.div>

      <div className="mt-10 flex flex-col items-center gap-2 border-t border-charcoal-darker pt-6 text-small text-cream/60 opacity-70 md:flex-row md:justify-between">
        <p>© {getCurrentYear()} Parent Helper. All rights reserved.</p>
        <div className="flex gap-4">
          <LinkComponent 
            href="/legal/privacy" 
            className="transition-colors hover:text-sage"
            aria-current={isLinkActive(currentPath, "/legal/privacy") ? "page" : undefined}
          >
            Privacy Policy
          </LinkComponent>
          <LinkComponent 
            href="/legal/terms" 
            className="transition-colors hover:text-sage"
            aria-current={isLinkActive(currentPath, "/legal/terms") ? "page" : undefined}
          >
            Terms of Service
          </LinkComponent>
          <LinkComponent 
            href="/legal/cookies" 
            className="transition-colors hover:text-sage"
            aria-current={isLinkActive(currentPath, "/legal/cookies") ? "page" : undefined}
          >
            Cookies
          </LinkComponent>
        </div>
      </div>

      {showScroll && (
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-small font-medium fixed bottom-6 right-6 bg-sage text-white shadow-md transition-standard hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </footer>
  );
}

