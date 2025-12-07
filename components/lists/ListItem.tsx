"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /**
   * Whether this item is interactive (clickable/selectable)
   */
  interactive?: boolean;
  /**
   * Whether this item is currently selected
   */
  selected?: boolean;
  /**
   * Click handler for interactive items
   */
  onClick?: (event: React.MouseEvent<HTMLLIElement>) => void;
  /**
   * Keyboard handler for interactive items
   */
  onKeyDown?: (event: React.KeyboardEvent<HTMLLIElement>) => void;
  /**
   * ARIA label for the item
   */
  "aria-label"?: string;
}

/**
 * Accessible List Item Component
 * 
 * Provides semantic <li> structure with proper ARIA roles and keyboard navigation.
 * Supports arrow key navigation and Enter/Space to select when used within an interactive List.
 * 
 * @example
 * ```tsx
 * <ListItem 
 *   interactive 
 *   selected={isSelected}
 *   onClick={() => handleSelect(item)}
 *   aria-label={`${item.title}, press Enter to view details`}
 * >
 *   {item.title}
 * </ListItem>
 * ```
 */
export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ 
    className, 
    interactive = false, 
    selected = false,
    onClick,
    onKeyDown,
    children,
    ...props 
  }, ref) => {
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLLIElement>) => {
        if (onKeyDown) {
          onKeyDown(event);
        }

        if (!interactive) return;

        // Handle Enter and Space for selection
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (onClick) {
            onClick(event as unknown as React.MouseEvent<HTMLLIElement>);
          }
        }
      },
      [interactive, onClick, onKeyDown]
    );

    return (
      <li
        ref={ref}
        role={interactive ? "option" : "listitem"}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "list-none",
          interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
          selected && "ring-2 ring-sage/50",
          className
        )}
        aria-selected={interactive ? selected : undefined}
        {...props}
      >
        {children}
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

