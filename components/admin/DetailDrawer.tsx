"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DetailDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const focusableSelectors =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function DetailDrawer({
  title,
  open,
  onClose,
  children,
}: DetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>(focusableSelectors) ?? [];
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "Tab" && drawer) {
        const focusableElements = drawer.querySelectorAll<HTMLElement>(focusableSelectors);
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      lastActiveElement.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex"
      aria-modal="true"
      role="dialog"
      aria-labelledby="email-drawer-title"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="relative ml-auto flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl rounded-dialog focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-sage/20 p-dialog-header">
          <h2 id="email-drawer-title" className="text-title font-semibold text-charcoal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sage/30 px-3 py-1 text-small font-medium text-slateSoft transition hover:border-sage hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-dialog-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}


