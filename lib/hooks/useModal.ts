"use client";

import { useEffect, useRef, RefObject } from "react";
import { useFocusTrap } from "./useFocusTrap";
import { announce } from "@/lib/a11y/announce";

interface UseModalOptions {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Ref to the modal content container (for focus trap) */
  contentRef: RefObject<HTMLElement>;
  /** Callback when modal should close (e.g., on Escape) */
  onClose: () => void;
  /** Modal title for announcements */
  title?: string;
  /** Whether to close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Whether to lock body scroll (default: true) */
  lockBodyScroll?: boolean;
  /** Whether to announce modal open/close (default: true) */
  announce?: boolean;
}

/**
 * Unified modal hook that handles:
 * - Body scroll lock
 * - Focus trap
 * - Escape key handling
 * - Screen reader announcements
 * 
 * @example
 * const contentRef = useRef<HTMLDivElement>(null);
 * useModal({
 *   isOpen,
 *   contentRef,
 *   onClose: () => setIsOpen(false),
 *   title: "Edit Profile"
 * });
 */
export function useModal({
  isOpen,
  contentRef,
  onClose,
  title,
  closeOnEscape = true,
  lockBodyScroll = true,
  announce: shouldAnnounce = true,
}: UseModalOptions): void {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const hasAnnouncedOpenRef = useRef(false);

  // Store the element that had focus before the modal opened
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      hasAnnouncedOpenRef.current = false;
    }
  }, [isOpen]);

  // Move focus into the dialog when it opens
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (contentRef.current) {
        // Try to focus the first focusable element
        const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // Fallback: focus the content container itself
          contentRef.current.setAttribute('tabindex', '-1');
          contentRef.current.focus();
        }
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [isOpen, contentRef]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      // Return focus to the triggering element when modal closes
      const timeoutId = setTimeout(() => {
        if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
          previousActiveElementRef.current.focus();
        }
        previousActiveElementRef.current = null;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Focus trap - trap focus within the modal content
  useFocusTrap(isOpen, contentRef, false);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!lockBodyScroll) return;

    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen, lockBodyScroll]);

  // Announce modal open/close
  useEffect(() => {
    if (!shouldAnnounce) return;

    if (isOpen && !hasAnnouncedOpenRef.current) {
      const announcement = title ? `Opened dialog: ${title}` : "Opened dialog";
      announce(announcement, "polite");
      hasAnnouncedOpenRef.current = true;
    } else if (!isOpen && hasAnnouncedOpenRef.current) {
      announce("Closed dialog", "polite");
      hasAnnouncedOpenRef.current = false;
    }
  }, [isOpen, title, shouldAnnounce]);
}

