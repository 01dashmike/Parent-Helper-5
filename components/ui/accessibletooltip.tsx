"use client";

import { useId } from "react";
import React from "react";
import { VisuallyHidden } from "./visually-hidden";

/**
 * Minimal accessible tooltip pattern using aria-describedby
 * WCAG compliant - uses visually hidden text that screen readers announce
 * 
 * Usage:
 * <AccessibleTooltip description="Tooltip text">
 *   <button>
 *     <Icon />
 *   </button>
 * </AccessibleTooltip>
 */
interface AccessibleTooltipProps {
  children: React.ReactElement;
  description: string;
  id?: string;
}

export function AccessibleTooltip({ children, description, id }: AccessibleTooltipProps) {
  const generatedId = useId();
  const tooltipId = id || generatedId;

  // Clone child and add aria-describedby
  const childWithAria = React.cloneElement(children, {
    "aria-describedby": tooltipId,
  });

  return (
    <>
      {childWithAria}
      <VisuallyHidden id={tooltipId}>
        {description}
      </VisuallyHidden>
    </>
  );
}

/**
 * Hook version for more flexibility
 * Returns id and description element
 */
export function useAccessibleTooltip(description: string, id?: string) {
  const generatedId = useId();
  const tooltipId = id || generatedId;

  return {
    tooltipId,
    tooltipDescription: (
      <VisuallyHidden id={tooltipId}>
        {description}
      </VisuallyHidden>
    ),
  };
}

