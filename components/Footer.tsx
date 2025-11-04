"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { hasSupabaseBrowserEnv, supabaseBrowser } from "@/lib/supabase";

export default function Footer() {
  const [showScroll, setShowScroll] = useState(false);
  const [latestPosts, setLatestPosts] = useState<Array<{ title: string; slug: string }>>([]);

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasSupabaseBrowserEnv()) return;
    const supabase = supabaseBrowser();
    let isMounted = true;

    (async () => {
      try {
        const { data } = await supabase
          .from("blog_posts_ai")
          .select("title,slug")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3);
        if (isMounted && Array.isArray(data)) {
          setLatestPosts(data as Array<{ title: string; slug: string }>);
        }
      } catch (error) {
        console.info("Supabase footer fetch skipped", error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-charcoal py-12 px-6 text-cream md:px-12">
      <motion.div
        className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div className="flex flex-col items-center space-y-3 text-center md:items-start md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Image src="/images/logo.png" alt="Parent Helper logo" width={120} height={48} className="h-12 w-auto" />
          </motion.div>
          <p className="max-w-sm text-sm text-cream/70">
            Parent Helper is your companion for finding joyful family classes, guides, and warm community spaces near you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">Explore</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/classes" className="transition-colors hover:text-sage">
                  Classes
                </Link>
              </li>
              <li>
                <Link href="/search" className="transition-colors hover:text-sage">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-sage">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-sage">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">For Providers</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/providers/login" className="transition-colors hover:text-sage">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/providers/register" className="transition-colors hover:text-sage">
                  Join Parent Helper
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-semibold text-cream/90">Journal</h3>
            <ul className="space-y-1">
              {latestPosts.length ? (
                latestPosts.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/blog/${item.slug}`} className="transition-colors hover:text-sage">
                      {item.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-cream/60">Fresh stories arriving soon.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="mb-3 font-semibold text-cream/90">Stay in the loop</h3>
          <p className="text-sm text-cream/70">
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
              className="rounded-full bg-sage px-6 py-2 font-medium text-white transition-all hover:bg-sage/90 hover:text-[#C97C5C]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </motion.div>

      <div className="mt-10 flex flex-col items-center gap-2 border-t border-[#444] pt-6 text-xs text-cream/60 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Parent Helper. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="transition-colors hover:text-sage">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-sage">
            Terms of Use
          </Link>
        </div>
      </div>

      {showScroll && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full bg-sage p-3 text-white shadow-md transition-all hover:bg-sage/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </footer>
  );
}
