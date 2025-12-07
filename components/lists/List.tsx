"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * Whether the list is interactive (keyboard navigable)
   */
  interactive?: boolean;
  /**
   * ARIA label for the list
   */
  "aria-label"?: string;
  /**
   * ARIA labelledby reference
   */
  "aria-labelledby"?: string;
}

/**
 * Accessible List Component
 * 
 * Provides semantic <ul> structure with proper ARIA roles and keyboard navigation support.
 * Supports arrow key navigation between interactive items and Enter/Space to select.
 * Use this instead of raw <div> elements for lists of items.
 * 
 * @example
 * ```tsx
 * <List aria-label="Search results" interactive>
 *   {items.map(item => (
 *     <ListItem key={item.id} interactive onClick={() => handleSelect(item)}>
 *       {item.title}
 *     </ListItem>
 *   ))}
 * </List>
 * ```
 */
export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, interactive = false, children, onKeyDown, ...props }, ref) => {
    const listRef = React.useRef<HTMLUListElement | null>(null);
    const combinedRef = React.useCallback(
      (node: HTMLUListElement | null) => {
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && "current" in ref && typeof (ref as { current: HTMLUListElement | null }).current !== "undefined") {
          (ref as React.MutableRefObject<HTMLUListElement | null>).current = node;
        }
        listRef.current = node;
      },
      [ref]
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLUListElement>) => {
        if (onKeyDown) {
          onKeyDown(event);
        }

        if (!interactive || !listRef.current) return;

        const items = Array.from(
          listRef.current.querySelectorAll<HTMLLIElement>('li[role="listitem"][tabindex="0"]')
        );

        if (items.length === 0) return;

        const currentIndex = items.findIndex((item) => item === document.activeElement);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex]?.focus();
            break;
          case "ArrowUp":
            event.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[nextIndex]?.focus();
            break;
          case "Home":
            event.preventDefault();
            items[0]?.focus();
            break;
          case "End":
            event.preventDefault();
            items[items.length - 1]?.focus();
            break;
        }
      },
      [interactive, onKeyDown]
    );

    return (
      <ul
        ref={combinedRef}
        role="list"
        onKeyDown={handleKeyDown}
        className={cn(
          "list-none p-0 m-0",
          className
        )}
        {...props}
      >
        {children}
      </ul>
    );
  }
);
List.displayName = "List";

