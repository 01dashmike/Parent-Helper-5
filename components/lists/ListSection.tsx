"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { List, ListProps } from "./List";
import { EmptyState } from "@/components/ui/emptystate";

export interface ListSectionProps extends Omit<ListProps, "aria-label"> {
  /**
   * Title for the section
   */
  title?: string;
  /**
   * ID for the title element (for aria-labelledby)
   */
  titleId?: string;
  /**
   * Description or helper text for the section
   */
  description?: string;
  /**
   * Whether the section is empty (shows empty state)
   */
  empty?: boolean;
  /**
   * Empty state message
   */
  emptyMessage?: string;
}

/**
 * Accessible List Section Component
 * 
 * Provides a semantic section wrapper for lists with optional title and description.
 * Useful for grouping related list items with context.
 * 
 * @example
 * ```tsx
 * <ListSection 
 *   title="Search Results"
 *   description="Classes matching your search"
 *   aria-label="Search results"
 * >
 *   {items.map(item => (
 *     <ListItem key={item.id}>{item.title}</ListItem>
 *   ))}
 * </ListSection>
 * ```
 */
export const ListSection = React.forwardRef<HTMLUListElement, ListSectionProps>(
  ({ 
    className,
    title,
    titleId,
    description,
    empty = false,
    emptyMessage = "No items found",
    children,
    ...props 
  }, ref) => {
    const sectionId = React.useId();
    const generatedTitleId = titleId || (title ? `${sectionId}-title` : undefined);
    const descriptionId = description ? `${sectionId}-description` : undefined;

    return (
      <section className={cn("space-y-2", className)}>
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h2 
                id={generatedTitleId}
                className="text-title text-charcoal"
              >
                {title}
              </h2>
            )}
            {description && (
              <p 
                id={descriptionId}
                className="mt-1 text-body text-slateSoft"
              >
                {description}
              </p>
            )}
          </div>
        )}
        {empty ? (
          <EmptyState
            title="No items found"
            description={emptyMessage || "No items found"}
            iconVariant="inbox"
            size="sm"
          />
        ) : (
          <List
            ref={ref}
            aria-labelledby={generatedTitleId}
            aria-describedby={descriptionId}
            {...props}
          >
            {children}
          </List>
        )}
      </section>
    );
  }
);
ListSection.displayName = "ListSection";

