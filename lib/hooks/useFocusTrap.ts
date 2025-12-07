"use client";

import { useEffect, useRef, RefObject } from "react";

/**
 * Hook to trap focus within a container element
 * Implements focus trap for accessibility in modals and dialogs
 * 
 * @param isActive - Whether the focus trap should be active
 * @param containerRef - Ref to the container element to trap focus within
 * @param restoreFocus - Whether to restore focus to the previous active element when the trap deactivates (default: true)
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  containerRef: RefObject<T>,
  restoreFocus: boolean = true
): void {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // When deactivating, restore focus if requested
      if (!isActive && restoreFocus && previousActiveElement.current) {
        // Small delay to ensure DOM updates are complete
        const timeoutId = setTimeout(() => {
          if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
            previousActiveElement.current.focus();
          }
        }, 50);
        return () => clearTimeout(timeoutId);
      }
      return;
    }

    // Store the element that had focus before the modal opened
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab: focus previous element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: focus next element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      
      // Restore focus to the previous active element if requested
      if (restoreFocus && previousActiveElement.current) {
        // Small delay to ensure DOM updates are complete
        const timeoutId = setTimeout(() => {
          if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
            previousActiveElement.current.focus();
          }
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    };
  }, [isActive, containerRef, restoreFocus]);
}

/**
 * Hook to return focus to a specific element when a modal closes
 */
export function useReturnFocus(
  isActive: boolean,
  triggerRef: RefObject<HTMLElement>
): void {
  useEffect(() => {
    if (isActive || !triggerRef.current) {
      return;
    }

    // Small delay to ensure modal is fully closed
    const timeoutId = setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isActive, triggerRef]);
}

