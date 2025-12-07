"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/formfield";

interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared form field wrapper for consistent styling across all wizard steps
 */
export function FormFieldWrapper({
  label,
  required = false,
  error,
  helpText,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={className}
    >
      {children}
    </FormField>
  );
}





