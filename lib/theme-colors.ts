/**
 * Theme Colors Utility
 * 
 * Centralized color values matching tailwind.config.js
 * Use this for JavaScript/TypeScript code that needs color values
 * (e.g., chart libraries, inline styles)
 * 
 * For CSS/Tailwind classes, use the theme classes directly (e.g., bg-sage, text-charcoal)
 */

export const themeColors = {
  sage: {
    DEFAULT: "#9CAF88",
    light: "#A8B8A8",
    dark: "#7C8F67",
    darker: "#7F9065",
    alt: "#9BAE82",
    lighter: "#B8C9A8",
    lightest: "#8FA97C",
  },
  cream: {
    DEFAULT: "#F5F3F0",
    light: "#E7E5E0",
    lighter: "#E8E5E0",
    soft: "#E8E1DA",
  },
  charcoal: {
    DEFAULT: "#3A3A3A",
    dark: "#3D3D3D",
    darker: "#444444",
  },
  terracotta: "#C97C5C",
  forest: "#6B8E5A",
  blue: "#8BB5D6",
  dustyBlue: "#8BB5D6",
  white: "#FFFFFF",
  muted: "#FBFAF8",
  border: {
    light: "#DAD7D0",
  },
  // Standard Tailwind colors used in charts
  gray: {
    200: "#e5e7eb",
    500: "#6b7280",
  },
  blueStandard: {
    500: "#3b82f6",
  },
  purple: {
    500: "#8884d8",
  },
} as const;

/**
 * Get a color value from the theme
 * @example getColor('sage') // "#9CAF88"
 * @example getColor('sage', 'light') // "#A8B8A8"
 */
export function getColor(
  color: keyof typeof themeColors,
  variant?: string
): string {
  const colorValue = themeColors[color];
  if (typeof colorValue === "string") {
    return colorValue;
  }
  if (variant && variant in colorValue) {
    return (colorValue as Record<string, string>)[variant];
  }
  return (colorValue as Record<string, string>)["DEFAULT"] || "";
}







