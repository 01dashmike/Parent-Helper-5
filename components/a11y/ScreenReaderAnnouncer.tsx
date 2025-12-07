"use client";

/**
 * Global Screen Reader Announcer Component
 * 
 * Provides a live region for announcing dynamic UI changes to screen readers.
 * This component should be mounted once at the root level of the application.
 * 
 * WCAG 4.1.3: Status Messages - Information, status, and relationships that can be
 * programmatically determined can be conveyed to assistive technologies.
 */
export function ScreenReaderAnnouncer() {
  return (
    <div
      id="sr-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden"
      aria-relevant="additions text"
    >
      {/* Content will be dynamically updated via announce() utility */}
    </div>
  );
}

