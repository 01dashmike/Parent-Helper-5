"use client";

import React, { useId } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/icons/tokens";

export interface FormFieldProps {
  /**
   * Label text for the field
   */
  label: string;

  /**
   * Whether this field is required
   */
  required?: boolean;

  /**
   * Error message to display
   */
  error?: string | null;

  /**
   * Help text to display below the field
   */
  helpText?: string | null;

  /**
   * Custom id for the input (auto-generated if not provided)
   */
  id?: string;

  /**
   * Optional className for the wrapper
   */
  className?: string;

  /**
   * Optional className for the label
   */
  labelClassName?: string;

  /**
   * Children - should be the input, textarea, or select element
   */
  children: React.ReactNode;
}

/**
 * Unified Form Field Component
 * 
 * Provides consistent, accessible form fields across the application.
 * 
 * Features:
 * - Proper label/input association with htmlFor/id
 * - aria-describedby for error and help text
 * - aria-required for required fields
 * - Consistent focus rings: focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2
 * - Normalized spacing: w-full p-3 rounded-xl border border-charcoal/15
 * - Error messaging with role="alert"
 * - Help text support
 * 
 * @example
 * ```tsx
 * <FormField label="Email" required error={errors.email}>
 *   <input type="email" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  required = false,
  error,
  helpText,
  id: providedId,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = providedId || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  const describedBy = [errorId, helpTextId].filter(Boolean).join(" ") || undefined;

  // Clone the child element and add necessary props
  const childWithProps = React.cloneElement(children as React.ReactElement, {
    id: fieldId,
    "aria-describedby": describedBy,
    "aria-required": required ? "true" : undefined,
    "aria-invalid": error ? "true" : "false",
    className: cn(
      "input input-md",
      error && "border-red-500 focus-visible:ring-red-500/50",
      (children as React.ReactElement)?.props?.className
    ),
  });

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "input-label",
          labelClassName
        )}
      >
        {label}
        {required && <span className="text-terracotta ml-1" aria-label="required">*</span>}
      </label>
      {childWithProps}
      {helpText && (
        <p
          id={helpTextId}
          className="input-helper"
        >
          {helpText}
        </p>
      )}
      {error && (
        <div className="input-error" role="alert">
          <AlertTriangle size={iconSize.sm} aria-hidden="true" />
          <p id={errorId}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

