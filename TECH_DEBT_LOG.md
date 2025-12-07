# Tech Debt Log

Generated: 2025-01-27

This document tracks technical debt items that require attention, organized by risk level and business impact.

## Risky Areas with eslint-disable Comments

| File(s) | Description | Risk Level | Business Impact if it Fails | Effort Estimate |
|---------|-------------|------------|----------------------------|-----------------|
| `app/api/ai/coach/route.ts` (lines 59, 137) | Unsafe optional chaining on bookings and referrals data. Could cause runtime errors if data structure changes or is null/undefined unexpectedly. | **HIGH** | AI coach feature fails, provider/admin analytics break, revenue tracking incorrect | **M** |
| `components/search/ResultsSplit.tsx` (lines 160, 181) | Disabled `react-hooks/exhaustive-deps` on callbacks. Could lead to stale closures and incorrect behavior if dependencies change. | **MEDIUM** | Search results interaction bugs, incorrect hover/selection state, broken analytics tracking | **S** |
| `components/NewsletterModal.tsx` (lines 34, 60, 80) | Multiple `react-hooks/exhaustive-deps` disables across three useEffects. Potential for stale closures and memory leaks. | **MEDIUM** | Newsletter modal doesn't show/hide correctly, localStorage sync issues, event listener leaks | **S** |
| `components/search/SaveSearchButton.tsx` (line 58) | Disabled `react-hooks/exhaustive-deps` on auth subscription effect. Could miss auth state changes. | **MEDIUM** | Save search button doesn't update when user logs in/out, poor UX | **S** |
| `components/provider/ReferralsDashboard.tsx` (line 47) | Disabled `react-hooks/exhaustive-deps` on effect. May not react to dependency changes. | **MEDIUM** | Referrals dashboard shows stale data, incorrect metrics | **S** |
| `components/home/PersonalizedRecommendations.tsx` (line 49) | Disabled `react-hooks/exhaustive-deps` on recommendations effect. | **MEDIUM** | Recommendations don't update when user context changes | **S** |
| `app/admin/leads/actions.ts` (line 20) | `no-constant-condition` disable for intentional infinite loop. Well-documented but risky pattern. | **LOW** | Infinite loop if exit condition never met (unlikely but possible) | **S** |
| `app/provider/onboarding/actions.ts` (line 80) | `no-constant-condition` disable for intentional infinite loop. | **LOW** | Infinite loop if exit condition never met | **S** |
| `app/api/blog/generate/route.ts` (line 164) | `no-constant-condition` disable for slug generation loop. | **LOW** | Blog generation hangs if unique slug never found (very unlikely) | **S** |
| `app/api/blog/admin/route.ts` (line 18) | `no-constant-condition` disable for slug generation loop. | **LOW** | Blog admin operations hang if unique slug never found | **S** |

## Complex or Messy State Logic

| File(s) | Description | Risk Level | Business Impact if it Fails | Effort Estimate |
|---------|-------------|------------|----------------------------|-----------------|
| `components/search/SearchBarSticky.tsx` | Complex bidirectional URL param syncing with debouncing. Two useEffects managing state sync between URL and local state. Backward compatibility handling for old params (`loc` vs `town`, `minAge/maxAge` vs `age`). | **MEDIUM** | Search params get out of sync, users lose search state, broken search functionality | **M** |
| `components/search/ResultsSplit.tsx` | Multiple state variables (`selectedId`, `hoveredId`), refs for DOM manipulation, complex memoization, and scroll-into-view logic. Multiple disabled eslint rules suggest fragile dependencies. | **MEDIUM** | Search results interaction breaks, map/list sync issues, poor UX | **M** |
| `components/NewsletterModal.tsx` | Multiple useEffects managing scroll listeners, timers, localStorage, and custom events. Complex conditional logic for when to show modal. | **MEDIUM** | Modal shows at wrong times, memory leaks from uncleaned listeners, localStorage sync issues | **M** |
| `components/SearchFields.tsx` | Complex geolocation detection with fallbacks, reverse geocoding, error handling, and URL param management. Multiple state variables and async operations. | **MEDIUM** | Location detection fails silently, poor error UX, search doesn't work with detected location | **M** |
| `components/blog/AdminBlogsClient.tsx` | Uses `any` type for `selectedPost`, complex state management with transitions, multiple async operations without proper error boundaries. | **LOW** | Type safety issues, potential runtime errors, harder to maintain | **S** |
| `hooks/useMapPreferences.ts` | localStorage synchronization with SSR guards, error handling, and state initialization. Potential race conditions between save and load. | **LOW** | Map preferences don't persist, hydration mismatches, user loses saved map position | **S** |
| `components/search/QuickFilters.tsx` | URL param syncing with debouncing for multiple filter states. Similar pattern to SearchBarSticky. | **LOW** | Filters don't sync with URL, users lose filter state on refresh | **S** |

## UI Components That Are "Good Enough" But Not Ideal

| File(s) | Description | Risk Level | Business Impact if it Fails | Effort Estimate |
|---------|-------------|------------|----------------------------|-----------------|
| `components/providers/landing/ScreenshotGallery.tsx` | Uses emoji placeholders (📊) instead of actual screenshots. No real images of the provider dashboard. | **LOW** | Unprofessional appearance, lower conversion rates, doesn't showcase actual product | **M** |
| `components/search/ResultsSplit.tsx` (line 220) | Distance calculation is placeholder. TODO comment indicates distance should be calculated but currently shows "Distance available" text. | **LOW** | Users can't see how far classes are, less useful search results, poor UX | **M** |
| `components/search/ResultsSplitMap.tsx` | Distance field in MapPoint type is defined but not calculated. Map shows distance in popup but it's always null. | **LOW** | Map doesn't show distances, less useful for users choosing classes | **M** |
| `components/WeatherCard.tsx` | Hardcoded temperature value ("10") in demo component. Not connected to real weather API in all contexts. | **LOW** | Shows incorrect weather, misleading information | **S** |
| `components/demo/PersonalisedHero.tsx` | Hardcoded temperature string. Not using real weather data. | **LOW** | Demo shows fake data, not representative of real experience | **S** |
| `components/claim-listing-dialog.tsx` | Phone number placeholder format may not match UK phone validation expectations. | **LOW** | Users confused by placeholder format, validation issues | **S** |
| `components/send/BadgeSystemPreview.tsx` | Appears to be a preview/placeholder component. May not have full functionality. | **LOW** | Incomplete feature, confusing UX if shown to users | **S** |

## Summary Statistics

- **Total Items**: 23
- **High Risk**: 1
- **Medium Risk**: 11
- **Low Risk**: 11
- **Small Effort (S)**: 12
- **Medium Effort (M)**: 9
- **Large Effort (L)**: 2

## Priority Recommendations

1. **Immediate**: Fix unsafe optional chaining in `app/api/ai/coach/route.ts` (HIGH risk, revenue impact)
2. **Short-term**: Refactor `SearchBarSticky.tsx` URL param syncing (MEDIUM risk, core search functionality)
3. **Short-term**: Fix `react-hooks/exhaustive-deps` issues in search components (MEDIUM risk, user-facing)
4. **Medium-term**: Implement distance calculation in search results (LOW risk, UX improvement)
5. **Medium-term**: Replace placeholder screenshots with real images (LOW risk, conversion optimization)

