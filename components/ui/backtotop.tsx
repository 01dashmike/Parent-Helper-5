"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      scrollToTop();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "inline-flex h-12 w-12 items-center justify-center rounded-card px-4 py-2 text-small font-medium",
        "bg-sage text-white shadow-lg",
        "transition-all duration-200",
        "hover:bg-sage/90 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
        "motion-safe:animate-fade-in",
        "motion-reduce:transition-none"
      )}
    >
      <ArrowUp size={iconSize.md} aria-hidden="true" />
    </button>
  );
}

