"use client";

import { forwardRef } from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof NextLink> & {
  className?: string;
  "aria-label"?: string;
};

/**
 * Enhanced Link component that:
 * - Uses next/link for internal navigation (SEO + performance)
 * - Automatically detects external links and adds proper attributes
 * - Ensures all links have focus-visible styles for accessibility
 */
const LinkComponent = forwardRef<HTMLAnchorElement, Props>(
  ({ className, href, ...props }, ref) => {
    // Check if link is external
    const isExternal = typeof href === "string" && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:"));
    
    // Default focus styles (only add if not already present)
    const defaultFocusStyles = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2";
    const hasFocusStyles = className?.includes("focus-visible");
    
    // If external, use regular anchor tag with proper attributes
    if (isExternal) {
      const externalHref = href as string;
      const externalProps = {
        ...props,
        href: externalHref,
        target: "_blank",
        rel: "noopener noreferrer",
      };
      
      // Add aria-label if not provided and href might be unclear
      if (!externalProps["aria-label"] && !props.children) {
        externalProps["aria-label"] = `Opens external site: ${externalHref}`;
      }
      
      return (
        <a
          ref={ref}
          {...externalProps}
          className={cn(className, !hasFocusStyles && defaultFocusStyles)}
        />
      );
    }
    
    // Internal link - use next/link
    return (
      <NextLink
        ref={ref}
        href={href}
        {...props}
        className={cn(className, !hasFocusStyles && defaultFocusStyles)}
      />
    );
  },
);

LinkComponent.displayName = "LinkComponent";

export default LinkComponent;

