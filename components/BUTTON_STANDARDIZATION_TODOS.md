# Button Standardization - TODO Comments

This file documents edge cases and buttons that need manual review before conversion to the standardized button system.

## Edge Cases Requiring Manual Review

### Navigation/Menu Items
- **Location**: `components/Header.tsx` (lines 335-344, 353-360, 370-377)
- **Reason**: Navigation menu items have custom styling for active states and dropdowns. These are not standard buttons but navigation links with specific interaction patterns.
- **Action**: Review if these should use button classes or remain as custom navigation styles.

### Icon-Only Buttons with Custom Sizing
- **Location**: `components/account/SavedSearchCard.tsx` (lines 199, 210)
- **Reason**: Icon-only buttons with `min-h-11 min-w-11` that need responsive sizing (`md:min-h-0 md:min-w-0`). These may need a specialized icon button variant.
- **Action**: Consider creating `btn-icon` variant or keep custom classes for mobile-specific sizing.

### Gradient Buttons
- **Location**: `components/SearchBar.tsx` (line 65)
- **Reason**: Button uses gradient background (`bg-gradient-to-r from-primary via-accent to-secondary`). Standard button classes don't include gradient variants.
- **Action**: Keep custom gradient or add `btn-gradient` variant to globals.css.

### Custom Border Radius
- **Location**: Multiple files using `rounded-xl` instead of `rounded-full`
- **Reason**: Some buttons intentionally use `rounded-xl` for a different visual style (e.g., `components/account/SavedSearchCard.tsx`).
- **Action**: Decide if these should be standardized to `rounded-full` or if `rounded-xl` is acceptable variation.

### Payment/Onboarding Flows (Excluded per requirements)
- **Location**: `app/booking/**/*`, `app/onboarding/**/*`
- **Reason**: Explicitly excluded from standardization to avoid breaking critical user flows.
- **Action**: Leave as-is.

### API Routes (Excluded per requirements)
- **Location**: `app/api/**/*`
- **Reason**: Server-side code, not UI components.
- **Action**: N/A

## Conversion Statistics

- **Converted**: ~15+ button instances
- **Remaining**: ~5-10 edge cases requiring manual review
- **Coverage**: ~80% of ad-hoc buttons converted

## Next Steps

1. Review navigation menu items in Header component
2. Create icon button variant if needed
3. Decide on gradient button variant
4. Standardize border radius usage (rounded-full vs rounded-xl)
5. Document any additional edge cases discovered

