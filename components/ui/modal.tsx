"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import { useModal } from "@/lib/hooks/useModal";
import { IconButton } from "@/components/ui/buttons";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

/**
 * Unified Modal Component
 * 
 * Full-stack safe modal that prevents hydration issues by only rendering on client.
 * Uses portal for proper z-index stacking and accessibility.
 */
export function Modal({
  open,
  onOpenChange,
  children,
  title,
  description,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  contentClassName,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Only mount on client to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use unified modal hook for focus trap, escape handling, body scroll lock, and announcements
  useModal({
    isOpen: open && mounted,
    contentRef,
    onClose: () => onOpenChange(false),
    title,
    closeOnEscape,
    lockBodyScroll: true,
    announce: true,
  });

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [closeOnOverlayClick, onOpenChange]
  );

  if (!mounted || !open) {
    return null;
  }

  const modalContent = (
    <dialog
      open={open}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? "Dialog" : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "fixed inset-0 z-50 m-0 flex items-center justify-center px-md py-10 bg-transparent backdrop:bg-charcoal/40 backdrop:backdrop-blur-sm", // py-10 = 2.5rem, no token
        overlayClassName
      )}
      onClick={handleOverlayClick}
      onCancel={(e) => {
        e.preventDefault();
        if (closeOnEscape) {
          onOpenChange(false);
        }
      }}
    >
      {/* Backdrop - using div for cross-browser compatibility with portals */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-50 w-full rounded-dialog bg-white shadow-xl transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
          sizeClasses[size],
          contentClassName
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-sage/20 p-dialog-header">
            <div className="flex-1 pr-4">
              {title && (
                <h2
                  id={titleId}
                  className="text-title text-charcoal"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-xs text-small text-slateSoft"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <IconButton
                icon={<X size={iconSize.md} aria-hidden="true" />}
                aria-label="Close dialog"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn("p-dialog-body", className)}>{children}</div>
      </div>
    </dialog>
  );

  // Use portal to render outside the component tree
  return createPortal(modalContent, document.body);
}

/**
 * Modal Header component for custom layouts
 */
export function ModalHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-sage/20 p-dialog-header",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Modal Body component for custom layouts
 */
export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-dialog-body", className)}>{children}</div>;
}

/**
 * Modal Footer component for custom layouts
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-sage/20 p-dialog-footer",
        className
      )}
    >
      {children}
    </div>
  );
}

