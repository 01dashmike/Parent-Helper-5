"use client";

import { useState, useRef, useEffect, useMemo, type MouseEvent, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { safeImage } from "@/lib/images";
import LinkComponent from "@/components/ui/link";
import { IconButton } from "@/components/ui/buttons";
import { Button } from "@/components/ui/button";
import { ChevronDown, Close, Menu as MenuIcon } from "@/components/icons";
import { iconSize } from "@/lib/icons/tokens";

type NavItem = {
  label: string;
  href: string;
  dropdown?: Array<{ label: string; href: string }>;
  newsletter?: boolean;
};

const WELLNESS_ENABLED =
  process.env.NEXT_PUBLIC_WELLNESS_ENABLED !== "false";

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
  ...(WELLNESS_ENABLED
    ? [
      {
        label: "Health & Wellness",
        href: "/wellness",
        dropdown: [
          { label: "Mum", href: "/wellness/mum" },
          { label: "Dad", href: "/wellness/dad" },
          { label: "Family", href: "/wellness/family" },
          { label: "Grandparents", href: "/wellness/grandparents" },
        ],
      },
    ]
    : []),
  { label: "About Us", href: "/about" },
  { label: "Newsletter", href: "#newsletter", newsletter: true },
  { label: "Contact", href: "/contact" },
];

const ProviderLogin = {
  label: "Provider Login",
  href: "/provider/login",
};

const SHOW_ADMIN_LINK =
  process.env.NEXT_PUBLIC_SHOW_ADMIN_LINK === "true" ||
  process.env.NODE_ENV === "development";

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
  const prefersReducedMotion = useReducedMotion();

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
    if (typeof window === "undefined") return; // Keep direct check for Header since it's already client-only

    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearCloseTimeout();
    };
  }, []);

  const headerClasses = scrolled
    ? "bg-white shadow-md border-border-light"
    : "bg-cream-light border-border-light";

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
      // Keep direct check here since Header is already client-only
      window.dispatchEvent(new CustomEvent("newsletter:open", { detail: { source: "header" } }));
    }

    if (closeMenu) {
      setMobileOpen(false);
      setOpenDropdown(null);
    }
  };

  return (
    <motion.header
      className={cn("fixed top-0 z-50 w-full border-b backdrop-blur-md transition-slow motion-reduce:transition-none", headerClasses)}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: motionTokens.slow, ease: motionTokens.easeOut }}
    >
      <div className="section flex items-center justify-between gap-4 px-4 py-3 md:py-4">
        {/* Left: Logo */}
        <LinkComponent 
          href="/" 
          aria-label="Parent Helper home" 
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          tabIndex={0}
        >
          <motion.div
            whileHover={prefersReducedMotion ? {} : { scale: 1.05, rotate: -2 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 15 }}
            className="cursor-pointer"
          >
            {(() => {
              const { src, alt } = safeImage({ src: "/images/logo.png", alt: "Parent Helper" });
              return (
                <Image
                  src={src}
                  alt={alt}
                  width={80}
                  height={80}
                  priority
                  className="h-12 w-auto motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out motion-reduce:transition-none md:h-14"
                />
              );
            })()}
          </motion.div>
        </LinkComponent>

        {/* Center navigation */}
        <nav aria-label="Main navigation" className="ml-4 hidden items-center gap-6 md:ml-10 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = activeMap.get(item.label);
            const hasDropdown = Boolean(item.dropdown);

            if (item.newsletter) {
              return (
                <Button
                  key={item.label}
                  type="button"
                  onClick={(event) => handleNewsletterClick(event)}
                  size="default"
                  variant="ghost"
                  className="text-charcoal/80 hover:text-sage"
                  aria-label={`${item.label} - Open newsletter signup`}
                  tabIndex={0}
                >
                  {item.label}
                </Button>
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
                <LinkComponent
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1 text-small transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                    active ? "font-semibold text-sage" : "text-charcoal/80 hover:text-sage"
                  )}
                  tabIndex={0}
                  aria-expanded={hasDropdown ? isDropdownOpen : undefined}
                  aria-haspopup={hasDropdown ? "true" : undefined}
                >
                  {item.label}
                  {hasDropdown && (
                    <ChevronDown size={iconSize.sm} className="" aria-hidden="true" focusable="false" />
                  )}
                </LinkComponent>

                {hasDropdown && item.dropdown && (
                  <motion.div
                    className="absolute left-1/2 top-full z-40 mt-3 w-52 -translate-x-1/2"
                    initial={{ opacity: 0, y: 8, pointerEvents: "none" }}
                    animate={isDropdownOpen ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: 8, pointerEvents: "none" }}
                    transition={{ duration: motionTokens.fast }}
                    onMouseEnter={() => handleDesktopEnter(item.label)}
                    onMouseLeave={handleDesktopLeave}
                  >
                    <div className="overflow-hidden rounded-xl border border-sage/25 bg-cream py-2 shadow-lg">
                      {item.dropdown.map((link) => (
                        <LinkComponent
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2 text-small text-charcoal/80 transition-standard hover:bg-sage/10 hover:text-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                          tabIndex={0}
                        >
                          {link.label}
                        </LinkComponent>
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
          <LinkComponent
            href={`/admin?key=${process.env.NEXT_PUBLIC_ADMIN_KEY || "your-admin-cookie"}`}
            className="hidden text-small text-text-tertiary transition-standard hover:text-sage md:inline-flex"
            style={
              (SHOW_ADMIN_LINK ? undefined : { display: "none" }) as CSSProperties | undefined
            }
            aria-hidden={SHOW_ADMIN_LINK ? undefined : true}
            tabIndex={SHOW_ADMIN_LINK ? undefined : -1}
            data-visible={SHOW_ADMIN_LINK ? "true" : "false"}
          >
            Admin
          </LinkComponent>
          <LinkComponent
            href={ProviderLogin.href}
            className="hidden items-center rounded-full bg-sage px-4 py-1.5 text-small font-medium text-white transition-standard hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:inline-flex"
            tabIndex={0}
          >
            {ProviderLogin.label}
          </LinkComponent>

          <IconButton
            icon={
              mobileOpen ? (
                <Close size={iconSize.md} aria-hidden="true" />
              ) : (
                <MenuIcon size={iconSize.md} aria-hidden="true" />
              )
            }
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            variant="outline"
            className="md:hidden"
            onClick={toggleMobile}
            tabIndex={0}
          />
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <nav aria-label="Main navigation" className="md:hidden">
          <div className="section pb-5">
            <div className="rounded-2xl border border-sage/30 bg-cream/95 p-4 shadow-lg">
              {NAV_ITEMS.map((item) => {
                const hasDropdown = Boolean(item.dropdown);
                const active = activeMap.get(item.label);

                if (item.newsletter) {
                  return (
                    <Button
                      key={item.label}
                      type="button"
                      onClick={(event) => handleNewsletterClick(event, true)}
                      size="default"
                      variant="ghost"
                      className="w-full justify-start text-charcoal/80 hover:bg-sage/10 hover:text-sage rounded-xl"
                      aria-label={`${item.label} - Open newsletter signup`}
                      tabIndex={0}
                    >
                      {item.label}
                    </Button>
                  );
                }

                if (!hasDropdown || !item.dropdown) {
                  return (
                    <LinkComponent
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-small transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50",
                        active ? "font-semibold text-sage" : "text-charcoal/80 hover:bg-sage/10 hover:text-sage"
                      )}
                      tabIndex={0}
                    >
                      {item.label}
                    </LinkComponent>
                  );
                }

                const isOpen = openDropdown === item.label;

                return (
                  <div key={item.label} className="border-t border-sage/10 first:border-t-0">
                    <Button
                      type="button"
                      className={cn(
                        "w-full justify-between gap-2 px-4 py-3 text-left rounded-xl",
                        active ? "font-semibold text-sage" : "text-charcoal/80 hover:text-sage"
                      )}
                      onClick={() => handleDropdownToggle(item.label)}
                      size="default"
                      variant="ghost"
                      aria-label={`${item.label} menu`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      tabIndex={0}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={iconSize.sm}
                        className={cn("transition-standard", isOpen && "rotate-180")}
                        aria-hidden="true"
                      />
                    </Button>
                    {isOpen && (
                      <div className="space-y-2 pb-3 pl-6">
                        {item.dropdown.map((link) => (
                    <LinkComponent
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-3 py-2 text-small text-charcoal/80 transition-standard hover:bg-sage/10 hover:text-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                      tabIndex={0}
                    >
                      {link.label}
                    </LinkComponent>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-4">
                <LinkComponent
                  href={ProviderLogin.href}
                  className="inline-flex w-full items-center justify-center rounded-full bg-sage px-4 py-2 text-small font-medium text-white transition-standard hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                  tabIndex={0}
                >
                  {ProviderLogin.label}
                </LinkComponent>
              </div>
              <LinkComponent
                href={`/admin?key=${process.env.NEXT_PUBLIC_ADMIN_KEY || "your-admin-cookie"}`}
                className="mt-3 block rounded-xl px-4 py-3 text-small text-charcoal/80 transition-colors hover:bg-sage/10 hover:text-sage"
                style={
                  (SHOW_ADMIN_LINK ? undefined : { display: "none" }) as CSSProperties | undefined
                }
                aria-hidden={SHOW_ADMIN_LINK ? undefined : true}
                tabIndex={SHOW_ADMIN_LINK ? undefined : -1}
                data-visible={SHOW_ADMIN_LINK ? "true" : "false"}
              >
                Admin
              </LinkComponent>
            </div>
          </div>
        </nav>
      )}
    </motion.header>
  );
}
