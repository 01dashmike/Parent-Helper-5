/**
 * Screen Reader Announcement Utility
 * 
 * Provides a centralized way to announce dynamic UI changes to screen readers.
 * This helps meet WCAG 4.1.3 (Status Messages) requirements.
 * 
 * Usage:
 *   import { announce } from "@/lib/a11y/announce";
 *   announce("Search results updated. 15 classes found.");
 */

const ANNOUNCER_ID = "sr-announcer";

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - "polite" (default) or "assertive" for urgent messages
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  if (typeof window === "undefined") {
    // SSR: no-op
    return;
  }

  const announcer = document.getElementById(ANNOUNCER_ID);
  if (!announcer) {
    // Announcer not mounted yet, create a temporary one
    const tempAnnouncer = document.createElement("div");
    tempAnnouncer.id = ANNOUNCER_ID;
    tempAnnouncer.setAttribute("role", priority === "assertive" ? "alert" : "status");
    tempAnnouncer.setAttribute("aria-live", priority);
    tempAnnouncer.setAttribute("aria-atomic", "true");
    tempAnnouncer.className = "sr-only";
    document.body.appendChild(tempAnnouncer);
    tempAnnouncer.textContent = message;
    // Clean up after announcement
    setTimeout(() => {
      tempAnnouncer.remove();
    }, 1000);
    return;
  }

  // Update the live region
  announcer.setAttribute("role", priority === "assertive" ? "alert" : "status");
  announcer.setAttribute("aria-live", priority);
  
  // Clear previous message to ensure new message is announced
  announcer.textContent = "";
  
  // Use requestAnimationFrame to ensure the clear is processed
  requestAnimationFrame(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  });
}

/**
 * Announce search results update
 */
export function announceSearchResults(count: number, query?: string, town?: string): void {
  const parts: string[] = [];
  
  if (query && town) {
    parts.push(`Found ${count} ${count === 1 ? "class" : "classes"} for "${query}" in ${town}`);
  } else if (query) {
    parts.push(`Found ${count} ${count === 1 ? "class" : "classes"} for "${query}"`);
  } else if (town) {
    parts.push(`Found ${count} ${count === 1 ? "class" : "classes"} in ${town}`);
  } else {
    parts.push(`Found ${count} ${count === 1 ? "class" : "classes"}`);
  }
  
  announce(parts.join(". "));
}

/**
 * Announce filter application
 */
export function announceFiltersApplied(filterCount: number): void {
  if (filterCount === 0) {
    announce("All filters cleared");
  } else {
    announce(`${filterCount} ${filterCount === 1 ? "filter" : "filters"} applied`);
  }
}

/**
 * Announce map region change
 */
export function announceMapRegion(region: string): void {
  announce(`Map view changed to ${region}`);
}

/**
 * Announce form submission success
 */
export function announceFormSuccess(message: string): void {
  announce(message, "polite");
}

/**
 * Announce form submission error
 */
export function announceFormError(message: string): void {
  announce(message, "assertive");
}

