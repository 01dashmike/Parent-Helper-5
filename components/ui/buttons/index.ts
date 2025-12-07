/**
 * Unified Button Components
 * 
 * WCAG AA compliant button system with consistent styling and accessibility.
 * 
 * All buttons include:
 * - Minimum touch target: 44x44px
 * - WCAG-compliant focus ring (ring-sage/50)
 * - Loading state with spinner and aria-busy
 * - Proper disabled state handling
 * 
 * @example
 * ```tsx
 * import { Button, IconButton, GhostButton, SecondaryButton } from '@/components/ui/buttons';
 * 
 * // Primary button
 * <Button onClick={handleClick}>Save</Button>
 * 
 * // Icon-only button
 * <IconButton
 *   icon={<X />}
 *   aria-label="Close"
 *   onClick={handleClose}
 * />
 * 
 * // Ghost button
 * <GhostButton onClick={handleCancel}>Cancel</GhostButton>
 * 
 * // Secondary button
 * <SecondaryButton onClick={handleAction}>Secondary</SecondaryButton>
 * ```
 */

export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { IconButton } from "./IconButton";
export type { IconButtonProps } from "./IconButton";

export { GhostButton } from "./GhostButton";
export type { GhostButtonProps } from "./GhostButton";

export { SecondaryButton } from "./SecondaryButton";
export type { SecondaryButtonProps } from "./SecondaryButton";

