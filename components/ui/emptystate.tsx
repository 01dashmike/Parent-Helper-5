"use client";

import { Search, Inbox, Package, Calendar } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import LinkComponent from "./link";
import { Button } from "@/components/ui/buttons";

export interface EmptyStateProps {
  /**
   * Empty state title/heading
   */
  title: string;
  /**
   * Empty state description
   */
  description: string;
  /**
   * Optional icon (defaults to Inbox icon)
   */
  icon?: React.ReactNode;
  /**
   * Icon variant for default icons
   */
  iconVariant?: "inbox" | "search" | "package" | "calendar";
  /**
   * Optional action button label
   */
  actionLabel?: string;
  /**
   * Optional action button href (for Link) or onClick (for button)
   */
  actionHref?: string;
  /**
   * Optional action button onClick handler (if no href)
   */
  actionOnClick?: () => void;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Size variant (defaults to "default")
   */
  size?: "sm" | "default" | "lg";
}

/**
 * Standardized Empty State Component
 * 
 * Provides consistent, accessible empty state display across the application.
 * 
 * Features:
 * - Icon with aria-hidden="true"
 * - Meaningful heading
 * - Optional action button
 * - Consistent spacing and focus rings
 * 
 * @example
 * ```tsx
 * {results.length === 0 && (
 *   <EmptyState
 *     title="No classes found"
 *     description="Try adjusting your search filters or explore different categories."
 *     iconVariant="search"
 *     actionLabel="Clear filters"
 *     actionOnClick={handleClearFilters}
 *   />
 * )}
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  iconVariant = "inbox",
  actionLabel,
  actionHref,
  actionOnClick,
  className,
  size = "default",
}: EmptyStateProps) {
  // Size classes
  const sizeClasses = {
    sm: "p-section",
    default: "p-6",
    lg: "p-8",
  };

  // Icon size mapping for default icons (larger icons in wrapper)
  const iconSizeMap = {
    sm: iconSize.md,  // h-8 w-8 wrapper uses md icon
    default: iconSize.lg,  // h-12 w-12 wrapper uses lg icon
    lg: iconSize.lg,  // h-16 w-16 wrapper uses lg icon
  };

  // Icon wrapper size classes
  const iconSizeClasses = {
    sm: "h-8 w-8",
    default: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const titleSizeClasses = {
    sm: "text-title",
    default: "text-title",
    lg: "text-title",
  };

  // Default icons
  const defaultIcons = {
    inbox: Inbox,
    search: Search,
    package: Package,
    calendar: Calendar,
  };

  const IconComponent = !icon && defaultIcons[iconVariant] ? defaultIcons[iconVariant] : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-hero border border-accent/20 bg-white text-center shadow-soft",
        sizeClasses[size],
        className
      )}
    >
      <div className="mb-md flex-shrink-0">
        {icon ? (
          <div className={cn("text-accent/60", iconSizeClasses[size])} aria-hidden="true">
            {icon}
          </div>
        ) : IconComponent ? (
          <div className="rounded-full bg-accent/10 p-3">
            <IconComponent
              size={iconSizeMap[size]}
              className="text-accent/60"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
      
      <h2
        className={cn(
          "font-semibold text-primary mb-small",
          titleSizeClasses[size]
        )}
      >
        {title}
      </h2>
      
      <p className="text-small text-text-tertiary mb-heading max-w-md">
        {description}
      </p>

      {actionLabel && (actionHref || actionOnClick) && (
        <div className="mt-sm">
          {actionHref ? (
            <LinkComponent
              href={actionHref}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-card bg-accent px-md py-sm text-small font-semibold text-white transition-standard hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              aria-label={actionLabel}
            >
              {actionLabel}
            </LinkComponent>
          ) : (
            <Button
              onClick={actionOnClick}
              aria-label={actionLabel}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

