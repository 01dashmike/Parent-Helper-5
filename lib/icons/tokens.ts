/**
 * Icon size tokens for consistent icon sizing across the application
 * Standardized sizes for lucide-react icons
 */

export const iconSize = {
  sm: 16,   // 16px - small icons (w-4 h-4)
  md: 20,   // 20px - medium icons (w-5 h-5)
  lg: 24,   // 24px - large icons (w-6 h-6)
} as const;

export type IconSize = keyof typeof iconSize;

