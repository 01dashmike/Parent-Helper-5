"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

type NavItem = {
  label: string;
  href: string;
  dropdown?: Array<{ label: string; href: string }>;
  newsletter?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Explore classes", href: "/search" },
  {
    label: "Resources",
    href: "/resources",
    dropdown: [
      { label: "Blog", href: "/blog" },
      { label: "Parent Guides", href: "/parent-guides" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  { label: "About Us", href: "/about" },
  { label: "Newsletter", href: "#newsletter", newsletter: true },
  { label: "Contact", href: "/contact" },
];

const ProviderLogin = {
  label: "Provider Login",
  href: "/providers/login",
};

function normalizePath(path: string) {
  return path.split("?")[0].split("#")[0];
}

function isActive(pathname: string, item: NavItem) {
  const basePath = normalizePath(item.href);
  if (basePath === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(basePath);
}

function isDropdownActive(pathname: string, dropdown?: NavItem["dropdown"]) {
  if (!dropdown) return false;
  return dropdown.some((entry) => pathname.startsWith(normalizePath(entry.href)));
}

export default function Header() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const handleDesktopEnter = (label: string) => {
    clearCloseTimeout();
    setHoveredDropdown(label);
  };

  const handleDesktopLeave = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setHoveredDropdown(null), 200);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearCloseTimeout();
    };
  }, []);

  const headerClasses = scrolled
    ? "bg-white shadow-md border-[#DAD7D0]"
    : "bg-[#E7E5E0] border-[#DAD7D0]";

  const activeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    NAV_ITEMS.forEach((item) => {
      if (item.newsletter) {
        map.set(item.label, false);
        return;
      }
      map.set(
        item.label,
        isActive(currentPath, item) || isDropdownActive(currentPath, item.dropdown)
      );
    });
    return map;
  }, [currentPath]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [currentPath]);

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((prev) => {
      const next = prev === label ? null : label;
      setHoveredDropdown(next);
      clearCloseTimeout();
      return next;
    });
  };

  const handleNewsletterClick = (
    event?: MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    closeMenu = false,
  ) => {
    event?.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("newsletter:open", { detail: { source: "header" } }));
    }

    if (closeMenu) {
      setMobileOpen(false);
      setOpenDropdown(null);
    }
  };

  return (
    <motion.header
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 ${headerClasses}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="section flex items-center justify-between gap-4 px-4 py-3 md:py-4">
        {/* Left: Logo */}
        <Link href="/" aria-label="Parent Helper home" className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -2 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="cursor-pointer"
          >
            <Image
              src="/images/logo.png"
              alt="Parent Helper"
              width={80}
              height={80}
              priority
              className="h-12 w-auto transition-transform duration-300 md:h-14"
            />
          </motion.div>
        </Link>

        {/* Center navigation */}
        <nav className="ml-4 hidden items-center gap-6 md:ml-10 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = activeMap.get(item.label);
            const hasDropdown = Boolean(item.dropdown);

            if (item.newsletter) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(event) => handleNewsletterClick(event)}
                  className="text-sm text-charcoal/80 transition-colors hover:text-sage"
                >
                  {item.label}
                </button>
              );
            }

            const isDropdownOpen = hoveredDropdown === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={hasDropdown ? () => handleDesktopEnter(item.label) : undefined}
                onMouseLeave={hasDropdown ? handleDesktopLeave : undefined}
              >
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1 text-sm transition-colors ${
                    active
                      ? "font-semibold text-sage"
                      : "text-charcoal/80 hover:text-sage"
                  }`}
                >
                  {item.label}
                  {hasDropdown && (
                    <svg
                      aria-hidden
                      viewBox="0 0 12 12"
                      className="h-3 w-3 text-current"
                    >
                      <path
                        d="M2 4.5L6 8l4-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Link>

                {hasDropdown && item.dropdown && (
                  <motion.div
                    className="absolute left-1/2 top-full z-40 mt-3 w-52 -translate-x-1/2"
                    initial={{ opacity: 0, y: 8, pointerEvents: "none" }}
                    animate={isDropdownOpen ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: 8, pointerEvents: "none" }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => handleDesktopEnter(item.label)}
                    onMouseLeave={handleDesktopLeave}
                  >
                    <div className="overflow-hidden rounded-xl border border-sage/25 bg-cream py-2 shadow-lg">
                      {item.dropdown.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2 text-sm text-charcoal/80 transition-colors hover:bg-sage/10 hover:text-sage"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href={ProviderLogin.href}
            className="hidden items-center rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sage/90 hover:text-[#C97C5C] md:inline-flex"
          >
            {ProviderLogin.label}
          </Link>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-sage/40 bg-white text-charcoal transition-colors hover:border-sage md:hidden"
            onClick={toggleMobile}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                <path
                  d="M4 6h12M4 10h12M4 14h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="section pb-5">
            <div className="rounded-2xl border border-sage/30 bg-cream/95 p-4 shadow-lg">
              {NAV_ITEMS.map((item) => {
                const hasDropdown = Boolean(item.dropdown);
                const active = activeMap.get(item.label);

                if (item.newsletter) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={(event) => handleNewsletterClick(event, true)}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm text-charcoal/80 transition-colors hover:bg-sage/10 hover:text-sage"
                    >
                      {item.label}
                    </button>
                  );
                }

                if (!hasDropdown || !item.dropdown) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                        active
                          ? "font-semibold text-sage"
                          : "text-charcoal/80 hover:bg-sage/10 hover:text-sage"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                const isOpen = openDropdown === item.label;

                return (
                  <div key={item.label} className="border-t border-sage/10 first:border-t-0">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors ${
                        active
                          ? "font-semibold text-sage"
                          : "text-charcoal/80 hover:text-sage"
                      }`}
                      onClick={() => handleDropdownToggle(item.label)}
                    >
                      <span>{item.label}</span>
                      <svg
                        aria-hidden
                        viewBox="0 0 12 12"
                        className={`h-3 w-3 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M2 4.5L6 8l4-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="space-y-2 pb-3 pl-6">
                        {item.dropdown.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block rounded-lg px-3 py-2 text-sm text-charcoal/80 transition-colors hover:bg-sage/10 hover:text-sage"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-4">
                <Link
                  href={ProviderLogin.href}
                  className="inline-flex w-full items-center justify-center rounded-full bg-sage px-4 py-2 text-sm font-medium text-white transition hover:bg-sage/90 hover:text-[#C97C5C]"
                >
                  {ProviderLogin.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
