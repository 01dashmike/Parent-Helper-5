"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import LinkComponent from "@/components/ui/link";

const MEMBERS_ENABLED = process.env.NEXT_PUBLIC_MEMBERS_ENABLED !== "false";
const STORAGE_KEY = "members_modal_dismissed";

export function MembersOnboardingModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!MEMBERS_ENABLED) return;
    
    // Don't show on account pages or login
    if (pathname?.startsWith("/account")) return;
    
    // Check if dismissed
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      if (dismissed) return;
    } catch {
      // localStorage not available
    }

    // Show after scroll or time delay
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const threshold = document.body.scrollHeight * 0.3;
      if (scrolled >= threshold) {
        setIsOpen(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    const timer = setTimeout(() => setIsOpen(true), 10000);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // Store the element that had focus before the modal opened and move focus into dialog
  useEffect(() => {
    if (isOpen && modalRef.current) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Move focus into the dialog when it opens
      const timeoutId = setTimeout(() => {
        if (modalRef.current) {
          // Try to focus the first focusable element, or the title if no focusable elements
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            // Fallback to title
            const titleElement = modalRef.current.querySelector('#members-modal-title');
            if (titleElement instanceof HTMLElement) {
              titleElement.setAttribute('tabindex', '-1');
              titleElement.focus();
            }
          }
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    } else if (!isOpen && previousActiveElementRef.current) {
      // Return focus when modal closes
      const timeoutId = setTimeout(() => {
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(isOpen, modalRef);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage not available
    }
  };

  if (!MEMBERS_ENABLED || !isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="members-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md rounded-dialog bg-white p-dialog shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="min-h-11 min-w-11 flex items-center justify-center absolute right-4 top-4 text-charcoal/50 transition hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0"
          aria-label="Close dialog"
        >
          <X size={iconSize.md} aria-hidden="true" />
        </button>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={iconSize.lg} className="text-sage" aria-hidden="true" />
            <h2 id="members-modal-title" className="text-title font-semibold text-charcoal">
              Join Parent Helper Members
            </h2>
          </div>
          <p className="text-text-tertiary">
            Get notified about new classes near you + save your plans for free.
          </p>
          <ul className="space-y-2 text-small text-text-tertiary">
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>Save searches and get alerts for new classes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>Save meal plans, exercise routines, and wellness guides</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage">✓</span>
              <span>Track your bookings and manage your account</span>
            </li>
          </ul>
          <div className="flex gap-3 pt-2">
            <LinkComponent
              href="/account/login"
              onClick={handleClose}
              className="btn btn-md btn-primary flex-1 text-center"
              prefetch={false}
            >
              Join Members
            </LinkComponent>
            <button
              onClick={handleClose}
              className="btn btn-md btn-outline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

