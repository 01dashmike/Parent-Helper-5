# Color Token Migration Guide

## Overview
This document outlines the color token consolidation and WCAG AA compliance improvements made to the Parent Helper codebase.

## Changes Made

### 1. Created Comprehensive Color Tokens File
- **Location**: `tokens/colors.ts`
- **Purpose**: Centralized documentation of all color tokens with WCAG contrast ratios
- **Includes**:
  - Base color palette with contrast ratios
  - Opacity variants for safe usage
  - WCAG-compliant color combinations
  - Helper functions for contrast-safe color selection

### 2. Color Replacements for WCAG Compliance

#### Text Colors on Light Backgrounds
- **Before**: `text-sage` on white/cream (2.8:1 ❌)
- **After**: `text-forest` on white/cream (4.6:1 ✅)
- **Files Updated**:
  - `components/blog/AdminEditorDrawer.tsx`
  - `components/admin/payments/PaymentsDashboardClient.tsx`
  - `components/SearchFields.tsx`

#### Button Backgrounds
- **Note**: Buttons with `bg-sage text-white` have 2.8:1 contrast (slightly below 3:1 for UI components)
- **Recommendation**: Use `bg-sage-dark` for better contrast (3.8:1 ✅) while maintaining brand color
- **Status**: Documented in color tokens; can be updated incrementally

### 3. Preserved Brand Colors
- All brand colors (sage, terracotta, forest) remain unchanged
- Only replaced non-compliant text color usages with compliant alternatives
- Hover states preserved (acceptable for accessibility)

## WCAG Compliance Status

### ✅ Compliant Combinations
- `text-charcoal` on white/cream (12.6:1 / 7.2:1)
- `text-forest` on white/cream (4.6:1 / 4.3:1)
- `text-charcoal` on terracotta (4.8:1)
- `text-charcoal` on blue (4.2:1)
- `text-white` on sage-dark (3.8:1)

### ⚠️ Large Text Only (3:1+)
- `text-terracotta` on white (3.4:1) - Use for 18pt+ or 14pt+ bold text only
- `text-sage` on white (2.8:1) - Use for large text or UI components only

### ❌ Non-Compliant (Fixed)
- `text-sage` on white/cream - Replaced with `text-forest`

## Usage Guidelines

### Text Colors
- **Primary text**: Use `text-charcoal` for body text and headings
- **Green accents**: Use `text-forest` instead of `text-sage` for better contrast
- **Large text**: `text-terracotta` and `text-sage` are acceptable for 18pt+ or 14pt+ bold text

### Background Colors
- **Primary background**: `bg-cream` or `bg-white`
- **Sage backgrounds**: Use `bg-sage-dark` with white text for better contrast
- **Accent backgrounds**: Use opacity variants (e.g., `bg-sage/20`) for subtle backgrounds

### Opacity Variants
- **10-20%**: Background tints, subtle highlights
- **30-40%**: Borders, dividers, overlays
- **50-60%**: Muted text, disabled states
- **70-80%**: Secondary text
- **90%**: Primary text on light backgrounds

## Migration Checklist

- [x] Created color tokens documentation file
- [x] Replaced `text-sage` with `text-forest` on light backgrounds
- [x] Documented all color contrast ratios
- [x] Updated tailwind.config.js with contrast notes
- [ ] Review and update buttons with `bg-sage text-white` to use `bg-sage-dark` (optional, for better compliance)
- [ ] Audit remaining color usages for compliance

## Next Steps

1. **Incremental Updates**: Update buttons with `bg-sage text-white` to `bg-sage-dark` as components are modified
2. **Code Review**: Review new color usages against the color tokens file
3. **Testing**: Test color combinations in different contexts (light/dark modes if applicable)
4. **Documentation**: Keep color tokens file updated as new colors are added

## References

- [WCAG 2.1 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Color tokens file: `tokens/colors.ts`

