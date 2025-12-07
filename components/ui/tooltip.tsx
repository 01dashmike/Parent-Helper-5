"use client";

import * as React from "react";
import { AccessibleTooltip } from "./accessibletooltip";

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const TooltipTrigger = ({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return <>{children}</>;
};

export const TooltipContent = ({ children, ..._props }: { children: React.ReactNode; [key: string]: unknown }) => {
  return <>{children}</>;
};

// For compatibility with AccessibleTooltip
export { AccessibleTooltip };

